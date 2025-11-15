import type { Budget, BudgetStatus, Expense } from '@/store/types'

/**
 * 计算预算状态
 */
export function calculateBudgetStatus(
  budget: Budget,
  expenses: Expense[]
): BudgetStatus {
  const now = new Date()
  const startDate = new Date(budget.startDate)

  // 计算周期结束日期
  let endDate = new Date(startDate)

  switch (budget.period) {
    case 'daily':
      endDate.setDate(startDate.getDate() + 1)
      break
    case 'weekly':
      endDate.setDate(startDate.getDate() + 7)
      break
    case 'monthly':
      endDate.setMonth(startDate.getMonth() + 1)
      break
    case 'yearly':
      endDate.setFullYear(startDate.getFullYear() + 1)
      break
  }

  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  // 筛选符合条件的支出
  const relevantExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date)
    const matchesDate = expDate >= startDate && expDate < endDate
    const matchesCategory = budget.category === '总预算' || exp.category === budget.category
    const matchesAccountBook = !budget.accountBookId || exp.accountBookId === budget.accountBookId

    return matchesDate && matchesCategory && matchesAccountBook
  })

  const spent = relevantExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  const remaining = budget.amount - spent
  const percentage = (spent / budget.amount) * 100

  // 确定状态
  let status: 'safe' | 'warning' | 'exceeded' = 'safe'
  if (percentage >= 100) {
    status = 'exceeded'
  } else if (percentage >= budget.warningThreshold) {
    status = 'warning'
  }

  return {
    budget,
    spent,
    remaining,
    percentage,
    status,
    daysLeft
  }
}

/**
 * 批量计算所有预算状态
 */
export function calculateAllBudgetStatus(
  budgets: Budget[],
  expenses: Expense[]
): BudgetStatus[] {
  return budgets.map(budget => calculateBudgetStatus(budget, expenses))
}

/**
 * 获取预算建议
 */
export function getBudgetRecommendations(
  expenses: Expense[],
  existingBudgets: Budget[]
): Array<{ category: string; recommendedAmount: number; reason: string }> {
  const recommendations: Array<{ category: string; recommendedAmount: number; reason: string }> = []

  // 最近3个月的数据
  const now = new Date()
  const threeMonthsAgo = new Date(now)
  threeMonthsAgo.setMonth(now.getMonth() - 3)

  const recentExpenses = expenses.filter(e => new Date(e.date) >= threeMonthsAgo)

  // 按类别分组
  const categories = [...new Set(recentExpenses.map(e => e.category))]

  categories.forEach(category => {
    // 如果已有预算，跳过
    if (existingBudgets.some(b => b.category === category && b.period === 'monthly')) {
      return
    }

    const categoryExpenses = recentExpenses.filter(e => e.category === category)
    if (categoryExpenses.length < 3) return

    // 计算月平均
    const totalAmount = categoryExpenses.reduce((sum, e) => sum + e.amount, 0)
    const monthlyAverage = totalAmount / 3

    // 建议预算为平均值的120%（留有余地）
    const recommendedAmount = Math.ceil(monthlyAverage * 1.2 / 100) * 100

    recommendations.push({
      category,
      recommendedAmount,
      reason: `基于最近3个月平均消费¥${monthlyAverage.toFixed(0)}，建议设置¥${recommendedAmount}预算`
    })
  })

  return recommendations.sort((a, b) => b.recommendedAmount - a.recommendedAmount)
}

/**
 * 检查是否超出预算
 */
export function checkBudgetBeforeExpense(
  amount: number,
  category: string,
  budgets: Budget[],
  expenses: Expense[],
  accountBookId?: string
): {
  allowed: boolean
  warnings: string[]
  budgetStatus?: BudgetStatus
} {
  const warnings: string[] = []
  let budgetStatus: BudgetStatus | undefined

  // 查找相关预算
  const relevantBudget = budgets.find(b => {
    const matchesCategory = b.category === category || b.category === '总预算'
    const matchesAccountBook = !b.accountBookId || b.accountBookId === accountBookId
    return matchesCategory && matchesAccountBook
  })

  if (!relevantBudget) {
    return { allowed: true, warnings: [] }
  }

  // 计算当前预算状态
  budgetStatus = calculateBudgetStatus(relevantBudget, expenses)

  // 模拟添加这笔支出后的状态
  const newSpent = budgetStatus.spent + amount
  const newPercentage = (newSpent / relevantBudget.amount) * 100

  if (newPercentage >= 100) {
    warnings.push(`此笔消费将超出${category}预算¥${(newSpent - relevantBudget.amount).toFixed(0)}`)
    return { allowed: false, warnings, budgetStatus }
  }

  if (newPercentage >= relevantBudget.warningThreshold) {
    warnings.push(`此笔消费后将达到预算的${newPercentage.toFixed(0)}%`)
  }

  return { allowed: true, warnings, budgetStatus }
}

/**
 * 生成预算报告
 */
export function generateBudgetReport(
  budgetStatuses: BudgetStatus[]
): {
  totalBudget: number
  totalSpent: number
  safeCount: number
  warningCount: number
  exceededCount: number
  mostExceeded?: BudgetStatus
  bestPerformer?: BudgetStatus
} {
  const totalBudget = budgetStatuses.reduce((sum, bs) => sum + bs.budget.amount, 0)
  const totalSpent = budgetStatuses.reduce((sum, bs) => sum + bs.spent, 0)

  const safeCount = budgetStatuses.filter(bs => bs.status === 'safe').length
  const warningCount = budgetStatuses.filter(bs => bs.status === 'warning').length
  const exceededCount = budgetStatuses.filter(bs => bs.status === 'exceeded').length

  const exceededBudgets = budgetStatuses.filter(bs => bs.status === 'exceeded')
  const mostExceeded = exceededBudgets.sort((a, b) => b.percentage - a.percentage)[0]

  const safeBudgets = budgetStatuses.filter(bs => bs.status === 'safe')
  const bestPerformer = safeBudgets.sort((a, b) => a.percentage - b.percentage)[0]

  return {
    totalBudget,
    totalSpent,
    safeCount,
    warningCount,
    exceededCount,
    mostExceeded,
    bestPerformer
  }
}
