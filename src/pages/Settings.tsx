import { useState } from 'react'
import { Plus, Trash2, Edit, Check, Tag as TagIcon, BookOpen, DollarSign, RefreshCw, FileText, Circle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFinanceStore } from '@/store/useFinanceStore'
import { formatCurrency } from '@/utils/formatters'
import { EXPENSE_CATEGORIES } from '@/utils/constants'
import { calculateAllBudgetStatus } from '@/utils/budgetManager'
import type { Tag, AccountBook, Budget, RecurringExpense, ExpenseTemplate } from '@/store/types'

export default function Settings() {
  const {
    tags,
    accountBooks,
    budgets,
    recurringExpenses,
    expenseTemplates,
    expenses,
    addTag,
    updateTag,
    deleteTag,
    addAccountBook,
    updateAccountBook,
    deleteAccountBook,
    setDefaultAccountBook,
    addBudget,
    updateBudget,
    deleteBudget,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    executeRecurringExpense,
    addExpenseTemplate,
    updateExpenseTemplate,
    deleteExpenseTemplate,
    addExpense,
  } = useFinanceStore()

  // 当前打开的对话框
  const [activeDialog, setActiveDialog] = useState<string | null>(null)

  // ===== 标签管理状态 =====
  const [tagForm, setTagForm] = useState({ name: '', color: '#3b82f6', icon: '🏷️' })
  const [editingTag, setEditingTag] = useState<Tag | null>(null)

  // ===== 账本管理状态 =====
  const [bookForm, setBookForm] = useState({ name: '', description: '', icon: '📚', color: '#3b82f6' })
  const [editingBook, setEditingBook] = useState<AccountBook | null>(null)

  // ===== 预算管理状态 =====
  const [budgetForm, setBudgetForm] = useState({
    category: '总预算',
    amount: '',
    period: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    warningThreshold: 80,
    startDate: new Date().toISOString().split('T')[0],
  })
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)

  // ===== 周期性支出状态 =====
  const [recurringForm, setRecurringForm] = useState({
    name: '',
    category: '生活必需',
    amount: '',
    description: '',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    dayOfWeek: 1,
    dayOfMonth: 1,
    monthOfYear: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    enabled: true,
    autoCreate: true,
  })
  const [editingRecurring, setEditingRecurring] = useState<RecurringExpense | null>(null)

  // ===== 模板管理状态 =====
  const [templateForm, setTemplateForm] = useState({
    name: '',
    category: '生活必需',
    amount: '',
    description: '',
    needsReimbursement: false,
  })
  const [editingTemplate, setEditingTemplate] = useState<ExpenseTemplate | null>(null)

  // 颜色选项
  const colorOptions = [
    { value: '#3b82f6', label: '蓝色' },
    { value: '#10b981', label: '绿色' },
    { value: '#f59e0b', label: '橙色' },
    { value: '#ef4444', label: '红色' },
    { value: '#8b5cf6', label: '紫色' },
    { value: '#ec4899', label: '粉色' },
    { value: '#14b8a6', label: '青色' },
    { value: '#f97316', label: '橘色' },
  ]

  // 图标选项
  const iconOptions = ['🏷️', '⭐', '💼', '🎯', '📌', '💡', '🔥', '✨', '🎨', '🎪', '🎭', '🎬']

  // ===== 标签管理函数 =====
  const handleSaveTag = async () => {
    if (!tagForm.name.trim()) return

    if (editingTag) {
      await updateTag(editingTag.id, {
        name: tagForm.name,
        color: tagForm.color,
        icon: tagForm.icon,
      })
    } else {
      await addTag({
        name: tagForm.name,
        color: tagForm.color,
        icon: tagForm.icon,
        count: 0,
      })
    }

    setTagForm({ name: '', color: '#3b82f6', icon: '🏷️' })
    setEditingTag(null)
    setActiveDialog(null)
  }

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag)
    setTagForm({ name: tag.name, color: tag.color, icon: tag.icon || '🏷️' })
    setActiveDialog('tag')
  }

  const handleDeleteTag = async (id: string) => {
    if (window.confirm('确定要删除这个标签吗？将从所有支出中移除。')) {
      await deleteTag(id)
    }
  }

  // ===== 账本管理函数 =====
  const handleSaveBook = async () => {
    if (!bookForm.name.trim()) return

    if (editingBook) {
      await updateAccountBook(editingBook.id, {
        name: bookForm.name,
        description: bookForm.description,
        icon: bookForm.icon,
        color: bookForm.color,
      })
    } else {
      await addAccountBook({
        name: bookForm.name,
        description: bookForm.description,
        icon: bookForm.icon,
        color: bookForm.color,
        isDefault: accountBooks.length === 0,
      })
    }

    setBookForm({ name: '', description: '', icon: '📚', color: '#3b82f6' })
    setEditingBook(null)
    setActiveDialog(null)
  }

  const handleEditBook = (book: AccountBook) => {
    setEditingBook(book)
    setBookForm({
      name: book.name,
      description: book.description || '',
      icon: book.icon,
      color: book.color,
    })
    setActiveDialog('book')
  }

  const handleDeleteBook = async (id: string) => {
    try {
      await deleteAccountBook(id)
    } catch (error) {
      alert((error as Error).message)
    }
  }

  // ===== 预算管理函数 =====
  const handleSaveBudget = async () => {
    if (!budgetForm.amount) return

    if (editingBudget) {
      await updateBudget(editingBudget.id, {
        category: budgetForm.category,
        amount: parseFloat(budgetForm.amount),
        period: budgetForm.period,
        warningThreshold: budgetForm.warningThreshold,
        startDate: budgetForm.startDate,
      })
    } else {
      await addBudget({
        category: budgetForm.category,
        amount: parseFloat(budgetForm.amount),
        period: budgetForm.period,
        warningThreshold: budgetForm.warningThreshold,
        startDate: budgetForm.startDate,
      })
    }

    setBudgetForm({
      category: '总预算',
      amount: '',
      period: 'monthly',
      warningThreshold: 80,
      startDate: new Date().toISOString().split('T')[0],
    })
    setEditingBudget(null)
    setActiveDialog(null)
  }

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget)
    setBudgetForm({
      category: budget.category,
      amount: budget.amount.toString(),
      period: budget.period,
      warningThreshold: budget.warningThreshold,
      startDate: budget.startDate,
    })
    setActiveDialog('budget')
  }

  const handleDeleteBudget = async (id: string) => {
    if (window.confirm('确定要删除这个预算吗？')) {
      await deleteBudget(id)
    }
  }

  const budgetStatuses = calculateAllBudgetStatus(budgets, expenses)

  // ===== 周期性支出函数 =====
  const handleSaveRecurring = async () => {
    if (!recurringForm.name.trim() || !recurringForm.amount) return

    const data = {
      name: recurringForm.name,
      category: recurringForm.category,
      amount: parseFloat(recurringForm.amount),
      description: recurringForm.description,
      frequency: recurringForm.frequency,
      dayOfWeek: recurringForm.frequency === 'weekly' ? recurringForm.dayOfWeek : undefined,
      dayOfMonth: ['monthly', 'yearly'].includes(recurringForm.frequency) ? recurringForm.dayOfMonth : undefined,
      monthOfYear: recurringForm.frequency === 'yearly' ? recurringForm.monthOfYear : undefined,
      startDate: recurringForm.startDate,
      endDate: recurringForm.endDate || undefined,
      enabled: recurringForm.enabled,
      autoCreate: recurringForm.autoCreate,
    }

    if (editingRecurring) {
      await updateRecurringExpense(editingRecurring.id, data)
    } else {
      await addRecurringExpense(data)
    }

    setRecurringForm({
      name: '',
      category: '生活必需',
      amount: '',
      description: '',
      frequency: 'monthly',
      dayOfWeek: 1,
      dayOfMonth: 1,
      monthOfYear: 1,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      enabled: true,
      autoCreate: true,
    })
    setEditingRecurring(null)
    setActiveDialog(null)
  }

  const handleEditRecurring = (recurring: RecurringExpense) => {
    setEditingRecurring(recurring)
    setRecurringForm({
      name: recurring.name,
      category: recurring.category,
      amount: recurring.amount.toString(),
      description: recurring.description,
      frequency: recurring.frequency,
      dayOfWeek: recurring.dayOfWeek || 1,
      dayOfMonth: recurring.dayOfMonth || 1,
      monthOfYear: recurring.monthOfYear || 1,
      startDate: recurring.startDate,
      endDate: recurring.endDate || '',
      enabled: recurring.enabled,
      autoCreate: recurring.autoCreate,
    })
    setActiveDialog('recurring')
  }

  const handleDeleteRecurring = async (id: string) => {
    if (window.confirm('确定要删除这个周期性支出吗？')) {
      await deleteRecurringExpense(id)
    }
  }

  const handleExecuteRecurring = async (id: string) => {
    if (window.confirm('确定要立即执行这个周期性支出吗？将创建一笔支出记录。')) {
      await executeRecurringExpense(id)
      alert('周期性支出已执行！')
    }
  }

  // ===== 模板管理函数 =====
  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.amount) return

    if (editingTemplate) {
      await updateExpenseTemplate(editingTemplate.id, {
        name: templateForm.name,
        category: templateForm.category,
        amount: parseFloat(templateForm.amount),
        description: templateForm.description,
        needsReimbursement: templateForm.needsReimbursement,
      })
    } else {
      await addExpenseTemplate({
        name: templateForm.name,
        category: templateForm.category,
        amount: parseFloat(templateForm.amount),
        description: templateForm.description,
        needsReimbursement: templateForm.needsReimbursement,
      })
    }

    setTemplateForm({
      name: '',
      category: '生活必需',
      amount: '',
      description: '',
      needsReimbursement: false,
    })
    setEditingTemplate(null)
    setActiveDialog(null)
  }

  const handleEditTemplate = (template: ExpenseTemplate) => {
    setEditingTemplate(template)
    setTemplateForm({
      name: template.name,
      category: template.category,
      amount: template.amount.toString(),
      description: template.description,
      needsReimbursement: template.needsReimbursement,
    })
    setActiveDialog('template')
  }

  const handleDeleteTemplate = async (id: string) => {
    if (window.confirm('确定要删除这个模板吗？')) {
      await deleteExpenseTemplate(id)
    }
  }

  const handleApplyTemplate = async (template: ExpenseTemplate) => {
    await addExpense({
      date: new Date().toISOString().split('T')[0],
      category: template.category,
      amount: template.amount,
      description: template.description,
      needsReimbursement: template.needsReimbursement,
      tags: template.tags,
    })
    alert('已根据模板创建支出记录！')
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto pb-20 md:pb-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">系统设置</h1>
        <p className="text-sm text-slate-500 mt-1">
          管理标签、账本、预算、周期性支出和模板
        </p>
      </div>

      <Tabs defaultValue="tags" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="tags">
            <TagIcon className="w-4 h-4 mr-2" />
            标签
          </TabsTrigger>
          <TabsTrigger value="books">
            <BookOpen className="w-4 h-4 mr-2" />
            账本
          </TabsTrigger>
          <TabsTrigger value="budgets">
            <DollarSign className="w-4 h-4 mr-2" />
            预算
          </TabsTrigger>
          <TabsTrigger value="recurring">
            <RefreshCw className="w-4 h-4 mr-2" />
            周期
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="w-4 h-4 mr-2" />
            模板
          </TabsTrigger>
        </TabsList>

        {/* ===== 标签管理 ===== */}
        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>标签管理</CardTitle>
              <Dialog open={activeDialog === 'tag'} onOpenChange={(open) => {
                if (!open) {
                  setActiveDialog(null)
                  setEditingTag(null)
                  setTagForm({ name: '', color: '#3b82f6', icon: '🏷️' })
                }
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => setActiveDialog('tag')}>
                    <Plus className="w-4 h-4 mr-2" />
                    新建标签
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingTag ? '编辑标签' : '新建标签'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>标签名称</Label>
                      <Input
                        value={tagForm.name}
                        onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                        placeholder="输入标签名称"
                      />
                    </div>
                    <div>
                      <Label>图标</Label>
                      <div className="grid grid-cols-6 gap-2 mt-2">
                        {iconOptions.map((icon) => (
                          <button
                            key={icon}
                            onClick={() => setTagForm({ ...tagForm, icon })}
                            className={`p-2 text-2xl rounded border-2 transition-colors ${
                              tagForm.icon === icon
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>颜色</Label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setTagForm({ ...tagForm, color: color.value })}
                            className={`p-3 rounded border-2 transition-all flex items-center gap-2 ${
                              tagForm.color === color.value
                                ? 'border-slate-800 shadow-md'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <Circle className="w-4 h-4" fill={color.value} color={color.value} />
                            <span className="text-sm">{color.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveTag} className="flex-1">
                        {editingTag ? '保存' : '创建'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setActiveDialog(null)
                          setEditingTag(null)
                          setTagForm({ name: '', color: '#3b82f6', icon: '🏷️' })
                        }}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {tags.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  暂无标签，点击"新建标签"创建第一个标签
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tags.map((tag) => (
                    <Card key={tag.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{tag.icon}</span>
                            <div>
                              <div
                                className="font-medium"
                                style={{ color: tag.color }}
                              >
                                {tag.name}
                              </div>
                              <div className="text-xs text-slate-500">
                                使用次数: {tag.count || 0}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditTag(tag)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTag(tag.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== 账本管理 ===== */}
        <TabsContent value="books" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>账本管理</CardTitle>
              <Dialog open={activeDialog === 'book'} onOpenChange={(open) => {
                if (!open) {
                  setActiveDialog(null)
                  setEditingBook(null)
                  setBookForm({ name: '', description: '', icon: '📚', color: '#3b82f6' })
                }
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => setActiveDialog('book')}>
                    <Plus className="w-4 h-4 mr-2" />
                    新建账本
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingBook ? '编辑账本' : '新建账本'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>账本名称</Label>
                      <Input
                        value={bookForm.name}
                        onChange={(e) => setBookForm({ ...bookForm, name: e.target.value })}
                        placeholder="例如: 个人账本"
                      />
                    </div>
                    <div>
                      <Label>描述（可选）</Label>
                      <Input
                        value={bookForm.description}
                        onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                        placeholder="账本描述"
                      />
                    </div>
                    <div>
                      <Label>图标</Label>
                      <div className="grid grid-cols-6 gap-2 mt-2">
                        {['📚', '💼', '🏠', '✈️', '🎓', '🏥', '🛒', '💳', '🎁', '🚗', '🍔', '🎮'].map((icon) => (
                          <button
                            key={icon}
                            onClick={() => setBookForm({ ...bookForm, icon })}
                            className={`p-2 text-2xl rounded border-2 transition-colors ${
                              bookForm.icon === icon
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>颜色</Label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setBookForm({ ...bookForm, color: color.value })}
                            className={`p-3 rounded border-2 transition-all flex items-center gap-2 ${
                              bookForm.color === color.value
                                ? 'border-slate-800 shadow-md'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <Circle className="w-4 h-4" fill={color.value} color={color.value} />
                            <span className="text-sm">{color.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveBook} className="flex-1">
                        {editingBook ? '保存' : '创建'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setActiveDialog(null)
                          setEditingBook(null)
                          setBookForm({ name: '', description: '', icon: '📚', color: '#3b82f6' })
                        }}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {accountBooks.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  暂无账本，点击"新建账本"创建第一个账本
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {accountBooks.map((book) => (
                    <Card key={book.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{book.icon}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className="font-medium"
                                  style={{ color: book.color }}
                                >
                                  {book.name}
                                </span>
                                {book.isDefault && (
                                  <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                                    默认
                                  </span>
                                )}
                              </div>
                              {book.description && (
                                <div className="text-xs text-slate-500">{book.description}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {!book.isDefault && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDefaultAccountBook(book.id)}
                                className="text-xs"
                              >
                                设为默认
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditBook(book)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteBook(book.id)}
                              className="text-red-600"
                              disabled={book.isDefault}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== 预算管理 ===== */}
        <TabsContent value="budgets" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>预算管理</CardTitle>
              <Dialog open={activeDialog === 'budget'} onOpenChange={(open) => {
                if (!open) {
                  setActiveDialog(null)
                  setEditingBudget(null)
                  setBudgetForm({
                    category: '总预算',
                    amount: '',
                    period: 'monthly',
                    warningThreshold: 80,
                    startDate: new Date().toISOString().split('T')[0],
                  })
                }
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => setActiveDialog('budget')}>
                    <Plus className="w-4 h-4 mr-2" />
                    新建预算
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingBudget ? '编辑预算' : '新建预算'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>预算类别</Label>
                      <select
                        value={budgetForm.category}
                        onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="总预算">总预算</option>
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.icon} {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>预算金额</Label>
                      <Input
                        type="number"
                        value={budgetForm.amount}
                        onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                        placeholder="输入预算金额"
                      />
                    </div>
                    <div>
                      <Label>预算周期</Label>
                      <select
                        value={budgetForm.period}
                        onChange={(e) => setBudgetForm({ ...budgetForm, period: e.target.value as any })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="daily">每日</option>
                        <option value="weekly">每周</option>
                        <option value="monthly">每月</option>
                        <option value="yearly">每年</option>
                      </select>
                    </div>
                    <div>
                      <Label>预警阈值 ({budgetForm.warningThreshold}%)</Label>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={budgetForm.warningThreshold}
                        onChange={(e) => setBudgetForm({ ...budgetForm, warningThreshold: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label>开始日期</Label>
                      <Input
                        type="date"
                        value={budgetForm.startDate}
                        onChange={(e) => setBudgetForm({ ...budgetForm, startDate: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveBudget} className="flex-1">
                        {editingBudget ? '保存' : '创建'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setActiveDialog(null)
                          setEditingBudget(null)
                          setBudgetForm({
                            category: '总预算',
                            amount: '',
                            period: 'monthly',
                            warningThreshold: 80,
                            startDate: new Date().toISOString().split('T')[0],
                          })
                        }}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {budgets.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  暂无预算，点击"新建预算"创建第一个预算
                </div>
              ) : (
                <div className="space-y-3">
                  {budgetStatuses.map((status) => {
                    const statusColor =
                      status.status === 'exceeded' ? 'red' :
                      status.status === 'warning' ? 'orange' : 'green'

                    return (
                      <Card key={status.budget.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-lg">
                                  {status.budget.category}
                                </div>
                                <div className="text-sm text-slate-500">
                                  {
                                    status.budget.period === 'daily' ? '每日预算' :
                                    status.budget.period === 'weekly' ? '每周预算' :
                                    status.budget.period === 'monthly' ? '每月预算' : '每年预算'
                                  }
                                  · 剩余 {status.daysLeft} 天
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${statusColor}-100 text-${statusColor}-700`}>
                                  {status.percentage.toFixed(0)}%
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditBudget(status.budget)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteBudget(status.budget.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span>已花费: {formatCurrency(status.spent)}</span>
                                <span>预算: {formatCurrency(status.budget.amount)}</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                <div
                                  className={`h-full transition-all bg-${statusColor}-500`}
                                  style={{ width: `${Math.min(100, status.percentage)}%` }}
                                />
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                剩余: {formatCurrency(status.remaining)}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== 周期性支出 ===== */}
        <TabsContent value="recurring" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>周期性支出</CardTitle>
              <Dialog open={activeDialog === 'recurring'} onOpenChange={(open) => {
                if (!open) {
                  setActiveDialog(null)
                  setEditingRecurring(null)
                  setRecurringForm({
                    name: '',
                    category: '生活必需',
                    amount: '',
                    description: '',
                    frequency: 'monthly',
                    dayOfWeek: 1,
                    dayOfMonth: 1,
                    monthOfYear: 1,
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: '',
                    enabled: true,
                    autoCreate: true,
                  })
                }
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => setActiveDialog('recurring')}>
                    <Plus className="w-4 h-4 mr-2" />
                    新建周期性支出
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingRecurring ? '编辑周期性支出' : '新建周期性支出'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>名称</Label>
                      <Input
                        value={recurringForm.name}
                        onChange={(e) => setRecurringForm({ ...recurringForm, name: e.target.value })}
                        placeholder="例如: 房租"
                      />
                    </div>
                    <div>
                      <Label>分类</Label>
                      <select
                        value={recurringForm.category}
                        onChange={(e) => setRecurringForm({ ...recurringForm, category: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.icon} {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>金额</Label>
                      <Input
                        type="number"
                        value={recurringForm.amount}
                        onChange={(e) => setRecurringForm({ ...recurringForm, amount: e.target.value })}
                        placeholder="输入金额"
                      />
                    </div>
                    <div>
                      <Label>描述</Label>
                      <Input
                        value={recurringForm.description}
                        onChange={(e) => setRecurringForm({ ...recurringForm, description: e.target.value })}
                        placeholder="支出描述"
                      />
                    </div>
                    <div>
                      <Label>频率</Label>
                      <select
                        value={recurringForm.frequency}
                        onChange={(e) => setRecurringForm({ ...recurringForm, frequency: e.target.value as any })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="daily">每天</option>
                        <option value="weekly">每周</option>
                        <option value="monthly">每月</option>
                        <option value="yearly">每年</option>
                      </select>
                    </div>

                    {recurringForm.frequency === 'weekly' && (
                      <div>
                        <Label>星期几</Label>
                        <select
                          value={recurringForm.dayOfWeek}
                          onChange={(e) => setRecurringForm({ ...recurringForm, dayOfWeek: parseInt(e.target.value) })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="0">星期日</option>
                          <option value="1">星期一</option>
                          <option value="2">星期二</option>
                          <option value="3">星期三</option>
                          <option value="4">星期四</option>
                          <option value="5">星期五</option>
                          <option value="6">星期六</option>
                        </select>
                      </div>
                    )}

                    {(recurringForm.frequency === 'monthly' || recurringForm.frequency === 'yearly') && (
                      <div>
                        <Label>几号</Label>
                        <Input
                          type="number"
                          min="1"
                          max="31"
                          value={recurringForm.dayOfMonth}
                          onChange={(e) => setRecurringForm({ ...recurringForm, dayOfMonth: parseInt(e.target.value) })}
                        />
                      </div>
                    )}

                    {recurringForm.frequency === 'yearly' && (
                      <div>
                        <Label>几月</Label>
                        <select
                          value={recurringForm.monthOfYear}
                          onChange={(e) => setRecurringForm({ ...recurringForm, monthOfYear: parseInt(e.target.value) })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                            <option key={m} value={m}>{m}月</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <Label>开始日期</Label>
                      <Input
                        type="date"
                        value={recurringForm.startDate}
                        onChange={(e) => setRecurringForm({ ...recurringForm, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>结束日期（可选）</Label>
                      <Input
                        type="date"
                        value={recurringForm.endDate}
                        onChange={(e) => setRecurringForm({ ...recurringForm, endDate: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="enabled"
                        checked={recurringForm.enabled}
                        onChange={(e) => setRecurringForm({ ...recurringForm, enabled: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="enabled" className="cursor-pointer">启用此周期性支出</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="autoCreate"
                        checked={recurringForm.autoCreate}
                        onChange={(e) => setRecurringForm({ ...recurringForm, autoCreate: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="autoCreate" className="cursor-pointer">自动创建支出记录</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveRecurring} className="flex-1">
                        {editingRecurring ? '保存' : '创建'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setActiveDialog(null)
                          setEditingRecurring(null)
                        }}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {recurringExpenses.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  暂无周期性支出，点击"新建周期性支出"创建第一个
                </div>
              ) : (
                <div className="space-y-3">
                  {recurringExpenses.map((recurring) => (
                    <Card key={recurring.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-lg">{recurring.name}</span>
                              {recurring.enabled ? (
                                <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                                  ✓ 启用
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded-full">
                                  ✗ 禁用
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-slate-600">
                              {formatCurrency(recurring.amount)} · {recurring.description}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {
                                recurring.frequency === 'daily' ? '每天' :
                                recurring.frequency === 'weekly' ? `每周${['日','一','二','三','四','五','六'][recurring.dayOfWeek || 0]}` :
                                recurring.frequency === 'monthly' ? `每月${recurring.dayOfMonth}号` :
                                `每年${recurring.monthOfYear}月${recurring.dayOfMonth}号`
                              }
                              {recurring.lastExecuted && ` · 上次执行: ${recurring.lastExecuted}`}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExecuteRecurring(recurring.id)}
                              disabled={!recurring.enabled}
                            >
                              立即执行
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditRecurring(recurring)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRecurring(recurring.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== 模板管理 ===== */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>支出模板</CardTitle>
              <Dialog open={activeDialog === 'template'} onOpenChange={(open) => {
                if (!open) {
                  setActiveDialog(null)
                  setEditingTemplate(null)
                  setTemplateForm({
                    name: '',
                    category: '生活必需',
                    amount: '',
                    description: '',
                    needsReimbursement: false,
                  })
                }
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => setActiveDialog('template')}>
                    <Plus className="w-4 h-4 mr-2" />
                    新建模板
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingTemplate ? '编辑模板' : '新建模板'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>模板名称</Label>
                      <Input
                        value={templateForm.name}
                        onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                        placeholder="例如: 工作日午餐"
                      />
                    </div>
                    <div>
                      <Label>分类</Label>
                      <select
                        value={templateForm.category}
                        onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.icon} {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>金额</Label>
                      <Input
                        type="number"
                        value={templateForm.amount}
                        onChange={(e) => setTemplateForm({ ...templateForm, amount: e.target.value })}
                        placeholder="输入金额"
                      />
                    </div>
                    <div>
                      <Label>描述</Label>
                      <Input
                        value={templateForm.description}
                        onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                        placeholder="支出描述"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="needsReimbursement"
                        checked={templateForm.needsReimbursement}
                        onChange={(e) => setTemplateForm({ ...templateForm, needsReimbursement: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="needsReimbursement" className="cursor-pointer">需要报销</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveTemplate} className="flex-1">
                        {editingTemplate ? '保存' : '创建'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setActiveDialog(null)
                          setEditingTemplate(null)
                        }}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {expenseTemplates.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  暂无模板，点击"新建模板"创建第一个模板
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {expenseTemplates.map((template) => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-lg mb-1">
                              {template.name}
                            </div>
                            <div className="text-sm text-slate-600">
                              {EXPENSE_CATEGORIES.find(c => c.value === template.category)?.label} · {formatCurrency(template.amount)}
                            </div>
                            <div className="text-xs text-slate-500">
                              {template.description}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApplyTemplate(template)}
                              className="text-xs"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              应用
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditTemplate(template)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
