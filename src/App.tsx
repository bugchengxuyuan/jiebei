import { useEffect, useState } from 'react'
import { Home, Receipt, Calendar, TrendingUp, FileText } from 'lucide-react'
import { useFinanceStore } from '@/store/useFinanceStore'
import { initializeDatabase } from '@/db/initialData'
import Dashboard from '@/pages/Dashboard'
import Expenses from '@/pages/Expenses'
import Planning from '@/pages/Planning'
import Investment from '@/pages/Investment'
import Reimbursement from '@/pages/Reimbursement'

type PageId = 'dashboard' | 'expenses' | 'planning' | 'investment' | 'reimbursement'

function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard')
  const { loadData, isLoading } = useFinanceStore()

  useEffect(() => {
    const init = async () => {
      await initializeDatabase()
      await loadData()
    }
    init()
  }, [loadData])

  const pages = {
    dashboard: Dashboard,
    expenses: Expenses,
    planning: Planning,
    investment: Investment,
    reimbursement: Reimbursement,
  }

  const CurrentPageComponent = pages[currentPage]

  const navItems = [
    { id: 'dashboard' as PageId, icon: Home, label: '仪表盘' },
    { id: 'expenses' as PageId, icon: Receipt, label: '支出' },
    { id: 'planning' as PageId, icon: Calendar, label: '规划' },
    { id: 'investment' as PageId, icon: TrendingUp, label: '资产' },
    { id: 'reimbursement' as PageId, icon: FileText, label: '报销' },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* 桌面端侧边导航栏 */}
      <nav className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-800">借呗财务管理</h1>
          <p className="text-xs text-slate-500 mt-1">Jiebei Finance</p>
        </div>
        <div className="flex-1 py-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-6 py-3 transition-colors ${
                  isActive
                    ? 'text-blue-600 bg-blue-50 border-r-4 border-blue-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* 主内容区域 */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <CurrentPageComponent />
      </main>

      {/* 移动端底部导航栏 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default App
