import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const Onboarding = () => {
  const navigate = useNavigate()
  const [salonId, setSalonId] = useState('')
  const [salonName, setSalonName] = useState('')
  const [deposit, setDeposit] = useState(0)
  const [services, setServices] = useState([{ name: '', duration_min: 60, price_cents: 0 }])
  const [staff, setStaff] = useState([{ name: '' }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const id = localStorage.getItem('salon_id')
    if (id) setSalonId(id)
  }, [])

  const addService = () => setServices([...services, { name: '', duration_min: 60, price_cents: 0 }])
  const addStaff = () => setStaff([...staff, { name: '' }])

  const save = async () => {
    try {
      setSaving(true)
      setError('')
      if (!salonId) throw new Error('Missing salon id from signup')

      // Attach salon header for setup endpoints (if any exist later)
      // For now, just navigate to dashboard to use default flows
      navigate('/dashboard')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Welcome! Let's set up your salon</h1>
      <div className="grid gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Salon name</label>
          <input className="w-full border rounded-md px-3 py-2" value={salonName} onChange={(e) => setSalonName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deposit amount (R)</label>
          <input type="number" className="w-full border rounded-md px-3 py-2" value={deposit} onChange={(e) => setDeposit(parseInt(e.target.value || 0) || 0)} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Services</label>
            <button className="text-salon-pink" onClick={addService}>Add service</button>
          </div>
          <div className="space-y-3">
            {services.map((s, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input placeholder="Name" className="border rounded-md px-3 py-2" value={s.name} onChange={(e) => setServices(services.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} />
                <input type="number" placeholder="Duration (min)" className="border rounded-md px-3 py-2" value={s.duration_min} onChange={(e) => setServices(services.map((x, idx) => idx === i ? { ...x, duration_min: parseInt(e.target.value || 0) || 0 } : x))} />
                <input type="number" placeholder="Price (R)" className="border rounded-md px-3 py-2" value={s.price_cents / 100} onChange={(e) => setServices(services.map((x, idx) => idx === i ? { ...x, price_cents: (parseInt(e.target.value || 0) || 0) * 100 } : x))} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Staff</label>
            <button className="text-salon-pink" onClick={addStaff}>Add staff</button>
          </div>
          <div className="space-y-3">
            {staff.map((m, i) => (
              <div key={i}>
                <input placeholder="Name" className="border rounded-md px-3 py-2 w-full" value={m.name} onChange={(e) => setStaff(staff.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} />
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button className="bg-salon-pink text-white rounded-md px-4 py-2" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Finish setup'}</button>
          <button className="border border-gray-300 rounded-md px-4 py-2" onClick={() => navigate('/dashboard')}>Skip for now</button>
        </div>
      </div>
    </div>
  )
}

export default Onboarding


