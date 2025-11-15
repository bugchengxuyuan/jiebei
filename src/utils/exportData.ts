import { Expense, Reimbursement, Investment, FinanceStats } from '@/store/types'
import { formatCurrency, formatShortDate } from './formatters'
import { EXPENSE_CATEGORIES } from './constants'

// 将数据转换为CSV格式
function convertToCSV(data: any[], headers: string[]): string {
  const rows = [headers.join(',')]

  data.forEach(item => {
    const row = headers.map(header => {
      const value = item[header] || ''
      // 处理包含逗号的值
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`
      }
      return value
    })
    rows.push(row.join(','))
  })

  return rows.join('\n')
}

// 下载文件
function downloadFile(content: string, filename: string) {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 导出支出数据
export function exportExpenses(expenses: Expense[]) {
  const data = expenses.map(exp => {
    const category = EXPENSE_CATEGORIES.find(c => c.value === exp.category)
    return {
      '日期': formatShortDate(exp.date),
      '分类': category?.label || exp.category,
      '金额': exp.amount,
      '说明': exp.description,
      '需要报销': exp.needsReimbursement ? '是' : '否',
      '创建时间': formatShortDate(exp.createdAt),
    }
  })

  const csv = convertToCSV(data, ['日期', '分类', '金额', '说明', '需要报销', '创建时间'])
  const filename = `支出记录_${new Date().toISOString().split('T')[0]}.csv`
  downloadFile(csv, filename)
}

// 导出报销数据
export function exportReimbursements(reimbursements: Reimbursement[]) {
  const data = reimbursements.map(reimb => ({
    '支出日期': formatShortDate(reimb.date),
    '报销项目': reimb.item,
    '金额': reimb.amount,
    '备注': reimb.note,
    '状态': reimb.status === 'pending' ? '待报销' : '已报销',
    '报销日期': reimb.reimbursedDate ? formatShortDate(reimb.reimbursedDate) : '-',
    '创建时间': formatShortDate(reimb.createdAt),
  }))

  const csv = convertToCSV(data, ['支出日期', '报销项目', '金额', '备注', '状态', '报销日期', '创建时间'])
  const filename = `报销记录_${new Date().toISOString().split('T')[0]}.csv`
  downloadFile(csv, filename)
}

// 导出投资数据
export function exportInvestments(investments: Investment[]) {
  const data = investments.map(inv => ({
    '名称': inv.name,
    '类型': inv.type === 'precious_metal' ? '贵金属' : inv.type === 'equity' ? '权益类' : '固收类',
    '金额': inv.amount,
    '状态': inv.status === 'holding' ? '持有中' : '已卖出',
    '购买日期': formatShortDate(inv.purchaseDate),
    '备注': inv.note || '-',
  }))

  const csv = convertToCSV(data, ['名称', '类型', '金额', '状态', '购买日期', '备注'])
  const filename = `投资记录_${new Date().toISOString().split('T')[0]}.csv`
  downloadFile(csv, filename)
}

// 导出全部数据
export function exportAllData(
  expenses: Expense[],
  reimbursements: Reimbursement[],
  investments: Investment[],
  stats: FinanceStats | null
) {
  let content = '借呗财务管理系统 - 数据导出报告\n'
  content += `导出时间: ${new Date().toLocaleString('zh-CN')}\n\n`

  // 财务统计
  if (stats) {
    content += '=== 财务统计 ===\n'
    content += `总支出: ${formatCurrency(stats.totalSpent)}\n`
    content += `剩余借呗: ${formatCurrency(stats.remainingJiebei)}\n`
    content += `必须保留: ${formatCurrency(stats.mustKeep)}\n`
    content += `安全可花: ${formatCurrency(stats.safeToSpend)}\n`
    content += `总投资: ${formatCurrency(stats.totalInvestment)}\n`
    content += `待报销: ${formatCurrency(stats.pendingReimbursement)}\n\n`
  }

  // 支出记录
  content += '=== 支出记录 ===\n'
  content += '日期,分类,金额,说明,需要报销\n'
  expenses.forEach(exp => {
    const category = EXPENSE_CATEGORIES.find(c => c.value === exp.category)
    content += `${formatShortDate(exp.date)},${category?.label || exp.category},${exp.amount},${exp.description},${exp.needsReimbursement ? '是' : '否'}\n`
  })
  content += '\n'

  // 报销记录
  content += '=== 报销记录 ===\n'
  content += '支出日期,报销项目,金额,状态,报销日期\n'
  reimbursements.forEach(reimb => {
    content += `${formatShortDate(reimb.date)},${reimb.item},${reimb.amount},${reimb.status === 'pending' ? '待报销' : '已报销'},${reimb.reimbursedDate ? formatShortDate(reimb.reimbursedDate) : '-'}\n`
  })
  content += '\n'

  // 投资记录
  content += '=== 投资记录 ===\n'
  content += '名称,类型,金额,状态,购买日期\n'
  investments.forEach(inv => {
    const type = inv.type === 'precious_metal' ? '贵金属' : inv.type === 'equity' ? '权益类' : '固收类'
    content += `${inv.name},${type},${inv.amount},${inv.status === 'holding' ? '持有中' : '已卖出'},${formatShortDate(inv.purchaseDate)}\n`
  })

  const filename = `财务数据完整导出_${new Date().toISOString().split('T')[0]}.csv`
  downloadFile(content, filename)
}
