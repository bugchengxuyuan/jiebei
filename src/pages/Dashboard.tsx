import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Wallet, Clock, DollarSign, AlertTriangle, TrendingUp, Receipt } from 'lucide-react'
import { useFinanceStore } from '@/store/useFinanceStore'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { daysUntil, getHealthStatus } from '@/utils/calculations'

export default function Dashboard() {
  const { stats, config } = useFinanceStore()

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

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">财务仪表盘</h1>
        <p className="text-sm text-slate-500 mt-1">
          {formatDate(new Date().toISOString())}
        </p>
      </div>

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

      {/* 倒计时 */}
      <div className="grid grid-cols-2 gap-3">
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
      <div className="grid grid-cols-2 gap-3">
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
