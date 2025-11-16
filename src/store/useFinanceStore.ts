import { create } from 'zustand'
import {
  Expense,
  Reimbursement,
  Investment,
  FinanceConfig,
  FinanceStats,
  Tag,
  AccountBook,
  Budget,
  ExpenseTemplate,
  RecurringExpense
} from './types'
import { db } from '@/db/database'

interface FinanceStore {
  // 数据
  expenses: Expense[]
  reimbursements: Reimbursement[]
  investments: Investment[]
  config: FinanceConfig | null
  tags: Tag[]
  accountBooks: AccountBook[]
  budgets: Budget[]
  expenseTemplates: ExpenseTemplate[]
  recurringExpenses: RecurringExpense[]

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

  // 标签相关
  addTag: (tag: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>
  updateTag: (id: string, tag: Partial<Tag>) => Promise<void>
  deleteTag: (id: string) => Promise<void>

  // 账本相关
  addAccountBook: (book: Omit<AccountBook, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>
  updateAccountBook: (id: string, book: Partial<AccountBook>) => Promise<void>
  deleteAccountBook: (id: string) => Promise<void>
  setDefaultAccountBook: (id: string) => Promise<void>

  // 预算相关
  addBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>
  updateBudget: (id: string, budget: Partial<Budget>) => Promise<void>
  deleteBudget: (id: string) => Promise<void>

  // 支出模板相关
  addExpenseTemplate: (template: Omit<ExpenseTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>
  updateExpenseTemplate: (id: string, template: Partial<ExpenseTemplate>) => Promise<void>
  deleteExpenseTemplate: (id: string) => Promise<void>

  // 周期性支出相关
  addRecurringExpense: (recurring: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>
  updateRecurringExpense: (id: string, recurring: Partial<RecurringExpense>) => Promise<void>
  deleteRecurringExpense: (id: string) => Promise<void>
  executeRecurringExpense: (id: string) => Promise<void>
  checkAndExecuteRecurring: () => Promise<void>
}

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  expenses: [],
  reimbursements: [],
  investments: [],
  config: null,
  tags: [],
  accountBooks: [],
  budgets: [],
  expenseTemplates: [],
  recurringExpenses: [],
  stats: null,
  isLoading: true,

  // 加载所有数据
  loadData: async () => {
    try {
      const [
        expenses,
        reimbursements,
        investments,
        config,
        tags,
        accountBooks,
        budgets,
        expenseTemplates,
        recurringExpenses
      ] = await Promise.all([
        db.expenses.toArray(),
        db.reimbursements.toArray(),
        db.investments.toArray(),
        db.config.get('main'),
        db.tags.toArray(),
        db.accountBooks.toArray(),
        db.budgets.toArray(),
        db.expenseTemplates.toArray(),
        db.recurringExpenses.toArray(),
      ])

      set({
        expenses,
        reimbursements,
        investments,
        config: config || null,
        tags,
        accountBooks,
        budgets,
        expenseTemplates,
        recurringExpenses,
        isLoading: false,
      })

      get().calculateStats()

      // 检查并执行周期性支出
      await get().checkAndExecuteRecurring()
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

  // ===== 标签相关 =====
  addTag: async (tag) => {
    const newTag: Tag = {
      ...tag,
      id: `tag_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.tags.add(newTag)
    set(state => ({
      tags: [...state.tags, newTag],
    }))
    return newTag.id
  },

  updateTag: async (id, tag) => {
    await db.tags.update(id, {
      ...tag,
      updatedAt: new Date().toISOString(),
    })

    set(state => ({
      tags: state.tags.map(t =>
        t.id === id ? { ...t, ...tag, updatedAt: new Date().toISOString() } : t
      ),
    }))
  },

  deleteTag: async (id) => {
    // 删除标签时，需要从所有使用该标签的支出中移除
    const tagToDelete = get().tags.find(t => t.id === id)
    if (tagToDelete) {
      const expensesWithTag = get().expenses.filter(exp =>
        exp.tags?.includes(tagToDelete.name)
      )

      for (const expense of expensesWithTag) {
        await get().updateExpense(expense.id, {
          tags: expense.tags?.filter(t => t !== tagToDelete.name),
        })
      }
    }

    await db.tags.delete(id)
    set(state => ({
      tags: state.tags.filter(t => t.id !== id),
    }))
  },

  // ===== 账本相关 =====
  addAccountBook: async (book) => {
    const newBook: AccountBook = {
      ...book,
      id: `book_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.accountBooks.add(newBook)
    set(state => ({
      accountBooks: [...state.accountBooks, newBook],
    }))

    // 如果这是第一个账本，自动设置为默认
    if (get().accountBooks.length === 1) {
      await get().setDefaultAccountBook(newBook.id)
    }

    return newBook.id
  },

  updateAccountBook: async (id, book) => {
    await db.accountBooks.update(id, {
      ...book,
      updatedAt: new Date().toISOString(),
    })

    set(state => ({
      accountBooks: state.accountBooks.map(b =>
        b.id === id ? { ...b, ...book, updatedAt: new Date().toISOString() } : b
      ),
    }))
  },

  deleteAccountBook: async (id) => {
    const book = get().accountBooks.find(b => b.id === id)

    // 不允许删除默认账本
    if (book?.isDefault) {
      throw new Error('不能删除默认账本')
    }

    // 删除账本时，将该账本下的所有支出移到默认账本
    const defaultBook = get().accountBooks.find(b => b.isDefault)
    if (defaultBook) {
      const expensesInBook = get().expenses.filter(exp => exp.accountBookId === id)
      for (const expense of expensesInBook) {
        await get().updateExpense(expense.id, {
          accountBookId: defaultBook.id,
        })
      }
    }

    await db.accountBooks.delete(id)
    set(state => ({
      accountBooks: state.accountBooks.filter(b => b.id !== id),
    }))
  },

  setDefaultAccountBook: async (id) => {
    // 取消其他账本的默认状态
    const books = get().accountBooks
    for (const book of books) {
      if (book.isDefault && book.id !== id) {
        await get().updateAccountBook(book.id, { isDefault: false })
      }
    }

    // 设置新的默认账本
    await get().updateAccountBook(id, { isDefault: true })

    // 更新配置
    await get().updateConfig({ currentAccountBookId: id })
  },

  // ===== 预算相关 =====
  addBudget: async (budget) => {
    const newBudget: Budget = {
      ...budget,
      id: `budget_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.budgets.add(newBudget)
    set(state => ({
      budgets: [...state.budgets, newBudget],
    }))
    return newBudget.id
  },

  updateBudget: async (id, budget) => {
    await db.budgets.update(id, {
      ...budget,
      updatedAt: new Date().toISOString(),
    })

    set(state => ({
      budgets: state.budgets.map(b =>
        b.id === id ? { ...b, ...budget, updatedAt: new Date().toISOString() } : b
      ),
    }))
  },

  deleteBudget: async (id) => {
    await db.budgets.delete(id)
    set(state => ({
      budgets: state.budgets.filter(b => b.id !== id),
    }))
  },

  // ===== 支出模板相关 =====
  addExpenseTemplate: async (template) => {
    const newTemplate: ExpenseTemplate = {
      ...template,
      id: `template_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.expenseTemplates.add(newTemplate)
    set(state => ({
      expenseTemplates: [...state.expenseTemplates, newTemplate],
    }))
    return newTemplate.id
  },

  updateExpenseTemplate: async (id, template) => {
    await db.expenseTemplates.update(id, {
      ...template,
      updatedAt: new Date().toISOString(),
    })

    set(state => ({
      expenseTemplates: state.expenseTemplates.map(t =>
        t.id === id ? { ...t, ...template, updatedAt: new Date().toISOString() } : t
      ),
    }))
  },

  deleteExpenseTemplate: async (id) => {
    await db.expenseTemplates.delete(id)
    set(state => ({
      expenseTemplates: state.expenseTemplates.filter(t => t.id !== id),
    }))
  },

  // ===== 周期性支出相关 =====
  addRecurringExpense: async (recurring) => {
    const newRecurring: RecurringExpense = {
      ...recurring,
      id: `recurring_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.recurringExpenses.add(newRecurring)
    set(state => ({
      recurringExpenses: [...state.recurringExpenses, newRecurring],
    }))
    return newRecurring.id
  },

  updateRecurringExpense: async (id, recurring) => {
    await db.recurringExpenses.update(id, {
      ...recurring,
      updatedAt: new Date().toISOString(),
    })

    set(state => ({
      recurringExpenses: state.recurringExpenses.map(r =>
        r.id === id ? { ...r, ...recurring, updatedAt: new Date().toISOString() } : r
      ),
    }))
  },

  deleteRecurringExpense: async (id) => {
    await db.recurringExpenses.delete(id)
    set(state => ({
      recurringExpenses: state.recurringExpenses.filter(r => r.id !== id),
    }))
  },

  // 执行周期性支出（创建支出记录）
  executeRecurringExpense: async (id) => {
    const recurring = get().recurringExpenses.find(r => r.id === id)
    if (!recurring || !recurring.enabled) return

    const today = new Date().toISOString().split('T')[0]

    // 创建支出记录
    await get().addExpense({
      date: today,
      category: recurring.category,
      amount: recurring.amount,
      description: `[周期性] ${recurring.description}`,
      needsReimbursement: false,
    })

    // 更新最后执行时间
    await get().updateRecurringExpense(id, {
      lastExecuted: today,
    })
  },

  // 检查并执行所有到期的周期性支出
  checkAndExecuteRecurring: async () => {
    const recurringExpenses = get().recurringExpenses.filter(r => r.enabled)
    const today = new Date()

    for (const recurring of recurringExpenses) {
      let shouldExecute = false
      const lastExecuted = recurring.lastExecuted ? new Date(recurring.lastExecuted) : null

      switch (recurring.frequency) {
        case 'daily':
          // 每天执行
          if (!lastExecuted || lastExecuted.toDateString() !== today.toDateString()) {
            shouldExecute = true
          }
          break

        case 'weekly':
          // 每周特定星期几执行
          if (recurring.dayOfWeek !== undefined && today.getDay() === recurring.dayOfWeek) {
            if (!lastExecuted || today.getTime() - lastExecuted.getTime() > 6 * 24 * 60 * 60 * 1000) {
              shouldExecute = true
            }
          }
          break

        case 'monthly':
          // 每月特定日期执行
          if (recurring.dayOfMonth !== undefined && today.getDate() === recurring.dayOfMonth) {
            if (!lastExecuted || lastExecuted.getMonth() !== today.getMonth()) {
              shouldExecute = true
            }
          }
          break

        case 'yearly':
          // 每年特定月份和日期执行
          if (
            recurring.monthOfYear !== undefined &&
            recurring.dayOfMonth !== undefined &&
            today.getMonth() + 1 === recurring.monthOfYear &&
            today.getDate() === recurring.dayOfMonth
          ) {
            if (!lastExecuted || lastExecuted.getFullYear() !== today.getFullYear()) {
              shouldExecute = true
            }
          }
          break
      }

      // 检查是否在有效期内
      if (shouldExecute) {
        const startDate = new Date(recurring.startDate)
        const endDate = recurring.endDate ? new Date(recurring.endDate) : null

        if (today >= startDate && (!endDate || today <= endDate)) {
          if (recurring.autoCreate) {
            await get().executeRecurringExpense(recurring.id)
          }
        }
      }
    }
  },
}))
