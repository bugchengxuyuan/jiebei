import Dexie, { Table } from 'dexie'
import { Expense, Reimbursement, Investment, FinanceConfig } from '@/store/types'

export class FinanceDatabase extends Dexie {
  expenses!: Table<Expense>
  reimbursements!: Table<Reimbursement>
  investments!: Table<Investment>
  config!: Table<FinanceConfig>

  constructor() {
    super('FinanceDatabase')

    // 版本 1：初始版本
    this.version(1).stores({
      expenses: 'id, date, category, amount',
      reimbursements: 'id, date, status, amount',
      investments: 'id, type, status, amount',
      config: 'id',
    })

    // 版本 2：添加支出和报销关联字段
    this.version(2).stores({
      expenses: 'id, date, category, amount, needsReimbursement, reimbursementId',
      reimbursements: 'id, date, status, amount, expenseId',
      investments: 'id, type, status, amount',
      config: 'id',
    })
  }
}

export const db = new FinanceDatabase()
