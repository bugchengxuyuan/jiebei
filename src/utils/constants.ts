// 支出分类
export const EXPENSE_CATEGORIES = [
  { value: '饮食', label: '饮食', icon: '🍜' },
  { value: '购物', label: '购物', icon: '🛍️' },
  { value: '居住', label: '居住', icon: '🏠' },
  { value: '交通', label: '交通', icon: '🚗' },
  { value: '通讯', label: '通讯', icon: '📱' },
  { value: '娱乐', label: '娱乐', icon: '🎮' },
  { value: '信用还款', label: '信用还款', icon: '💳' },
  { value: '生活必需', label: '生活必需', icon: '🛒' },
  { value: '娱乐消费', label: '娱乐消费', icon: '🎬' },
] as const

// 投资类型
export const INVESTMENT_TYPES = [
  { value: 'precious_metal', label: '贵金属', icon: '🏆', color: 'yellow' },
  { value: 'equity', label: '权益类', icon: '📈', color: 'blue' },
  { value: 'fixed_income', label: '固收类', icon: '🏦', color: 'green' },
] as const
