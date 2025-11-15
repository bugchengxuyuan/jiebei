// 支出记录
export interface Expense {
  id: string
  date: string
  category: string
  amount: number
  description: string
  needsReimbursement?: boolean  // 是否需要报销
  reimbursementId?: string      // 关联的报销记录ID
  tags?: string[]               // 标签
  accountBookId?: string        // 所属账本ID
  note?: string                 // 备注
  receiptPhoto?: string         // 发票照片URL
  location?: string             // 消费地点
  createdAt: string
  updatedAt: string
}

// 支出模板
export interface ExpenseTemplate {
  id: string
  name: string                  // 模板名称（如"工作日午餐"）
  category: string
  amount: number
  description: string
  needsReimbursement: boolean
  tags?: string[]
  createdAt: string
  updatedAt: string
}

// 周期性支出
export interface RecurringExpense {
  id: string
  name: string                  // 名称（如"房租"）
  category: string
  amount: number
  description: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'  // 周期
  dayOfWeek?: number            // 周几（weekly时使用，0=周日）
  dayOfMonth?: number           // 几号（monthly时使用）
  monthOfYear?: number          // 几月（yearly时使用）
  startDate: string             // 开始日期
  endDate?: string              // 结束日期（可选）
  lastExecuted?: string         // 最后执行日期
  enabled: boolean              // 是否启用
  autoCreate: boolean           // 是否自动创建支出记录
  createdAt: string
  updatedAt: string
}

// 账本
export interface AccountBook {
  id: string
  name: string                  // 账本名称
  description?: string          // 描述
  icon: string                  // 图标
  color: string                 // 颜色
  isDefault: boolean            // 是否默认账本
  createdAt: string
  updatedAt: string
}

// 预算
export interface Budget {
  id: string
  category: string              // 预算类别（可以是expense类别，或"总预算"）
  amount: number                // 预算金额
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'  // 预算周期
  startDate: string             // 预算开始日期
  accountBookId?: string        // 所属账本（可选，为空表示全局）
  warningThreshold: number      // 预警阈值（百分比，如80表示80%时预警）
  createdAt: string
  updatedAt: string
}

// 标签
export interface Tag {
  id: string
  name: string                  // 标签名称
  color: string                 // 标签颜色
  icon?: string                 // 标签图标（可选）
  count?: number                // 使用次数（用于智能推荐）
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
  expenseId?: string            // 关联的支出记录ID
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
  currentAccountBookId?: string  // 当前账本ID
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

// 异常检测结果
export interface AnomalyDetection {
  id: string
  type: 'large_amount' | 'unusual_increase' | 'late_night' | 'unusual_category'
  severity: 'low' | 'medium' | 'high'
  message: string
  expenseId?: string
  category?: string
  amount?: number
  date: string
  suggestions?: string[]
}

// 消费习惯分析结果
export interface ConsumptionHabit {
  type: 'high_frequency' | 'periodic' | 'time_pattern'
  category: string
  description: string
  frequency: number             // 频率（每周/月次数）
  averageAmount: number         // 平均金额
  pattern?: string              // 模式描述
  suggestion?: string           // 建议
}

// 预算状态
export interface BudgetStatus {
  budget: Budget
  spent: number                 // 已花费
  remaining: number             // 剩余
  percentage: number            // 使用百分比
  status: 'safe' | 'warning' | 'exceeded'  // 状态
  daysLeft: number              // 剩余天数
}

// 搜索筛选条件
export interface ExpenseFilter {
  keyword?: string              // 关键词
  categories?: string[]         // 类别
  tags?: string[]               // 标签
  minAmount?: number            // 最小金额
  maxAmount?: number            // 最大金额
  startDate?: string            // 开始日期
  endDate?: string              // 结束日期
  accountBookId?: string        // 账本ID
  needsReimbursement?: boolean  // 是否需要报销
}

// 排序选项
export type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'category'
