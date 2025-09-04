import { useState } from 'react'
import { Calendar, Filter } from 'lucide-react'

const DateFilter = ({ onFilterChange, loading }) => {
  const [fromDate, setFromDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  
  const [toDate, setToDate] = useState(() => {
    const weekFromNow = new Date()
    weekFromNow.setDate(weekFromNow.getDate() + 7)
    return weekFromNow.toISOString().split('T')[0]
  })

  const [status, setStatus] = useState('')

  const handleFilterChange = () => {
    onFilterChange({
      from: fromDate,
      to: toDate,
      status: status || undefined
    })
  }

  const presetFilters = [
    {
      label: 'Today',
      action: () => {
        const today = new Date().toISOString().split('T')[0]
        setFromDate(today)
        setToDate(today)
        onFilterChange({ from: today, to: today, status: status || undefined })
      }
    },
    {
      label: 'This Week',
      action: () => {
        const today = new Date()
        const weekFromNow = new Date()
        weekFromNow.setDate(today.getDate() + 7)
        const from = today.toISOString().split('T')[0]
        const to = weekFromNow.toISOString().split('T')[0]
        setFromDate(from)
        setToDate(to)
        onFilterChange({ from, to, status: status || undefined })
      }
    },
    {
      label: 'Next 30 Days',
      action: () => {
        const today = new Date()
        const monthFromNow = new Date()
        monthFromNow.setDate(today.getDate() + 30)
        const from = today.toISOString().split('T')[0]
        const to = monthFromNow.toISOString().split('T')[0]
        setFromDate(from)
        setToDate(to)
        onFilterChange({ from, to, status: status || undefined })
      }
    }
  ]

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Date Range Inputs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <label className="text-sm font-medium text-gray-700">From:</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="input text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">To:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="input text-sm"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input text-sm"
            >
              <option value="">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="hold">Hold</option>
              <option value="pending_deposit">Pending Deposit</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Filters */}
          {presetFilters.map((preset) => (
            <button
              key={preset.label}
              onClick={preset.action}
              className="btn btn-outline text-xs"
              disabled={loading}
            >
              {preset.label}
            </button>
          ))}
          
          {/* Apply Filter Button */}
          <button
            onClick={handleFilterChange}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              'Apply Filter'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DateFilter