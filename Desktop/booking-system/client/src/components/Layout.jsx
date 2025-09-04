import { Link, useLocation } from 'react-router-dom'
import { Calendar, BarChart3, Settings, Menu } from 'lucide-react'
import { useState } from 'react'

const Layout = ({ children }) => {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, current: location.pathname === '/dashboard' },
    { name: 'Calendar', href: '/calendar', icon: Calendar, current: location.pathname === '/calendar' },
    { name: 'Bookings', href: '/bookings', icon: Calendar, current: location.pathname === '/bookings' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu */}
      <div className={`lg:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
            <div className="flex h-16 flex-shrink-0 items-center px-4">
              <span className="text-2xl">💅</span>
              <span className="ml-2 text-xl font-bold text-salon-pink">Nails Dashboard</span>
            </div>
            <div className="mt-5 h-0 flex-1 overflow-y-auto">
              <nav className="space-y-1 px-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      item.current
                        ? 'bg-salon-pink text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="mr-4 h-6 w-6 flex-shrink-0" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
          <div className="flex h-16 flex-shrink-0 items-center px-4 border-b border-gray-200">
            <span className="text-2xl">💅</span>
            <span className="ml-2 text-xl font-bold text-salon-pink">Nails Dashboard</span>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto">
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    item.current
                      ? 'bg-salon-pink text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <item.icon className="mr-3 h-6 w-6 flex-shrink-0" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top navigation for mobile */}
        <div className="sticky top-0 z-10 lg:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-salon-pink"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout