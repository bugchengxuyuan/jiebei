import { create } from 'zustand'
import { Expense, Reimbursement, Investment, FinanceConfig, FinanceStats } from './types'
import { db } from '@/db/database'

interface FinanceStore {
  // 数据
  expenses: Expense[]
  reimbursements: Reimbursement[]
  investments: Investment[]
  config: FinanceConfig | null

  // 统计
  stats: FinanceStats | null

  // 加载状态
  isLoading: boolean

  // Actions
  loadData: () => Promise<void>
  calculateStats: () => void

  // 支出相关
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>

  // 报销相关
  addReimbursement: (reimb: Omit<Reimbursement, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>
  updateReimbursement: (id: string, reimb: Partial<Reimbursement>) => Promise<void>
  deleteReimbursement: (id: string) => Promise<void>

  // 投资相关
  addInvestment: (inv: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateInvestment: (id: string, inv: Partial<Investment>) => Promise<void>
  deleteInvestment: (id: string) => Promise<void>

  // 配置相关
  updateConfig: (config: Partial<FinanceConfig>) => Promise<void>
}

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  expenses: [],
  reimbursements: [],
  investments: [],
  config: null,
  stats: null,
  isLoading: true,

  // 加载所有数据
  loadData: async () => {
    try {
      const [expenses, reimbursements, investments, config] = await Promise.all([
        db.expenses.toArray(),
        db.reimbursements.toArray(),
        db.investments.toArray(),
        db.config.get('main'),
      ])

      set({
        expenses,
        reimbursements,
        investments,
        config: config || null,
        isLoading: false,
      })

      get().calculateStats()
    } catch (error) {
      console.error('Failed to load data:', error)
      set({ isLoading: false })
    }
  },

  // 计算统计数据
  calculateStats: () => {
    const { expenses, reimbursements, investments, config } = get()

    if (!config) return

    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const remainingJiebei = config.jiebeiTotal - totalSpent
    const mustKeep = config.jiebeiTotal - config.salary
    const safeToSpend = remainingJiebei - mustKeep

    const totalInvestment = investments
      .filter(inv => inv.status === 'holding')
      .reduce((sum, inv) => sum + inv.amount, 0)
    const remainingInvestment = config.investmentCapital - totalInvestment

    const pendingReimbursement = reimbursements
      .filter(reimb => reimb.status === 'pending')
      .reduce((sum, reimb) => sum + reimb.amount, 0)

    set({
      stats: {
        totalSpent,
        remainingJiebei,
        mustKeep,
        safeToSpend,
        totalInvestment,
        remainingInvestment,
        pendingReimbursement,
      },
    })
  },

  // 添加支出
  addExpense: async (expense) => {
    const newExpense: Expense = {
      ...expense,
      id: `exp_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.expenses.add(newExpense)
    set(state => ({
      expenses: [...state.expenses, newExpense],
    }))
    get().calculateStats()
    return newExpense.id
  },

  // 更新支出
  updateExpense: async (id, expense) => {
    await db.expenses.update(id, {
      ...expense,
      updatedAt: new Date().toISOString(),
    })

    set(state => ({
      expenses: state.expenses.map(exp =>
        exp.id === id ? { ...exp, ...expense, updatedAt: new Date().toISOString() } : exp
      ),
    }))
    get().calculateStats()
  },

  // 删除支出
  deleteExpense: async (id) => {
    const expense = get().expenses.find(exp => exp.id === id)

    // 如果有关联的报销记录，先删除它
    if (expense?.reimbursementId) {
      await db.reimbursements.delete(expense.reimbursementId)
      set(state => ({
        reimbursements: state.reimbursements.filter(r => r.id !== expense.reimbursementId),
      }))
    }

    await db.expenses.delete(id)
    set(state => ({
      expenses: state.expenses.filter(exp => exp.id !== id),
    }))

    get().calculateStats()
  },

  // 添加报销
  addReimbursement: async (reimb) => {
    const newReimb: Reimbursement = {
      ...reimb,
      id: `reimb_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.reimbursements.add(newReimb)
    set(state => ({
      reimbursements: [...state.reimbursements, newReimb],
    }))

    // 如果关联了支出记录，更新支出记录的 reimbursementId
    if (newReimb.expenseId) {
      await get().updateExpense(newReimb.expenseId, {
        reimbursementId: newReimb.id,
      })
    }

    get().calculateStats()
    return newReimb.id
  },

  // 更新报销
  updateReimbursement: async (id, reimb) => {
    await db.reimbursements.update(id, {
      ...reimb,
      updatedAt: new Date().toISOString(),
    })

    set(state => ({
      reimbursements: state.reimbursements.map(r =>
        r.id === id ? { ...r, ...reimb, updatedAt: new Date().toISOString() } : r
      ),
    }))
    get().calculateStats()
  },

  // 删除报销
  deleteReimbursement: async (id) => {
    const reimbursement = get().reimbursements.find(r => r.id === id)

    // 如果有关联的支出记录，清除其 reimbursementId 和 needsReimbursement
    if (reimbursement?.expenseId) {
      await db.expenses.update(reimbursement.expenseId, {
        reimbursementId: undefined,
        needsReimbursement: false,
        updatedAt: new Date().toISOString(),
      })
      set(state => ({
        expenses: state.expenses.map(exp =>
          exp.id === reimbursement.expenseId
            ? { ...exp, reimbursementId: undefined, needsReimbursement: false, updatedAt: new Date().toISOString() }
            : exp
        ),
      }))
    }

    await db.reimbursements.delete(id)
    set(state => ({
      reimbursements: state.reimbursements.filter(r => r.id !== id),
    }))
    get().calculateStats()
  },

  // 添加投资
  addInvestment: async (inv) => {
    const newInv: Investment = {
      ...inv,
      id: `inv_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.investments.add(newInv)
    set(state => ({
      investments: [...state.investments, newInv],
    }))
    get().calculateStats()
  },

  // 更新投资
  updateInvestment: async (id, inv) => {
    await db.investments.update(id, {
      ...inv,
      updatedAt: new Date().toISOString(),
    })

    set(state => ({
      investments: state.investments.map(i =>
        i.id === id ? { ...i, ...inv, updatedAt: new Date().toISOString() } : i
      ),
    }))
    get().calculateStats()
  },

  // 删除投资
  deleteInvestment: async (id) => {
    await db.investments.delete(id)
    set(state => ({
      investments: state.investments.filter(i => i.id !== id),
    }))
    get().calculateStats()
  },

  // 更新配置
  updateConfig: async (configUpdate) => {
    await db.config.update('main', configUpdate)
    set(state => ({
      config: state.config ? { ...state.config, ...configUpdate } : null,
    }))
    get().calculateStats()
  },
}))
