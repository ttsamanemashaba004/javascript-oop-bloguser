import { useState, useEffect } from 'react'
import { Calendar, DollarSign, Clock, Users } from 'lucide-react'
import moment from 'moment'
import StatsCard from '../components/StatsCard'
import BookingCard from '../components/BookingCard'
import { statsAPI } from '../services/api'

const Dashboard = () => {
  const [stats, setStats] = useState({
    todayBookings: 0,
    weekBookings: 0,
    totalRevenue: 0,
    pendingDeposits: 0,
    recentBookings: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // FIXED: From today to next 7 days (forward-looking)
      const today = moment().format('YYYY-MM-DD')  // Aug 19
      const nextWeek = moment().add(7, 'days').format('YYYY-MM-DD')  // Aug 26
      
      console.log('Dashboard: Loading data from TODAY to NEXT 7 DAYS:', { today, nextWeek })
      
      const data = await statsAPI.getStats(today, nextWeek)
      console.log('Dashboard: Stats loaded:', data)
      setStats(data)
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-salon-pink"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error}</div>
        <button
          onClick={loadDashboardData}
          className="mt-2 btn btn-primary text-sm"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upcoming appointments for the next 7 days
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="Today's Bookings"
          value={stats.todayBookings}
          icon={Calendar}
          color="salon-pink"
        />
        <StatsCard
          title="Next 7 Days"
          value={stats.weekBookings}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Revenue (7 Days)"
          value={`R${stats.totalRevenue}`}
          icon={DollarSign}
          color="green"
        />
        <StatsCard
          title="Pending Deposits"
          value={stats.pendingDeposits}
          icon={Clock}
          color="yellow"
        />
      </div>

      {/* Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Upcoming Bookings</h2>
            <button
              onClick={loadDashboardData}
              className="btn btn-outline text-sm"
            >
              Refresh
            </button>
          </div>
          <div className="space-y-4">
            {stats.recentBookings && stats.recentBookings.length > 0 ? (
              stats.recentBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming bookings</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No appointments scheduled for the next 7 days.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <div className="card">
              <div className="px-4 py-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">System Status</h3>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">WhatsApp Bot Online</span>
                </div>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Payment System Active</span>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="px-4 py-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Test WhatsApp Bot</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Send a test message to your WhatsApp number to verify the bot is working.
                </p>
                <button className="btn btn-primary text-sm w-full">
                  Send Test Message
                </button>
              </div>
            </div>

            <div className="card">
              <div className="px-4 py-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Business Hours</h3>
                <div className="text-sm text-gray-600">
                  <div>Mon-Fri: 9:00 AM - 5:00 PM</div>
                  <div>Saturday: 9:00 AM - 3:00 PM</div>
                  <div>Sunday: Closed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard