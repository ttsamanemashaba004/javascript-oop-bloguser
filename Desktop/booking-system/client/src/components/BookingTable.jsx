import { useState } from 'react'
import { ChevronDown, Phone, MessageCircle } from 'lucide-react'
import { formatDateTime, formatTime, formatDate } from '../utils/dateUtils'
import { bookingAPI } from '../services/api'

const BookingTable = ({ bookings, onBookingUpdate }) => {
  const [updating, setUpdating] = useState({})

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'hold':
        return 'bg-yellow-100 text-yellow-800'
      case 'pending_deposit':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'no_show':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      setUpdating({ ...updating, [bookingId]: true })
      await bookingAPI.updateBooking(bookingId, { status: newStatus })
      if (onBookingUpdate) {
        onBookingUpdate()
      }
    } catch (error) {
      console.error('Error updating booking:', error)
      alert('Failed to update booking status')
    } finally {
      setUpdating({ ...updating, [bookingId]: false })
    }
  }

  const formatCustomerContact = (customer) => {
    if (!customer) return 'Unknown'
    return customer.name || customer.whatsapp_number?.replace('whatsapp:', '') || 'Unknown'
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">📅</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
        <p className="text-gray-500">Bookings will appear here as customers make appointments.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date & Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Service
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Staff
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {bookings.map((booking) => (
            <tr key={booking.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {formatDate(booking.start_ts)}
                </div>
                <div className="text-sm text-gray-500">
                  {formatTime(booking.start_ts)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {formatCustomerContact(booking.customer)}
                </div>
                {booking.customer?.whatsapp_number && (
                  <div className="text-xs text-gray-500">
                    {booking.customer.whatsapp_number.replace('whatsapp:', '')}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {booking.service?.name || 'Unknown Service'}
                </div>
                <div className="text-xs text-gray-500">
                  {booking.service?.duration_min} minutes
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {booking.staff?.name || 'Unassigned'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    booking.status
                  )}`}
                >
                  {booking.status.replace('_', ' ')}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-2">
                  {/* Status Update Dropdown */}
                  <div className="relative inline-block text-left">
                    <select
                      value={booking.status}
                      onChange={(e) => handleStatusUpdate(booking.id, e.target.value)}
                      disabled={updating[booking.id]}
                      className="block w-full pl-3 pr-10 py-1 text-xs border-gray-300 focus:outline-none focus:ring-salon-pink focus:border-salon-pink rounded-md"
                    >
                      <option value="hold">Hold</option>
                      <option value="pending_deposit">Pending Deposit</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="no_show">No Show</option>
                    </select>
                  </div>

                  {/* Contact Actions */}
                  {booking.customer?.whatsapp_number && (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => {
                          const number = booking.customer.whatsapp_number.replace('whatsapp:', '')
                          window.open(`https://wa.me/${number}`, '_blank')
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Send WhatsApp message"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          const number = booking.customer.whatsapp_number.replace('whatsapp:', '')
                          window.open(`tel:${number}`, '_blank')
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Call customer"
                      >
                        <Phone className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default BookingTable