import { useState, useMemo, useEffect } from 'react'
import {
  Plus, Trash2, TrendingUp, PieChart as PieChartIcon, Calendar,
  BarChart3, Edit, Search, SlidersHorizontal, CheckSquare, Square,
  AlertTriangle, Lightbulb, ChevronDown, ChevronUp, Filter
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useFinanceStore } from '@/store/useFinanceStore'
import { formatCurrency, formatShortDate } from '@/utils/formatters'
import { EXPENSE_CATEGORIES } from '@/utils/constants'
import type { Expense, SortOption } from '@/store/types'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { detectAllAnomalies } from '@/utils/expenseAnalytics'
import { getDescriptionSuggestions, getAmountRecommendations } from '@/utils/smartInput'

type TimeFilter = 'today' | 'week' | 'month' | 'all'

export default function Expenses() {
  const { expenses, addExpense, updateExpense, deleteExpense, addReimbursement, updateReimbursement, reimbursements, stats } = useFinanceStore()

  // 基础状态
  const [isOpen, setIsOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // 高级筛选状态
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // 排序状态
  const [sortBy, setSortBy] = useState<SortOption>('date-desc')

  // 批量操作状态
  const [batchMode, setBatchMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // 分组显示状态
  const [groupByDate, setGroupByDate] = useState(true)

  // 表单状态
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '生活必需',
    amount: '',
    description: '',
    needsReimbursement: false,
    tags: [] as string[],
    note: ''
  })

  // 智能输入状态
  const [descriptionSuggestions, setDescriptionSuggestions] = useState<string[]>([])
  const [amountRecommendation, setAmountRecommendation] = useState<{min: number; max: number; avg: number; mode: number} | null>(null)

  // 常用金额
  const quickAmounts = [10, 20, 50, 100, 200]

  // 异常检测
  const anomalies = useMemo(() => detectAllAnomalies(expenses), [expenses])

  // 智能描述建议
  useEffect(() => {
    if (formData.description.length >= 1) {
      const suggestions = getDescriptionSuggestions(formData.description, expenses, 5)
      setDescriptionSuggestions(suggestions)

      const amountRec = getAmountRecommendations(formData.description, formData.category, expenses)
      setAmountRecommendation(amountRec)
    } else {
      setDescriptionSuggestions([])
      setAmountRecommendation(null)
    }
  }, [formData.description, formData.category, expenses])

  // 高级筛选逻辑
  const filteredExpenses = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    return expenses.filter(exp => {
      const expDate = new Date(exp.date)
      expDate.setHours(0, 0, 0, 0)

      // 时间筛选
      let timeMatch = true
      switch (timeFilter) {
        case 'today':
          timeMatch = expDate.getTime() === now.getTime()
          break
        case 'week':
          const weekAgo = new Date(now)
          weekAgo.setDate(weekAgo.getDate() - 7)
          timeMatch = expDate >= weekAgo
          break
        case 'month':
          const monthAgo = new Date(now)
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          timeMatch = expDate >= monthAgo
          break
        default:
          timeMatch = true
      }

      // 类别筛选
      const categoryMatch = categoryFilter === 'all' || exp.category === categoryFilter

      // 关键词搜索
      const keywordMatch = !searchKeyword ||
        exp.description.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        exp.category.toLowerCase().includes(searchKeyword.toLowerCase())

      // 金额范围筛选
      const minMatch = !minAmount || exp.amount >= parseFloat(minAmount)
      const maxMatch = !maxAmount || exp.amount <= parseFloat(maxAmount)

      // 日期范围筛选
      const startMatch = !startDate || exp.date >= startDate
      const endMatch = !endDate || exp.date <= endDate

      return timeMatch && categoryMatch && keywordMatch && minMatch && maxMatch && startMatch && endMatch
    })
  }, [expenses, timeFilter, categoryFilter, searchKeyword, minAmount, maxAmount, startDate, endDate])

  // 排序逻辑
  const sortedExpenses = useMemo(() => {
    const sorted = [...filteredExpenses]
    switch (sortBy) {
      case 'date-desc':
        return sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      case 'date-asc':
        return sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      case 'amount-desc':
        return sorted.sort((a, b) => b.amount - a.amount)
      case 'amount-asc':
        return sorted.sort((a, b) => a.amount - b.amount)
      case 'category':
        return sorted.sort((a, b) => a.category.localeCompare(b.category))
      default:
        return sorted
    }
  }, [filteredExpenses, sortBy])

  // 按日期分组
  const groupedExpenses = useMemo(() => {
    if (!groupByDate) return null

    const groups: Record<string, Expense[]> = {}
    sortedExpenses.forEach(exp => {
      if (!groups[exp.date]) {
        groups[exp.date] = []
      }
      groups[exp.date].push(exp)
    })

    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
  }, [sortedExpenses, groupByDate])

  // 统计数据
  const statistics = useMemo(() => {
    const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    const count = filteredExpenses.length
    const avg = count > 0 ? total / count : 0
    const max = count > 0 ? Math.max(...filteredExpenses.map(e => e.amount)) : 0

    // 按分类统计
    const byCategory = EXPENSE_CATEGORIES.map(cat => {
      const categoryExpenses = filteredExpenses.filter(e => e.category === cat.value)
      const amount = categoryExpenses.reduce((sum, e) => sum + e.amount, 0)
      const percentage = total > 0 ? (amount / total) * 100 : 0
      return {
        ...cat,
        amount,
        count: categoryExpenses.length,
        percentage
      }
    }).filter(c => c.count > 0).sort((a, b) => b.amount - a.amount)

    return {
      total,
      count,
      avg,
      max,
      byCategory
    }
  }, [filteredExpenses])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingExpense) {
      // 编辑模式
      await updateExpense(editingExpense.id, {
        date: formData.date,
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description,
        needsReimbursement: formData.needsReimbursement,
        tags: formData.tags,
        note: formData.note
      })

      if (editingExpense.reimbursementId) {
        await updateReimbursement(editingExpense.reimbursementId, {
          date: formData.date,
          item: formData.description,
          amount: parseFloat(formData.amount),
          note: `${EXPENSE_CATEGORIES.find(c => c.value === formData.category)?.label || ''}支出`,
        })
      }
    } else {
      // 添加模式
      const expenseId = await addExpense({
        date: formData.date,
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description,
        needsReimbursement: formData.needsReimbursement,
        tags: formData.tags,
        note: formData.note
      })

      if (formData.needsReimbursement && expenseId) {
        await addReimbursement({
          date: formData.date,
          item: formData.description,
          amount: parseFloat(formData.amount),
          note: `${EXPENSE_CATEGORIES.find(c => c.value === formData.category)?.label || ''}支出`,
          status: 'pending',
          expenseId: expenseId,
        })
      }
    }

    resetForm()
  }

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: '生活必需',
      amount: '',
      description: '',
      needsReimbursement: false,
      tags: [],
      note: ''
    })
    setEditingExpense(null)
    setIsOpen(false)
    setDescriptionSuggestions([])
    setAmountRecommendation(null)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除这条支出记录吗？')) {
      await deleteExpense(id)
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({
      date: expense.date,
      category: expense.category,
      amount: expense.amount.toString(),
      description: expense.description,
      needsReimbursement: expense.needsReimbursement || false,
      tags: expense.tags || [],
      note: expense.note || ''
    })
    setIsOpen(true)
  }

  const setQuickAmount = (amount: number) => {
    setFormData({ ...formData, amount: amount.toString() })
  }

  // 批量操作
  const toggleSelectAll = () => {
    if (selectedIds.size === sortedExpenses.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(sortedExpenses.map(e => e.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return
    if (window.confirm(`确定要删除选中的 ${selectedIds.size} 条记录吗？`)) {
      for (const id of selectedIds) {
        await deleteExpense(id)
      }
      setSelectedIds(new Set())
      setBatchMode(false)
    }
  }

  const clearAllFilters = () => {
    setSearchKeyword('')
    setMinAmount('')
    setMaxAmount('')
    setStartDate('')
    setEndDate('')
    setCategoryFilter('all')
    setTimeFilter('all')
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto pb-20 md:pb-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">支出管理</h1>
          <p className="text-sm text-slate-500 mt-1">
            全部: {formatCurrency(stats?.totalSpent || 0)} · {expenses.length} 笔记录
          </p>
        </div>
        <div className="flex gap-2">
          {batchMode && (
            <Button
              variant="destructive"
              onClick={handleBatchDelete}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              删除 ({selectedIds.size})
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setBatchMode(!batchMode)
              setSelectedIds(new Set())
            }}
          >
            {batchMode ? '取消批量' : '批量操作'}
          </Button>
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                添加支出
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingExpense ? '编辑支出' : '添加支出'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="date">日期</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">分类</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="description">说明</Label>
                  <Input
                    id="description"
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="支出说明"
                    required
                    autoComplete="off"
                  />
                  {descriptionSuggestions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {descriptionSuggestions.map((suggestion, idx) => (
                        <Button
                          key={idx}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mr-2 text-xs"
                          onClick={() => setFormData({ ...formData, description: suggestion })}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="amount">金额</Label>
                  {amountRecommendation && (
                    <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                      <Lightbulb className="w-3 h-3 inline mr-1" />
                      建议金额: ¥{amountRecommendation.mode} (常见) |
                      平均: ¥{amountRecommendation.avg.toFixed(0)} |
                      范围: ¥{amountRecommendation.min}-¥{amountRecommendation.max}
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex gap-2 flex-wrap">
                      {quickAmounts.map((amount) => (
                        <Button
                          key={amount}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setQuickAmount(amount)}
                          className={formData.amount === amount.toString() ? 'bg-blue-100 border-blue-300' : ''}
                        >
                          ¥{amount}
                        </Button>
                      ))}
                      {amountRecommendation && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setQuickAmount(amountRecommendation.mode)}
                          className="bg-green-50 border-green-300"
                        >
                          ¥{amountRecommendation.mode} ⭐
                        </Button>
                      )}
                    </div>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="或输入自定义金额"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="note">备注（可选）</Label>
                  <Input
                    id="note"
                    type="text"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="添加备注信息"
                  />
                </div>
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <input
                    id="needsReimbursement"
                    type="checkbox"
                    checked={formData.needsReimbursement}
                    onChange={(e) => setFormData({ ...formData, needsReimbursement: e.target.checked })}
                    className="w-4 h-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                  />
                  <Label htmlFor="needsReimbursement" className="text-sm font-medium text-amber-900 cursor-pointer">
                    💰 需要报销（将自动创建报销记录）
                  </Label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingExpense ? '保存' : '添加'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    取消
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 异常检测提示 */}
      {anomalies.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="font-semibold mb-1">检测到 {anomalies.length} 条异常提示</div>
            <div className="text-sm space-y-1">
              {anomalies.slice(0, 3).map((anomaly, idx) => (
                <div key={idx}>• {anomaly.message}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* 搜索栏 */}
      <Card className="border-2 border-slate-200">
        <CardContent className="pt-4 pb-4">
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="搜索支出描述或类别..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                高级筛选
                {showAdvancedFilter ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>

            {showAdvancedFilter && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t">
                <div>
                  <Label className="text-xs">最小金额</Label>
                  <Input
                    type="number"
                    placeholder="¥0"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">最大金额</Label>
                  <Input
                    type="number"
                    placeholder="¥999999"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">开始日期</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">结束日期</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="col-span-full flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllFilters}
                    className="flex items-center gap-1"
                  >
                    <Filter className="w-3 h-3" />
                    清除筛选
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 时间筛选和排序 */}
      <div className="flex flex-col md:flex-row gap-3">
        <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)} className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="today">今天</TabsTrigger>
            <TabsTrigger value="week">本周</TabsTrigger>
            <TabsTrigger value="month">本月</TabsTrigger>
            <TabsTrigger value="all">全部</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="date-desc">日期↓</option>
            <option value="date-asc">日期↑</option>
            <option value="amount-desc">金额↓</option>
            <option value="amount-asc">金额↑</option>
            <option value="category">分类</option>
          </select>

          <Button
            variant="outline"
            onClick={() => setGroupByDate(!groupByDate)}
            className="whitespace-nowrap"
          >
            {groupByDate ? '取消分组' : '按日期分组'}
          </Button>
        </div>
      </div>

      {/* 类别筛选 */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <PieChartIcon className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-900">按类型筛选</span>
            {categoryFilter !== 'all' && (
              <span className="text-xs text-purple-600 font-medium">
                · {formatCurrency(statistics.total)}
              </span>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Button
              variant={categoryFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter('all')}
              className={categoryFilter === 'all' ? 'bg-purple-600 hover:bg-purple-700' : 'hover:bg-purple-50'}
            >
              全部类型
            </Button>
            {EXPENSE_CATEGORIES.map((cat) => {
              const catExpenses = filteredExpenses.filter(e => e.category === cat.value)
              const hasExpenses = catExpenses.length > 0

              if (!hasExpenses && timeFilter !== 'all') return null

              return (
                <Button
                  key={cat.value}
                  variant={categoryFilter === cat.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter(cat.value)}
                  className={categoryFilter === cat.value
                    ? 'bg-purple-600 hover:bg-purple-700 whitespace-nowrap'
                    : 'hover:bg-purple-50 whitespace-nowrap'
                  }
                >
                  {cat.icon} {cat.label}
                  {categoryFilter === 'all' && catExpenses.length > 0 && (
                    <span className="ml-1 text-xs opacity-75">
                      ({catExpenses.length})
                    </span>
                  )}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-2 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-600">总支出</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-blue-600">
              {formatCurrency(statistics.total)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              共 {statistics.count} 笔
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-slate-600">平均消费</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-green-600">
              {formatCurrency(statistics.avg)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              最高 {formatCurrency(statistics.max)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 分类统计饼图 */}
      {statistics.byCategory.length > 0 && (
        <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-indigo-600" />
              分类支出占比
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="w-full lg:w-1/2 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statistics.byCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.label} ${entry.percentage.toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {statistics.byCategory.map((_entry, index) => {
                        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      })}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 w-full space-y-2">
                {statistics.byCategory.map((cat, index) => {
                  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
                  return (
                    <div key={cat.value} className="flex items-center justify-between p-2 bg-white rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        />
                        <span className="text-xl">{cat.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium text-slate-800">{cat.label}</div>
                          <div className="text-xs text-slate-500">{cat.count} 笔</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-800">
                          {formatCurrency(cat.amount)}
                        </div>
                        <div className="text-xs text-indigo-600 font-medium">
                          {cat.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 支出列表 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            支出明细 ({sortedExpenses.length})
            {batchMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="ml-2"
              >
                {selectedIds.size === sortedExpenses.length ? (
                  <>
                    <CheckSquare className="w-4 h-4 mr-1" />
                    全不选
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 mr-1" />
                    全选
                  </>
                )}
              </Button>
            )}
          </h3>
        </div>

        {sortedExpenses.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-slate-500">
              暂无支出记录
            </CardContent>
          </Card>
        ) : groupByDate && groupedExpenses ? (
          // 分组显示
          groupedExpenses.map(([date, exps]) => {
            const dayTotal = exps.reduce((sum, e) => sum + e.amount, 0)
            return (
              <div key={date} className="space-y-2">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-600" />
                    <span className="font-medium text-slate-700">
                      {new Date(date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
                    </span>
                    <span className="text-sm text-slate-500">({exps.length}笔)</span>
                  </div>
                  <span className="font-bold text-slate-700">{formatCurrency(dayTotal)}</span>
                </div>
                {exps.map((expense) => {
                  const category = EXPENSE_CATEGORIES.find(c => c.value === expense.category)
                  const reimbursement = expense.reimbursementId
                    ? reimbursements.find(r => r.id === expense.reimbursementId)
                    : null

                  return (
                    <Card key={expense.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          {batchMode && (
                            <div className="mr-3">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleSelect(expense.id)}
                              >
                                {selectedIds.has(expense.id) ? (
                                  <CheckSquare className="w-5 h-5 text-blue-600" />
                                ) : (
                                  <Square className="w-5 h-5 text-slate-400" />
                                )}
                              </Button>
                            </div>
                          )}
                          <div className="flex items-center gap-3 flex-1">
                            <div className="text-2xl">{category?.icon || '📝'}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-800">{expense.description}</span>
                                {expense.needsReimbursement && (
                                  reimbursement?.status === 'reimbursed' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                      ✓ 已报销
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                                      💰 待报销
                                    </span>
                                  )
                                )}
                                {expense.note && (
                                  <span className="text-xs text-slate-500">📝 {expense.note}</span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500">
                                {formatShortDate(expense.date)} · {category?.label || expense.category}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="font-bold text-lg text-red-600">
                                -{formatCurrency(expense.amount)}
                              </div>
                            </div>
                            {!batchMode && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditExpense(expense)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  title="编辑"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(expense.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="删除"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )
          })
        ) : (
          // 常规列表显示
          sortedExpenses.map((expense) => {
            const category = EXPENSE_CATEGORIES.find(c => c.value === expense.category)
            const reimbursement = expense.reimbursementId
              ? reimbursements.find(r => r.id === expense.reimbursementId)
              : null

            return (
              <Card key={expense.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {batchMode && (
                      <div className="mr-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSelect(expense.id)}
                        >
                          {selectedIds.has(expense.id) ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400" />
                          )}
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-2xl">{category?.icon || '📝'}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">{expense.description}</span>
                          {expense.needsReimbursement && (
                            reimbursement?.status === 'reimbursed' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                ✓ 已报销
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                                💰 待报销
                              </span>
                            )
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatShortDate(expense.date)} · {category?.label || expense.category}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-bold text-lg text-red-600">
                          -{formatCurrency(expense.amount)}
                        </div>
                      </div>
                      {!batchMode && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditExpense(expense)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="编辑"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(expense.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
