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
    <div className="flex flex-col h-screen bg-slate-50">
      {/* 主内容区域 */}
      <main className="flex-1 overflow-y-auto pb-20">
        <CurrentPageComponent />
      </main>

      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
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
