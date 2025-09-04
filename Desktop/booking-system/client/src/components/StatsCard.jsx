const StatsCard = ({ title, value, icon: Icon, color = 'salon-pink', suffix = '' }) => {
    const colorClasses = {
      'salon-pink': 'text-salon-pink bg-pink-100',
      'blue': 'text-blue-600 bg-blue-100',
      'green': 'text-green-600 bg-green-100',
      'yellow': 'text-yellow-600 bg-yellow-100',
    }
  
    return (
      <div className="stat-card">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                  {suffix && <span className="text-sm text-gray-500 ml-1">{suffix}</span>}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    )
  }
  
  export default StatsCard