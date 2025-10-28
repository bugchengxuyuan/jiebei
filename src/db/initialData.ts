import { Expense, Reimbursement, Investment, FinanceConfig } from '@/store/types'
import { db } from './database'

// 初始配置
export const initialConfig: FinanceConfig = {
  id: 'main',
  jiebeiTotal: 5000,
  salary: 3500,
  salaryDate: '2025-11-15',
  jiebeiDueDate: '2025-11-19',
  investmentCapital: 89856.76,
}

// 初始支出数据（从Excel导入）
export const initialExpenses: Expense[] = [
  {
    id: 'exp_1',
    date: '2025-10-20',
    category: '信用还款',
    amount: 1231.45,
    description: '花呗',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'exp_2',
    date: '2025-10-21',
    category: '生活必需',
    amount: 10,
    description: '饮食',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'exp_3',
    date: '2025-10-22',
    category: '生活必需',
    amount: 12,
    description: '饮食',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'exp_4',
    date: '2025-10-27',
    category: '生活必需',
    amount: 20,
    description: '饮食',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'exp_5',
    date: '2025-10-25',
    category: '生活必需',
    amount: 10,
    description: '话费充值',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'exp_6',
    date: '2025-10-24',
    category: '娱乐消费',
    amount: 25,
    description: '虚拟充值',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'exp_7',
    date: '2025-10-28',
    category: '信用还款',
    amount: 1153.61,
    description: '白条',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// 初始报销数据
export const initialReimbursements: Reimbursement[] = [
  {
    id: 'reimb_1',
    date: '2025-10-21',
    item: '工作支出',
    amount: 159.2,
    note: '需报销',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'reimb_2',
    date: '2025-10-25',
    item: '工作支出',
    amount: 8,
    note: '顺丰速运',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// 初始投资数据
export const initialInvestments: Investment[] = [
  {
    id: 'inv_1',
    name: '黄金ETF',
    type: 'precious_metal',
    amount: 32201.1,
    status: 'holding',
    purchaseDate: '2025-10-14',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv_2',
    name: '国投瑞银白银期货(LOF)C',
    type: 'precious_metal',
    amount: 2000,
    status: 'holding',
    purchaseDate: '2025-10-20',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv_3',
    name: '恒生科技ETF',
    type: 'equity',
    amount: 14996.6,
    status: 'holding',
    note: '港股科技',
    purchaseDate: '2025-10-21',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv_4',
    name: '易方达安心回报债券A',
    type: 'fixed_income',
    amount: 13000,
    status: 'holding',
    note: '债券基金',
    purchaseDate: '2025-10-20',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv_5',
    name: '工银瑞信增益中短债',
    type: 'fixed_income',
    amount: 7000,
    status: 'holding',
    note: '短债基金',
    purchaseDate: '2025-10-20',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv_6',
    name: '易方达天天理财货币A',
    type: 'fixed_income',
    amount: 10000,
    status: 'holding',
    note: '货币基金',
    purchaseDate: '2025-10-20',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv_7',
    name: '上证转债',
    type: 'fixed_income',
    amount: 5001.8,
    status: 'holding',
    note: '可转债',
    purchaseDate: '2025-10-21',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// 初始化数据库
export async function initializeDatabase() {
  // 检查是否已初始化
  const existingConfig = await db.config.get('main')
  if (existingConfig) {
    return // 已经初始化过了
  }

  // 插入初始数据
  await db.config.add(initialConfig)
  await db.expenses.bulkAdd(initialExpenses)
  await db.reimbursements.bulkAdd(initialReimbursements)
  await db.investments.bulkAdd(initialInvestments)
}
