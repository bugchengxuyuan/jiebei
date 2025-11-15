import Dexie, { Table } from 'dexie'
import {
  Expense,
  Reimbursement,
  Investment,
  FinanceConfig,
  ExpenseTemplate,
  RecurringExpense,
  AccountBook,
  Budget,
  Tag
} from '@/store/types'

export class FinanceDatabase extends Dexie {
  expenses!: Table<Expense>
  reimbursements!: Table<Reimbursement>
  investments!: Table<Investment>
  config!: Table<FinanceConfig>
  expenseTemplates!: Table<ExpenseTemplate>
  recurringExpenses!: Table<RecurringExpense>
  accountBooks!: Table<AccountBook>
  budgets!: Table<Budget>
  tags!: Table<Tag>

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

    // 版本 3：添加标签、账本、预算、模板、周期性支出功能
    this.version(3).stores({
      expenses: 'id, date, category, amount, needsReimbursement, reimbursementId, accountBookId, *tags',
      reimbursements: 'id, date, status, amount, expenseId',
      investments: 'id, type, status, amount',
      config: 'id',
      expenseTemplates: 'id, name, category',
      recurringExpenses: 'id, name, frequency, enabled',
      accountBooks: 'id, name, isDefault',
      budgets: 'id, category, period, accountBookId',
      tags: 'id, name',
    })
  }
}

export const db = new FinanceDatabase()
