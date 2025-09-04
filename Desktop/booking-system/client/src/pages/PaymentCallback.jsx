import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { publicAPI } from '../services/api'

const PaymentCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('Verifying payment…')

  useEffect(() => {
    const verify = async () => {
      try {
        const reference = searchParams.get('reference') || searchParams.get('trxref')
        if (!reference) {
          setStatus('Missing payment reference')
          return
        }
        const res = await publicAPI.verifyPayment(reference)
        const paystackStatus = res?.data?.status || res?.data?.gateway_response
        if (res?.success && (paystackStatus === 'success' || paystackStatus === 'successful')) {
          localStorage.setItem('payment_reference', reference)
          setStatus('Payment verified! Redirecting to dashboard…')
          setTimeout(() => navigate('/dashboard'), 800)
        } else {
          setStatus('Payment not successful. Please try again or contact support.')
        }
      } catch (e) {
        setStatus('Verification failed. Please refresh or contact support.')
      }
    }
    verify()
  }, [searchParams, navigate])

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Payment Status</h1>
      <p>{status}</p>
    </div>
  )
}

export default PaymentCallback


