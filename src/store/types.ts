// 支出记录
export interface Expense {
  id: string
  date: string
  category: string
  amount: number
  description: string
  createdAt: string
  updatedAt: string
}

// 报销记录
export interface Reimbursement {
  id: string
  date: string
  item: string
  amount: number
  note: string
  status: 'pending' | 'reimbursed'
  reimbursedDate?: string
  createdAt: string
  updatedAt: string
}

// 投资记录
export interface Investment {
  id: string
  name: string
  type: 'precious_metal' | 'equity' | 'fixed_income'
  amount: number
  status: 'holding' | 'sold'
  note?: string
  purchaseDate: string
  createdAt: string
  updatedAt: string
}

// 财务配置
export interface FinanceConfig {
  id?: string
  jiebeiTotal: number        // 借呗总额度
  salary: number             // 工资
  salaryDate: string         // 工资到账日
  jiebeiDueDate: string      // 借呗还款日
  investmentCapital: number  // 投资本金
}

// 财务统计
export interface FinanceStats {
  totalSpent: number           // 总支出
  remainingJiebei: number      // 剩余借呗
  mustKeep: number             // 必须保留
  safeToSpend: number          // 安全可花
  totalInvestment: number      // 已投资
  remainingInvestment: number  // 剩余可投
  pendingReimbursement: number // 待报销
}
