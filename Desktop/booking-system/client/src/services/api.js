import axios from 'axios'
import moment from 'moment'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
const DEFAULT_SALON_ID = import.meta.env.VITE_DEFAULT_SALON_ID

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add default salon_id to requests if not provided
    const storedSalonId = localStorage.getItem('salon_id')
    if (!config.params?.salon_id && (storedSalonId || DEFAULT_SALON_ID)) {
      config.params = { ...config.params, salon_id: storedSalonId || DEFAULT_SALON_ID }
    }
    if (storedSalonId) {
      config.headers = { ...config.headers, 'x-salon-id': storedSalonId }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export const bookingAPI = {
  // Get bookings
  getBookings: async (params = {}) => {
    const response = await api.get('/bookings', { params })
    return response.data
  },

  // Create booking
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData)
    return response.data
  },

  // Update booking status
  updateBooking: async (id, data) => {
    const response = await api.patch(`/bookings/${id}`, data)
    return response.data
  },

  // Get availability
  getAvailability: async (serviceId, date) => {
    const response = await api.get('/availability', {
      params: { service_id: serviceId, date }
    })
    return response.data
  },

  // Get services
  getServices: async () => {
    const response = await api.get('/services')
    return response.data
  },

  // Get staff
  getStaff: async () => {
    const response = await api.get('/staff')
    return response.data
  },
}

export const statsAPI = {
  // Get dashboard stats
  getStats: async (fromDate, toDate) => {
    console.log('StatsAPI: Loading bookings from TODAY FORWARD:', fromDate, 'to', toDate)
    
    // Get bookings for the forward-looking period (today + next 7 days)
    const bookings = await bookingAPI.getBookings({ from: fromDate, to: toDate })
    
    console.log('StatsAPI: Loaded bookings:', bookings.bookings?.length || 0)
    
    const today = new Date().toISOString().split('T')[0]
    const allBookings = bookings.bookings || []
    
    // Today's bookings (same day)
    const todayBookings = allBookings.filter(b => 
      b.start_ts.split('T')[0] === today
    )

    // Tomorrow's bookings (next day)
    const tomorrow = moment().add(1, 'day').format('YYYY-MM-DD')
    const tomorrowBookings = allBookings.filter(b => 
      b.start_ts.split('T')[0] === tomorrow
    )

    // Confirmed bookings (for revenue)
    const confirmedBookings = allBookings.filter(b => 
      b.status === 'confirmed'
    )

    // Pending bookings (hold or pending_deposit)
    const pendingBookings = allBookings.filter(b => 
      ['hold', 'pending_deposit'].includes(b.status)
    )

    // Revenue calculation (confirmed bookings * deposit amount)
    const revenue = confirmedBookings.length * 100 // R100 per booking

    // Recent bookings (sorted by appointment date, upcoming first)
    const recentBookings = allBookings
      .sort((a, b) => new Date(a.start_ts) - new Date(b.start_ts))
      .slice(0, 5)

    const stats = {
      todayBookings: todayBookings.length,
      tomorrowBookings: tomorrowBookings.length,
      weekBookings: allBookings.length,
      totalRevenue: revenue,
      pendingDeposits: pendingBookings.length,
      recentBookings: recentBookings
    }
    
    console.log('StatsAPI: Calculated stats for NEXT 7 DAYS:', stats)
    return stats
  }
}

export const publicAPI = {
  initiatePayment: async ({ email, amount, packageName }) => {
    const response = await axios.post(`${API_BASE_URL.replace('/api','')}/public/payments/initiate`, {
      email,
      amount,
      package: packageName,
    })
    return response.data
  },
  verifyPayment: async (reference) => {
    const response = await axios.get(`${API_BASE_URL.replace('/api','')}/public/payments/verify`, { params: { reference } })
    return response.data
  },
  signup: async (payload) => {
    const response = await axios.post(`${API_BASE_URL.replace('/api','')}/public/signup`, payload)
    return response.data
  }
}

export default api