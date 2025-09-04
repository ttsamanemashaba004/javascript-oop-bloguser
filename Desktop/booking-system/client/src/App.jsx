import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import PublicLayout from './components/PublicLayout'
import Dashboard from './pages/Dashboard'
import Calendar from './pages/Calendar'
import Bookings from './pages/Bookings'
import Landing from './pages/Landing'
import Onboarding from './pages/Onboarding'
import PaymentCallback from './pages/PaymentCallback'

function App() {
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
        <Route path="/onboarding" element={<PublicLayout><Onboarding /></PublicLayout>} />
        <Route path="/payment/callback" element={<PublicLayout><PaymentCallback /></PublicLayout>} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/calendar" element={<Layout><Calendar /></Layout>} />
        <Route path="/bookings" element={<Layout><Bookings /></Layout>} />
      </Routes>
    </>
  )
}

export default App