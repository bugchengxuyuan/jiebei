import { useState } from 'react'
import { Plus, Trash2, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { useFinanceStore } from '@/store/useFinanceStore'
import { formatCurrency, formatShortDate, formatPercentage } from '@/utils/formatters'
import { INVESTMENT_TYPES } from '@/utils/constants'
import { calculateInvestmentRate } from '@/utils/calculations'

export default function Investment() {
  const { investments, addInvestment, deleteInvestment, stats, config } = useFinanceStore()
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'fixed_income' as 'precious_metal' | 'equity' | 'fixed_income',
    amount: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    note: '',
  })

  const activeInvestments = investments.filter(inv => inv.status === 'holding')

  // 按类型分组
  const groupedInvestments = INVESTMENT_TYPES.map(type => ({
    ...type,
    items: activeInvestments.filter(inv => inv.type === type.value),
    total: activeInvestments
      .filter(inv => inv.type === type.value)
      .reduce((sum, inv) => sum + inv.amount, 0),
  }))

  const investmentRate = config ? calculateInvestmentRate(
    stats?.totalInvestment || 0,
    config.investmentCapital
  ) : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await addInvestment({
      name: formData.name,
      type: formData.type,
      amount: parseFloat(formData.amount),
      purchaseDate: formData.purchaseDate,
      status: 'holding',
      note: formData.note,
    })
    setFormData({
      name: '',
      type: 'fixed_income',
      amount: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      note: '',
    })
    setIsOpen(false)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除这条投资记录吗？')) {
      await deleteInvestment(id)
    }
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">投资资产</h1>
          <p className="text-sm text-slate-500 mt-1">
            持仓: {formatCurrency(stats?.totalInvestment || 0)}
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
              <DialogTitle>添加投资</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">产品名称</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如：黄金ETF"
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">投资类型</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  {INVESTMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="amount">投资金额</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="purchaseDate">购买日期</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="note">备注（可选）</Label>
                <Input
                  id="note"
                  type="text"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="备注信息"
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

      {/* 资产概况 */}
      <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            资产概况
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-sm text-slate-600">投资本金</span>
              <span className="text-xl font-bold">
                {formatCurrency(config?.investmentCapital || 0)}
              </span>
            </div>
            <div className="flex justify-between items-baseline mb-3">
              <span className="text-sm text-slate-600">已投资</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats?.totalInvestment || 0)}
              </span>
            </div>
            <Progress value={investmentRate} className="h-3 mb-2" />
            <div className="flex justify-between text-xs text-slate-500">
              <span>使用率: {formatPercentage(investmentRate)}</span>
              <span>剩余: {formatCurrency(stats?.remainingInvestment || 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 按类型展示 */}
      {groupedInvestments.map((group) => (
        group.items.length > 0 && (
          <Card key={group.value}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-2xl">{group.icon}</span>
                  <span>{group.label}</span>
                </CardTitle>
                <div className={`px-3 py-1 rounded-full bg-${group.color}-100 text-${group.color}-700 font-bold`}>
                  {formatCurrency(group.total)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {group.items.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-slate-800">{inv.name}</div>
                    <div className="text-xs text-slate-500">
                      {formatShortDate(inv.purchaseDate)}
                      {inv.note && ` · ${inv.note}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-slate-800">
                        {formatCurrency(inv.amount)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(inv.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )
      ))}

      {activeInvestments.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-slate-500">
            暂无投资记录
          </CardContent>
        </Card>
      )}
    </div>
  )
}
