import { useState, useEffect } from 'react'
import { RefreshCw, Download, Plus } from 'lucide-react'
import BookingTable from '../components/BookingTable'
import DateFilter from '../components/DateFilter'
import { bookingAPI } from '../services/api'
import { getTodayDate, getWeekFromNow } from '../utils/dateUtils'

const Bookings = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    from: getTodayDate(),
    to: getWeekFromNow(),
    status: undefined
  })

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async (newFilters = filters) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await bookingAPI.getBookings(newFilters)
      setBookings(response.bookings || [])
    } catch (err) {
      console.error('Error loading bookings:', err)
      setError('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    loadBookings(newFilters)
  }

  const handleRefresh = () => {
    loadBookings()
  }

  const handleExport = () => {
    // Simple CSV export
    if (!bookings.length) return

    const headers = ['Date', 'Time', 'Customer', 'Phone', 'Service', 'Staff', 'Status', 'Source']
    const csvContent = [
      headers.join(','),
      ...bookings.map(booking => [
        booking.start_ts.split('T')[0],
        new Date(booking.start_ts).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }),
        booking.customer?.name || 'Unknown',
        booking.customer?.whatsapp_number?.replace('whatsapp:', '') || '',
        booking.service?.name || 'Unknown',
        booking.staff?.name || 'Unassigned',
        booking.status,
        booking.source
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookings-${filters.from}-to-${filters.to}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getBookingStats = () => {
    if (!bookings.length) return { total: 0, confirmed: 0, pending: 0, revenue: 0 }
    
    const confirmed = bookings.filter(b => b.status === 'confirmed').length
    const pending = bookings.filter(b => ['hold', 'pending_deposit'].includes(b.status)).length
    const revenue = confirmed * 100 // R100 per confirmed booking

    return {
      total: bookings.length,
      confirmed,
      pending,
      revenue
    }
  }

  const stats = getBookingStats()

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all your salon appointments in one place
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="btn btn-outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={!bookings.length}
            className="btn btn-secondary"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Bookings</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
          <div className="text-sm text-gray-500">Confirmed</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-salon-pink">R{stats.revenue}</div>
          <div className="text-sm text-gray-500">Revenue</div>
        </div>
      </div>

      {/* Date Filter */}
      <DateFilter onFilterChange={handleFilterChange} loading={loading} />

      {/* Error State */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="text-sm text-red-700">{error}</div>
          <button
            onClick={handleRefresh}
            className="mt-2 btn btn-primary text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Bookings Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Appointments ({bookings.length})
            </h3>
            {filters.status && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Filtered by: {filters.status.replace('_', ' ')}
              </span>
            )}
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-salon-pink"></div>
            </div>
          ) : (
            <BookingTable 
              bookings={bookings} 
              onBookingUpdate={() => loadBookings()}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default Bookings