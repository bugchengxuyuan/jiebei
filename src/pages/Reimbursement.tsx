import { useState, useMemo } from 'react'
import { Plus, Check, Trash2, Clock, BarChart3, Calendar, Zap, Copy, Undo2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFinanceStore } from '@/store/useFinanceStore'
import { formatCurrency, formatShortDate } from '@/utils/formatters'
import type { Reimbursement } from '@/store/types'

export default function Reimbursement() {
  const { reimbursements, addReimbursement, updateReimbursement, deleteReimbursement, stats } = useFinanceStore()
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    item: '',
    amount: '',
    note: '',
  })

  const pendingReimbs = reimbursements.filter(r => r.status === 'pending')
  const reimbursedReimbs = reimbursements.filter(r => r.status === 'reimbursed')

  // 统计数据
  const statistics = useMemo(() => {
    const totalPending = pendingReimbs.reduce((sum, r) => sum + r.amount, 0)
    const totalReimbursed = reimbursedReimbs.reduce((sum, r) => sum + r.amount, 0)
    const totalAll = totalPending + totalReimbursed
    const avgReimb = reimbursements.length > 0 ? totalAll / reimbursements.length : 0
    const maxReimb = reimbursements.length > 0 ? Math.max(...reimbursements.map(r => r.amount)) : 0

    // 计算平均报销时长
    const avgDays = reimbursedReimbs.length > 0
      ? reimbursedReimbs.reduce((sum, r) => {
          if (r.reimbursedDate) {
            const days = Math.floor(
              (new Date(r.reimbursedDate).getTime() - new Date(r.date).getTime()) /
              (1000 * 60 * 60 * 24)
            )
            return sum + days
          }
          return sum
        }, 0) / reimbursedReimbs.length
      : 0

    // 最近6个月趋势
    const last6Months = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStr = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'numeric' })

      const monthReimbs = reimbursedReimbs.filter(r => {
        if (!r.reimbursedDate) return false
        const rDate = new Date(r.reimbursedDate)
        return rDate.getMonth() === date.getMonth() && rDate.getFullYear() === date.getFullYear()
      })

      last6Months.push({
        month: monthStr,
        count: monthReimbs.length,
        amount: monthReimbs.reduce((sum, r) => sum + r.amount, 0)
      })
    }

    return {
      totalPending,
      totalReimbursed,
      totalAll,
      avgReimb,
      maxReimb,
      avgDays,
      last6Months
    }
  }, [reimbursements, pendingReimbs, reimbursedReimbs])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await addReimbursement({
      date: formData.date,
      item: formData.item,
      amount: parseFloat(formData.amount),
      note: formData.note,
      status: 'pending',
    })
    setFormData({
      date: new Date().toISOString().split('T')[0],
      item: '',
      amount: '',
      note: '',
    })
    setIsOpen(false)
  }

  const handleMarkReimbursed = async (id: string) => {
    await updateReimbursement(id, {
      status: 'reimbursed',
      reimbursedDate: new Date().toISOString().split('T')[0],
    })
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除这条报销记录吗？')) {
      await deleteReimbursement(id)
    }
  }

  // 撤销报销
  const handleUndoReimbursement = async (id: string) => {
    if (window.confirm('确定要撤销这条报销记录吗？将恢复为待报销状态。')) {
      await updateReimbursement(id, {
        status: 'pending',
        reimbursedDate: undefined,
      })
    }
  }

  // 快速复制报销项
  const handleCopyReimbursement = (reimb: Reimbursement) => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      item: reimb.item,
      amount: reimb.amount.toString(),
      note: reimb.note,
    })
    setIsOpen(true)
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-20">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">报销分析</h1>
          <p className="text-sm text-slate-500 mt-1">
            待报销: {formatCurrency(stats?.pendingReimbursement || 0)}
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
              <DialogTitle>添加报销项</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="date">支出日期</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="item">报销项目</Label>
                <Input
                  id="item"
                  type="text"
                  value={formData.item}
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                  placeholder="如：工作支出"
                  required
                />
              </div>
              <div>
                <Label htmlFor="amount">金额</Label>
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
                <Label htmlFor="note">备注</Label>
                <Input
                  id="note"
                  type="text"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="详细说明"
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

      {/* 📊 报销统计卡片 */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-slate-600">待报销</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(statistics.totalPending)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {pendingReimbs.length} 笔待收回
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-slate-600">已报销</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(statistics.totalReimbursed)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {reimbursedReimbs.length} 笔已到账
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 📈 报销分析 */}
      <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            报销分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-xs text-slate-600 mb-1">平均单笔</div>
              <div className="text-xl font-bold text-indigo-600">
                {formatCurrency(statistics.avgReimb)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-600 mb-1">最大单笔</div>
              <div className="text-xl font-bold text-purple-600">
                {formatCurrency(statistics.maxReimb)}
              </div>
            </div>
          </div>
          {statistics.avgDays > 0 && (
            <div className="mt-4 pt-4 border-t border-indigo-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">平均报销时长</span>
                <span className="font-bold text-indigo-600">
                  {Math.round(statistics.avgDays)} 天
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 📅 月度报销趋势 */}
      {statistics.last6Months.some(m => m.count > 0) && (
        <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              月度趋势（最近6个月）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statistics.last6Months.filter(m => m.count > 0).map((month, index) => {
                const maxAmount = Math.max(...statistics.last6Months.map(m => m.amount))
                const percentage = maxAmount > 0 ? (month.amount / maxAmount) * 100 : 0
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="text-xs font-medium text-slate-600 w-16">
                      {month.month.replace(/\//g, '/')}
                    </div>
                    <div className="flex-1">
                      <div className="h-6 bg-teal-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm font-bold text-slate-700 w-24 text-right">
                      {formatCurrency(month.amount)}
                    </div>
                    <div className="text-xs text-slate-500 w-12 text-right">
                      {month.count}笔
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ⚡ 快速报销 */}
      {reimbursedReimbs.length > 0 && (
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-600" />
              快速报销
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-slate-600 mb-2">点击"再报一次"快速复制报销项</div>
              {reimbursedReimbs.slice(0, 3).map((reimb) => (
                <div
                  key={reimb.id}
                  className="flex items-center justify-between p-2 bg-white rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">
                      {reimb.item}
                    </div>
                    <div className="text-xs text-slate-500">
                      {reimb.note} · {formatCurrency(reimb.amount)}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyReimbursement(reimb)}
                    className="flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50 ml-2"
                  >
                    <Copy className="w-3 h-3" />
                    再报一次
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 报销列表 */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            待报销 ({pendingReimbs.length})
          </TabsTrigger>
          <TabsTrigger value="reimbursed">
            已报销 ({reimbursedReimbs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-2 mt-4">
          {pendingReimbs.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-slate-500">
                暂无待报销项目
              </CardContent>
            </Card>
          ) : (
            pendingReimbs
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((reimb) => (
                <Card key={reimb.id} className="border-orange-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-slate-800">{reimb.item}</div>
                        <div className="text-sm text-slate-600 mt-1">{reimb.note}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {formatShortDate(reimb.date)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-bold text-lg text-orange-600">
                            {formatCurrency(reimb.amount)}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleMarkReimbursed(reimb.id)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(reimb.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="reimbursed" className="space-y-2 mt-4">
          {reimbursedReimbs.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-slate-500">
                暂无已报销记录
              </CardContent>
            </Card>
          ) : (
            reimbursedReimbs
              .sort((a, b) => {
                const dateA = a.reimbursedDate ? new Date(a.reimbursedDate).getTime() : 0
                const dateB = b.reimbursedDate ? new Date(b.reimbursedDate).getTime() : 0
                return dateB - dateA
              })
              .map((reimb) => (
                <Card key={reimb.id} className="border-green-200 bg-green-50/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-slate-800 flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600" />
                          {reimb.item}
                        </div>
                        <div className="text-sm text-slate-600 mt-1">{reimb.note}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          支出: {formatShortDate(reimb.date)} ·
                          报销: {reimb.reimbursedDate ? formatShortDate(reimb.reimbursedDate) : '-'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="font-bold text-lg text-green-600">
                            {formatCurrency(reimb.amount)}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleUndoReimbursement(reimb.id)}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                          title="撤销报销"
                        >
                          <Undo2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(reimb.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
