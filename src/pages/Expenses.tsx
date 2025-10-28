import { useState } from 'react'
import { Plus, Trash2, Copy, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useFinanceStore } from '@/store/useFinanceStore'
import { formatCurrency, formatShortDate } from '@/utils/formatters'
import { EXPENSE_CATEGORIES } from '@/utils/constants'
import type { Expense } from '@/store/types'

export default function Expenses() {
  const { expenses, addExpense, deleteExpense, stats } = useFinanceStore()
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '生活必需',
    amount: '',
    description: '',
  })

  // 常用金额
  const quickAmounts = [10, 20, 50, 100, 200]

  const sortedExpenses = [...expenses].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await addExpense({
      date: formData.date,
      category: formData.category,
      amount: parseFloat(formData.amount),
      description: formData.description,
    })
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: '生活必需',
      amount: '',
      description: '',
    })
    setIsOpen(false)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除这条支出记录吗？')) {
      await deleteExpense(id)
    }
  }

  // 快速设置金额
  const setQuickAmount = (amount: number) => {
    setFormData({ ...formData, amount: amount.toString() })
  }

  // 复制支出（再来一笔）
  const handleCopyExpense = (expense: Expense) => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: expense.category,
      amount: expense.amount.toString(),
      description: expense.description,
    })
    setIsOpen(true)
  }

  // 获取最近5条支出
  const recentExpenses = sortedExpenses.slice(0, 5)

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">支出记录</h1>
          <p className="text-sm text-slate-500 mt-1">
            总计: {formatCurrency(stats?.totalSpent || 0)}
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              添加
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加支出</DialogTitle>
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
                <Label htmlFor="amount">金额</Label>
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
                <Label htmlFor="description">说明</Label>
                <Input
                  id="description"
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="支出说明"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">添加</Button>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  取消
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ⚡ 快速记账 - 最近消费 */}
      {recentExpenses.length > 0 && (
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-600" />
              快速记账
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-slate-600 mb-2">点击"再来一笔"快速复制最近消费</div>
              {recentExpenses.slice(0, 3).map((expense) => {
                const category = EXPENSE_CATEGORIES.find(c => c.value === expense.category)
                return (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-2 bg-white rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xl">{category?.icon || '📝'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800 truncate">
                          {expense.description}
                        </div>
                        <div className="text-xs text-slate-500">
                          {category?.label} · {formatCurrency(expense.amount)}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyExpense(expense)}
                      className="flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <Copy className="w-3 h-3" />
                      再来一笔
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 支出列表 */}
      <div className="space-y-2">
        {sortedExpenses.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-slate-500">
              暂无支出记录
            </CardContent>
          </Card>
        ) : (
          sortedExpenses.map((expense) => {
            const category = EXPENSE_CATEGORIES.find(c => c.value === expense.category)
            return (
              <Card key={expense.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-2xl">{category?.icon || '📝'}</div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-800">{expense.description}</div>
                        <div className="text-xs text-slate-500">
                          {formatShortDate(expense.date)} · {category?.label || expense.category}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-bold text-lg text-red-600">
                          -{formatCurrency(expense.amount)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(expense.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
