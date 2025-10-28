import { useState } from 'react'
import { Plus, Check, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFinanceStore } from '@/store/useFinanceStore'
import { formatCurrency, formatShortDate } from '@/utils/formatters'

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

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">报销管理</h1>
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

      {/* 报销统计 */}
      <Card className="border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-yellow-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-slate-600 mb-1">待报销</div>
              <div className="text-3xl font-bold text-orange-600">
                {pendingReimbs.length}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {formatCurrency(stats?.pendingReimbursement || 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-600 mb-1">已报销</div>
              <div className="text-3xl font-bold text-green-600">
                {reimbursedReimbs.length}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {formatCurrency(
                  reimbursedReimbs.reduce((sum, r) => sum + r.amount, 0)
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-bold text-lg text-green-600">
                            {formatCurrency(reimb.amount)}
                          </div>
                        </div>
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
      </Tabs>
    </div>
  )
}
