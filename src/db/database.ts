import Dexie, { Table } from 'dexie'
import { Expense, Reimbursement, Investment, FinanceConfig } from '@/store/types'

export class FinanceDatabase extends Dexie {
  expenses!: Table<Expense>
  reimbursements!: Table<Reimbursement>
  investments!: Table<Investment>
  config!: Table<FinanceConfig>

  constructor() {
    super('FinanceDatabase')

    this.version(1).stores({
      expenses: 'id, date, category, amount',
      reimbursements: 'id, date, status, amount',
      investments: 'id, type, status, amount',
      config: 'id',
    })
  }
}

export const db = new FinanceDatabase()
