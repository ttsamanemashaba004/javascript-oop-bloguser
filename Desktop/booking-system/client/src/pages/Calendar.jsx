import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Phone, MessageCircle } from 'lucide-react'
import { bookingAPI } from '../services/api'
import { formatTime } from '../utils/dateUtils'
import moment from 'moment'

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(moment())
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [viewMode, setViewMode] = useState('month') // month, week, day

  useEffect(() => {
    loadBookings()
  }, [currentDate, viewMode])

  const loadBookings = async () => {
    try {
      setLoading(true)
      
      let startDate, endDate
      
      if (viewMode === 'month') {
        startDate = currentDate.clone().startOf('month').format('YYYY-MM-DD')
        endDate = currentDate.clone().endOf('month').format('YYYY-MM-DD')
      } else if (viewMode === 'week') {
        startDate = currentDate.clone().startOf('week').format('YYYY-MM-DD')
        endDate = currentDate.clone().endOf('week').format('YYYY-MM-DD')
      } else {
        startDate = currentDate.format('YYYY-MM-DD')
        endDate = currentDate.format('YYYY-MM-DD')
      }

      // Only load confirmed bookings (deposits paid)
      const response = await bookingAPI.getBookings({ 
        from: startDate, 
        to: endDate,
        status: 'confirmed'  // Only show confirmed bookings
      })
      setBookings(response.bookings || [])
    } catch (error) {
      console.error('Error loading calendar bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBookingsForDate = (date) => {
    const dateStr = date.format('YYYY-MM-DD')
    return bookings.filter(booking => 
      booking.start_ts.split('T')[0] === dateStr
    ).sort((a, b) => moment(a.start_ts).diff(moment(b.start_ts)))
  }

  const getStatusColor = (status) => {
    // Since we only show confirmed bookings, make them all green
    return 'bg-green-500 text-white'
  }

  const navigateCalendar = (direction) => {
    if (viewMode === 'month') {
      setCurrentDate(prev => direction === 'prev' ? prev.clone().subtract(1, 'month') : prev.clone().add(1, 'month'))
    } else if (viewMode === 'week') {
      setCurrentDate(prev => direction === 'prev' ? prev.clone().subtract(1, 'week') : prev.clone().add(1, 'week'))
    } else {
      setCurrentDate(prev => direction === 'prev' ? prev.clone().subtract(1, 'day') : prev.clone().add(1, 'day'))
    }
  }

  const getCalendarTitle = () => {
    if (viewMode === 'month') {
      return currentDate.format('MMMM YYYY')
    } else if (viewMode === 'week') {
      const startWeek = currentDate.clone().startOf('week')
      const endWeek = currentDate.clone().endOf('week')
      return `${startWeek.format('MMM D')} - ${endWeek.format('MMM D, YYYY')}`
    } else {
      return currentDate.format('dddd, MMMM D, YYYY')
    }
  }

  const renderMonthView = () => {
    const startOfMonth = currentDate.clone().startOf('month')
    const endOfMonth = currentDate.clone().endOf('month')
    const startDate = startOfMonth.clone().startOf('week')
    const endDate = endOfMonth.clone().endOf('week')
    
    const weeks = []
    let currentWeek = startDate.clone()
    
    while (currentWeek.isSameOrBefore(endDate, 'week')) {
      const days = []
      for (let i = 0; i < 7; i++) {
        const day = currentWeek.clone().add(i, 'days')
        const dayBookings = getBookingsForDate(day)
        const isCurrentMonth = day.isSame(currentDate, 'month')
        const isToday = day.isSame(moment(), 'day')
        
        days.push(
          <div
            key={day.format('YYYY-MM-DD')}
            className={`min-h-24 p-1 border border-gray-200 ${
              isCurrentMonth ? 'bg-white' : 'bg-gray-50'
            } ${isToday ? 'bg-blue-50' : ''}`}
          >
            <div className={`text-sm font-medium mb-1 ${
              isToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
            }`}>
              {day.format('D')}
            </div>
            <div className="space-y-1">
              {dayBookings.slice(0, 3).map((booking) => (
                <div
                  key={booking.id}
                  onClick={() => setSelectedBooking(booking)}
                  className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${getStatusColor(booking.status)}`}
                  title={`${booking.service?.name} - ${booking.customer?.name || 'Unknown'}`}
                >
                  <div className="truncate">
                    {formatTime(booking.start_ts)} {booking.service?.name}
                  </div>
                </div>
              ))}
              {dayBookings.length > 3 && (
                <div className="text-xs text-gray-500 font-medium">
                  +{dayBookings.length - 3} more
                </div>
              )}
            </div>
          </div>
        )
      }
      weeks.push(
        <div key={currentWeek.format('YYYY-MM-DD')} className="grid grid-cols-7 gap-0">
          {days}
        </div>
      )
      currentWeek.add(1, 'week')
    }
    
    return (
      <div className="bg-white rounded-lg shadow">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 gap-0 border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50">
              {day}
            </div>
          ))}
        </div>
        {/* Calendar Body */}
        <div>
          {weeks}
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const startOfWeek = currentDate.clone().startOf('week')
    const days = []
    
    for (let i = 0; i < 7; i++) {
      const day = startOfWeek.clone().add(i, 'days')
      const dayBookings = getBookingsForDate(day)
      const isToday = day.isSame(moment(), 'day')
      
      days.push(
        <div key={day.format('YYYY-MM-DD')} className="flex-1">
          <div className={`text-center p-2 border-b ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
            <div className="text-xs text-gray-500">{day.format('ddd')}</div>
            <div className={`text-lg font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
              {day.format('D')}
            </div>
          </div>
          <div className="p-2 space-y-1 min-h-96">
            {dayBookings.map((booking) => (
              <div
                key={booking.id}
                onClick={() => setSelectedBooking(booking)}
                className={`p-2 rounded cursor-pointer hover:opacity-80 ${getStatusColor(booking.status)}`}
              >
                <div className="text-sm font-medium">
                  {formatTime(booking.start_ts)}
                </div>
                <div className="text-xs truncate">
                  {booking.service?.name}
                </div>
                <div className="text-xs truncate">
                  {booking.customer?.name || 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }
    
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="flex">
          {days}
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const dayBookings = getBookingsForDate(currentDate)
    const isToday = currentDate.isSame(moment(), 'day')
    
    return (
      <div className="bg-white rounded-lg shadow">
        <div className={`p-4 border-b ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
          <h3 className={`text-lg font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {currentDate.format('dddd, MMMM D, YYYY')}
          </h3>
          <p className="text-sm text-gray-500">{dayBookings.length} appointments</p>
        </div>
        <div className="p-4">
          {dayBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No confirmed appointments</h3>
              <p className="mt-1 text-sm text-gray-500">No confirmed bookings for this day. Pending bookings are not shown.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayBookings.map((booking) => (
                <div
                  key={booking.id}
                  onClick={() => setSelectedBooking(booking)}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full bg-green-500`}></div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {formatTime(booking.start_ts)} - {booking.service?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.customer?.name || 'Unknown Customer'}
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Confirmed (Paid)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="mt-1 text-sm text-gray-500">
            View confirmed appointments with paid deposits
          </p>
        </div>
        
        {/* View Toggle */}
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['month', 'week', 'day'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === mode
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {getCalendarTitle()}
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Confirmed Only
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentDate(moment())}
            className="btn btn-outline text-sm"
          >
            Today
          </button>
          <button
            onClick={() => navigateCalendar('prev')}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigateCalendar('next')}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Calendar Views */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-salon-pink"></div>
        </div>
      ) : (
        <>
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Details</h3>
            
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500">Service</div>
                <div className="font-medium">{selectedBooking.service?.name}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500">Date & Time</div>
                <div className="font-medium">
                  {moment(selectedBooking.start_ts).format('dddd, MMMM D, YYYY [at] h:mm A')}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500">Customer</div>
                <div className="font-medium">{selectedBooking.customer?.name || 'Unknown'}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Confirmed (Deposit Paid)
                </span>
              </div>
              
              <div>
                <div className="text-sm text-gray-500">Staff</div>
                <div className="font-medium">{selectedBooking.staff?.name || 'Unassigned'}</div>
              </div>
            </div>
            
            {/* Contact Actions */}
            {selectedBooking.customer?.whatsapp_number && (
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => {
                    const number = selectedBooking.customer.whatsapp_number.replace('whatsapp:', '')
                    window.open(`https://wa.me/${number}`, '_blank')
                  }}
                  className="flex items-center space-x-2 text-green-600 hover:text-green-800"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm">WhatsApp</span>
                </button>
                <button
                  onClick={() => {
                    const number = selectedBooking.customer.whatsapp_number.replace('whatsapp:', '')
                    window.open(`tel:${number}`, '_blank')
                  }}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                >
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">Call</span>
                </button>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedBooking(null)}
                className="btn btn-outline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar