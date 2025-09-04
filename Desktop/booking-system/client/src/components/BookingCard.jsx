import { Clock, User, Scissors } from 'lucide-react'
import { formatTime, formatDate, getRelativeDate } from '../utils/dateUtils'

const BookingCard = ({ booking }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'hold':
      case 'pending_deposit':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="card">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-salon-pink rounded-full flex items-center justify-center">
                <Scissors className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {booking.service?.name || 'Unknown Service'}
              </p>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                {getRelativeDate(booking.start_ts)} at {formatTime(booking.start_ts)}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                booking.status
              )}`}
            >
              {booking.status.replace('_', ' ')}
            </span>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex items-center text-sm text-gray-500">
            <User className="w-4 h-4 mr-1" />
            <span>{booking.customer?.name || 'Unknown Customer'}</span>
            <span className="ml-2 text-xs">
              {booking.customer?.whatsapp_number}
            </span>
          </div>
          {booking.staff && (
            <div className="mt-1 text-sm text-gray-500">
              Staff: {booking.staff.name}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookingCard