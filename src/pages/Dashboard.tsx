import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Wallet, Clock, DollarSign, AlertTriangle, TrendingUp, Receipt, Calculator, CheckCircle, XCircle, Calendar, Download, PieChart as PieChartIcon, Activity } from 'lucide-react'
import { useFinanceStore } from '@/store/useFinanceStore'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { daysUntil, getHealthStatus } from '@/utils/calculations'
import { exportAllData } from '@/utils/exportData'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'

export default function Dashboard() {
  const { stats, config, expenses, reimbursements, investments } = useFinanceStore()
  const [checkAmount, setCheckAmount] = useState('')
  const [checkResult, setCheckResult] = useState<{ safe: boolean; remaining: number } | null>(null)

  if (!stats || !config) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    )
  }

  const healthStatus = getHealthStatus(stats.safeToSpend)
  const daysUntilSalary = daysUntil(config.salaryDate)
  const daysUntilDue = daysUntil(config.jiebeiDueDate)

  // 计算今日预算
  const dailyBudget = daysUntilSalary > 0 ? stats.safeToSpend / daysUntilSalary : stats.safeToSpend

  // 计算今天已花金额（今天0点到现在）
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date)
    expDate.setHours(0, 0, 0, 0)
    return expDate.getTime() === today.getTime()
  })
  const todaySpent = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  const todayRemaining = dailyBudget - todaySpent

  // 借呗使用率数据（环形图）
  const jiebeiUsageData = useMemo(() => {
    return [
      { name: '已使用', value: stats.totalSpent, color: '#ef4444' },
      { name: '剩余额度', value: stats.remainingJiebei, color: '#22c55e' }
    ]
  }, [stats.totalSpent, stats.remainingJiebei])

  // 近30天消费趋势数据
  const last30DaysTrend = useMemo(() => {
    const data = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const dayExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date)
        expDate.setHours(0, 0, 0, 0)
        return expDate.getTime() === date.getTime()
      })

      data.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        amount: dayExpenses.reduce((sum, e) => sum + e.amount, 0),
        count: dayExpenses.length
      })
    }
    return data
  }, [expenses])

  // 消费前检查
  const handleCheckExpense = () => {
    const amount = parseFloat(checkAmount)
    if (isNaN(amount) || amount <= 0) {
      setCheckResult(null)
      return
    }
    const remaining = stats.safeToSpend - amount
    setCheckResult({
      safe: remaining >= 0,
      remaining: remaining
    })
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">财务仪表盘</h1>
          <p className="text-sm text-slate-500 mt-1">
            {formatDate(new Date().toISOString())}
          </p>
        </div>
        <Button
          onClick={() => exportAllData(expenses, reimbursements, investments, stats)}
          className="flex items-center gap-2"
          variant="outline"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">导出数据</span>
        </Button>
      </div>

      {/* 💰 消费前检查器 */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5 text-purple-600" />
            消费前检查
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="我想花多少钱？"
                value={checkAmount}
                onChange={(e) => setCheckAmount(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCheckExpense()}
                className="flex-1"
              />
              <Button onClick={handleCheckExpense} className="px-6">
                检查
              </Button>
            </div>
            {checkResult && (
              <div className={`p-3 rounded-lg ${checkResult.safe ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2">
                  {checkResult.safe ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-semibold text-green-800">可以花！</div>
                        <div className="text-sm text-green-700">
                          花 {formatCurrency(parseFloat(checkAmount))} 后还剩 {formatCurrency(checkResult.remaining)}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <div className="font-semibold text-red-800">超支警告！</div>
                        <div className="text-sm text-red-700">
                          会超支 {formatCurrency(Math.abs(checkResult.remaining))}，不建议消费
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 📅 今日预算 */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            今日预算
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xs text-slate-600 mb-1">建议不超过</div>
                <div className="text-xl font-bold text-blue-600">
                  {formatCurrency(Math.max(0, dailyBudget))}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-600 mb-1">今天已花</div>
                <div className="text-xl font-bold text-orange-600">
                  {formatCurrency(todaySpent)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-600 mb-1">今天还能花</div>
                <div className={`text-xl font-bold ${todayRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(todayRemaining)}
                </div>
              </div>
            </div>
            <Progress
              value={Math.min(100, Math.max(0, (todaySpent / dailyBudget) * 100))}
              className="h-2"
            />
            <div className="text-xs text-slate-500 text-center">
              {todayRemaining >= 0 ? (
                <span className="text-green-700">✓ 今日预算充足</span>
              ) : (
                <span className="text-red-700">⚠️ 今日已超预算 {formatCurrency(Math.abs(todayRemaining))}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 安全可花金额 */}
      <Card className={`border-2 ${healthStatus.bg}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              还能安全花费
            </span>
            <span className={`text-sm px-3 py-1 rounded-full ${healthStatus.bg} ${healthStatus.color}`}>
              {healthStatus.icon} {healthStatus.text}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-center">
              <div className={`text-5xl font-bold ${healthStatus.color}`}>
                {formatCurrency(stats.safeToSpend)}
              </div>
              <div className="text-sm text-slate-500 mt-2">
                借呗剩余 {formatCurrency(stats.remainingJiebei)} - 必须保留 {formatCurrency(stats.mustKeep)}
              </div>
            </div>
            <Progress value={Math.max(0, (stats.safeToSpend / stats.remainingJiebei) * 100)} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* 📊 数据可视化区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* 借呗使用率环形图 */}
        <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-indigo-600" />
              借呗额度使用率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-full md:w-1/2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={jiebeiUsageData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {jiebeiUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm text-slate-600">已使用</span>
                  </div>
                  <span className="font-bold text-slate-800">{formatCurrency(stats.totalSpent)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm text-slate-600">剩余额度</span>
                  </div>
                  <span className="font-bold text-slate-800">{formatCurrency(stats.remainingJiebei)}</span>
                </div>
                <div className="pt-3 border-t border-indigo-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">使用率</span>
                    <span className="font-bold text-indigo-600">
                      {((stats.totalSpent / config.jiebeiTotal) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 近30天消费趋势图 */}
        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              近30天消费趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={last30DaysTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `¥${value}`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${formatCurrency(value)}`, '消费金额']}
                    labelFormatter={(label) => `日期: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    name="消费金额"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 倒计时 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium">借呗还款</span>
            </div>
            <div className="text-3xl font-bold">{daysUntilDue}天</div>
            <div className="text-xs text-slate-500 mt-1">11月19日</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium">工资到账</span>
            </div>
            <div className="text-3xl font-bold">{daysUntilSalary}天</div>
            <div className="text-xs text-slate-500 mt-1">{formatCurrency(config.salary)}</div>
          </CardContent>
        </Card>
      </div>

      {/* 财务统计 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium">本期支出</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</div>
            <div className="text-xs text-slate-500 mt-1">
              剩余 {formatCurrency(stats.remainingJiebei)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium">待报销</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(stats.pendingReimbursement)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {stats.pendingReimbursement > 0 ? '待收回' : '无待报销'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 警告提示 */}
      {stats.safeToSpend < 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <span className="font-semibold">资金危机！</span>
            <br />
            已超支 {formatCurrency(Math.abs(stats.safeToSpend))}，请立即停止消费！
          </AlertDescription>
        </Alert>
      )}

      {stats.safeToSpend >= 0 && stats.safeToSpend < 500 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <span className="font-semibold">资金紧张</span>
            <br />
            安全可花金额不足500元，请注意控制支出。
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
