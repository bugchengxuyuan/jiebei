import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Wallet, Clock, DollarSign, AlertTriangle, TrendingUp, Receipt, Calculator, CheckCircle, XCircle, Calendar, Download, PieChart as PieChartIcon, Activity, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { useFinanceStore } from '@/store/useFinanceStore'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { daysUntil } from '@/utils/calculations'
import { exportAllData } from '@/utils/exportData'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import { calculateHealthScore, compareWithYesterday, compareWithLastWeek, generateSmartInsights } from '@/utils/insights'

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

  const daysUntilSalary = daysUntil(config.salaryDate)
  const daysUntilDue = daysUntil(config.jiebeiDueDate)

  // 计算今日预算
  const dailyBudget = daysUntilSalary > 0 ? stats.safeToSpend / daysUntilSalary : stats.safeToSpend

  // 计算今天已花金额
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date)
    expDate.setHours(0, 0, 0, 0)
    return expDate.getTime() === today.getTime()
  })
  const todaySpent = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  const todayRemaining = dailyBudget - todaySpent

  // 财务健康评分
  const healthScore = useMemo(() =>
    calculateHealthScore(stats, config, expenses),
    [stats, config, expenses]
  )

  // 趋势对比数据
  const yesterdayTrend = useMemo(() =>
    compareWithYesterday(expenses),
    [expenses]
  )

  const weekTrend = useMemo(() =>
    compareWithLastWeek(expenses),
    [expenses]
  )

  // 智能建议
  const smartInsights = useMemo(() =>
    generateSmartInsights(stats, config, expenses, reimbursements),
    [stats, config, expenses, reimbursements]
  )

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

  // 趋势指示器组件
  const TrendIndicator = ({ trend }: { trend: { direction: 'up' | 'down' | 'neutral'; change: number; color: string; icon: string } }) => {
    const Icon = trend.direction === 'up' ? ArrowUp : trend.direction === 'down' ? ArrowDown : Minus
    return (
      <div className={`flex items-center gap-1 ${trend.color}`}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-semibold">{trend.change.toFixed(1)}%</span>
      </div>
    )
  }

  // 建议类型样式映射
  const insightStyles = {
    warning: 'border-orange-200 bg-orange-50',
    info: 'border-blue-200 bg-blue-50',
    success: 'border-green-200 bg-green-50',
    tip: 'border-purple-200 bg-purple-50',
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800">财务仪表盘</h1>
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

      {/* 🎯 Hero Card - 财务健康评分 */}
      <Card className={`border-2 ${healthScore.bgColor} shadow-lg`}>
        <CardContent className="pt-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：健康评分 */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-3">
                <span className="text-4xl">{healthScore.icon}</span>
                <div>
                  <div className="text-sm text-slate-600 font-medium">财务健康度</div>
                  <div className={`text-2xl font-bold ${healthScore.color}`}>{healthScore.grade}</div>
                </div>
              </div>
              <div className={`text-7xl md:text-8xl font-bold ${healthScore.color} mb-2`}>
                {healthScore.score}
              </div>
              <div className="text-slate-600 text-sm">{healthScore.description}</div>
            </div>

            {/* 中间：安全可花金额 */}
            <div className="text-center border-t lg:border-t-0 lg:border-l border-slate-200 pt-6 lg:pt-0 lg:pl-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Wallet className="w-5 h-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-600">安全可花</span>
              </div>
              <div className={`text-5xl md:text-6xl font-bold mb-2 ${stats.safeToSpend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(stats.safeToSpend)}
              </div>
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-slate-500">vs 昨天</span>
                <TrendIndicator trend={yesterdayTrend} />
              </div>
            </div>

            {/* 右侧：关键指标 */}
            <div className="grid grid-cols-2 gap-4 border-t lg:border-t-0 lg:border-l border-slate-200 pt-6 lg:pt-0 lg:pl-6">
              <div className="text-center">
                <div className="text-xs text-slate-600 mb-1">还剩天数</div>
                <div className="text-3xl font-bold text-slate-800">{daysUntilSalary}</div>
                <div className="text-xs text-slate-500 mt-1">天</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-600 mb-1">日均预算</div>
                <div className="text-3xl font-bold text-blue-600">{formatCurrency(Math.max(0, dailyBudget))}</div>
                <div className="text-xs text-slate-500 mt-1">每天</div>
              </div>
              <div className="text-center col-span-2">
                <div className="text-xs text-slate-600 mb-1">今日剩余预算</div>
                <div className={`text-3xl font-bold ${todayRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(todayRemaining)}
                </div>
                <Progress
                  value={Math.min(100, Math.max(0, (todaySpent / dailyBudget) * 100))}
                  className="h-2 mt-2"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 💡 智能建议 */}
      {smartInsights.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span>💡</span>
            智能建议
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {smartInsights.map((insight, index) => (
              <Alert key={index} className={insightStyles[insight.type]}>
                <AlertDescription className="flex items-start gap-2">
                  <span className="text-xl flex-shrink-0">{insight.icon}</span>
                  <span className="text-slate-800">{insight.message}</span>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* 📊 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 今日消费 */}
        <Card className="border-2 border-blue-200 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-slate-600">今日消费</span>
              </div>
              <TrendIndicator trend={yesterdayTrend} />
            </div>
            <div className="text-4xl font-bold text-blue-600 mb-1">
              {formatCurrency(todaySpent)}
            </div>
            <div className="text-xs text-slate-500">
              昨天 {formatCurrency(yesterdayTrend.value)}
            </div>
          </CardContent>
        </Card>

        {/* 本周消费 */}
        <Card className="border-2 border-purple-200 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-slate-600">本周消费</span>
              </div>
              <TrendIndicator trend={weekTrend} />
            </div>
            <div className="text-4xl font-bold text-purple-600 mb-1">
              {formatCurrency(weekTrend.value)}
            </div>
            <div className="text-xs text-slate-500">
              上周 {formatCurrency(weekTrend.value / (1 + weekTrend.change / 100))}
            </div>
          </CardContent>
        </Card>

        {/* 待报销金额 */}
        <Card className="border-2 border-orange-200 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-slate-600">待报销</span>
            </div>
            <div className="text-4xl font-bold text-orange-600 mb-1">
              {formatCurrency(stats.pendingReimbursement)}
            </div>
            <div className="text-xs text-slate-500">
              {reimbursements.filter(r => r.status === 'pending').length} 笔待处理
            </div>
          </CardContent>
        </Card>

        {/* 借呗使用率 */}
        <Card className="border-2 border-red-200 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-slate-600">使用率</span>
            </div>
            <div className="text-4xl font-bold text-red-600 mb-1">
              {((stats.totalSpent / config.jiebeiTotal) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500">
              已用 {formatCurrency(stats.totalSpent)} / {formatCurrency(config.jiebeiTotal)}
            </div>
          </CardContent>
        </Card>
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

      {/* 倒计时卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-2 border-slate-200 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium">借呗还款</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">{daysUntilDue}天</div>
            <div className="text-xs text-slate-500 mt-1">{config.jiebeiDueDate}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-200 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium">工资到账</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">{daysUntilSalary}天</div>
            <div className="text-xs text-slate-500 mt-1">{formatCurrency(config.salary)}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-200 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium">剩余投资额</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">{formatCurrency(stats.remainingInvestment)}</div>
            <div className="text-xs text-slate-500 mt-1">可投资金额</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-200 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium">已投资</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">{formatCurrency(stats.totalInvestment)}</div>
            <div className="text-xs text-slate-500 mt-1">总投资金额</div>
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
    </div>
  )
}
