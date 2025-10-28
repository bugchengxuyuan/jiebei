import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Calendar, DollarSign, TrendingDown, AlertCircle } from 'lucide-react'
import { useFinanceStore } from '@/store/useFinanceStore'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { daysUntil } from '@/utils/calculations'

export default function Planning() {
  const { stats, config, expenses } = useFinanceStore()

  if (!stats || !config) {
    return <div>加载中...</div>
  }

  const daysToSalary = daysUntil(config.salaryDate)
  const daysToDue = daysUntil(config.jiebeiDueDate)
  const dailyBudget = stats.safeToSpend / daysToSalary
  const usageRate = (stats.totalSpent / config.jiebeiTotal) * 100

  // 计算最近7天支出
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentExpenses = expenses.filter(exp =>
    new Date(exp.date) >= sevenDaysAgo
  )
  const recentTotal = recentExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  const dailyAverage = recentTotal / 7

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">还款规划</h1>
        <p className="text-sm text-slate-500 mt-1">科学规划，安心消费</p>
      </div>

      {/* 时间线 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            关键时间节点
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div>
              <div className="font-medium text-blue-900">工资到账</div>
              <div className="text-sm text-blue-700">{formatDate(config.salaryDate)}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{daysToSalary}</div>
              <div className="text-xs text-blue-700">天后</div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <div>
              <div className="font-medium text-orange-900">借呗还款日</div>
              <div className="text-sm text-orange-700">{formatDate(config.jiebeiDueDate)}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-600">{daysToDue}</div>
              <div className="text-xs text-orange-700">天后</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 额度使用情况 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            额度使用情况
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">已使用</span>
              <span className="font-medium">
                {formatCurrency(stats.totalSpent)} / {formatCurrency(config.jiebeiTotal)}
              </span>
            </div>
            <Progress value={usageRate} className="h-3" />
            <div className="text-xs text-slate-500 mt-1 text-right">
              {usageRate.toFixed(1)}%
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-600 mb-1">剩余额度</div>
              <div className="text-lg font-bold text-slate-800">
                {formatCurrency(stats.remainingJiebei)}
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-xs text-green-700 mb-1">安全可花</div>
              <div className="text-lg font-bold text-green-700">
                {formatCurrency(stats.safeToSpend)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 预算建议 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            预算建议
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <div className="text-sm text-slate-600 mb-2">建议每日预算</div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-blue-600">
                {formatCurrency(Math.max(0, dailyBudget))}
              </div>
              <div className="text-sm text-slate-500">/ 天</div>
            </div>
            <div className="text-xs text-slate-500 mt-2">
              距离工资到账还有 {daysToSalary} 天
            </div>
          </div>

          <div className="p-3 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium">近7天消费情况</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-600">总消费：</span>
                <span className="font-medium ml-1">{formatCurrency(recentTotal)}</span>
              </div>
              <div>
                <span className="text-slate-600">日均：</span>
                <span className="font-medium ml-1">{formatCurrency(dailyAverage)}</span>
              </div>
            </div>
          </div>

          {dailyAverage > dailyBudget && dailyBudget > 0 && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-sm text-orange-800">
                <span className="font-semibold">⚠️ 消费预警</span>
                <br />
                近期日均消费 ({formatCurrency(dailyAverage)}) 超出建议预算，建议适当控制。
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 还款策略 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">还款策略</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <div className="font-medium mb-1">保留必要金额</div>
                <div className="text-slate-600">
                  必须保留 {formatCurrency(stats.mustKeep)} 用于还款
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <div className="font-medium mb-1">工资到账后处理</div>
                <div className="text-slate-600">
                  {formatDate(config.salaryDate)} 收到工资 {formatCurrency(config.salary)} 后立即还款
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <div className="font-medium mb-1">报销款及时追回</div>
                <div className="text-slate-600">
                  当前待报销 {formatCurrency(stats.pendingReimbursement)}，尽快追回用于还款
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
