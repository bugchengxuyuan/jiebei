// 格式化金额
export function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`
}

// 格式化日期
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// 格式化简短日期
export function formatShortDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  })
}

// 格式化百分比
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}
