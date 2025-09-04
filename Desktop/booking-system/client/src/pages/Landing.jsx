import { Brain, MessageCircle, CreditCard, Calendar as CalendarIcon, ShieldCheck, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

const StatBadge = () => (
  <div className="inline-flex items-center space-x-2 rounded-full border border-white/10 bg-white/5 py-1 pl-2 pr-3 text-xs text-white/80">
    <span className="inline-block h-2 w-2 rounded-full bg-pink-500"></span>
    <span>za Made for South African Salons</span>
  </div>
)

const StepCard = ({ step, title, children }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/90">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg font-semibold text-white">{step}</div>
    <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
    <p className="text-sm text-white/70">{children}</p>
  </div>
)

const FeatureCard = ({ icon: Icon, title, children }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/90">
    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
      <Icon className="h-5 w-5 text-white" />
    </div>
    <h4 className="mb-2 text-base font-semibold text-white">{title}</h4>
    <p className="text-sm text-white/70">{children}</p>
  </div>
)

const PlanCard = ({ label, price, cta, highlight = false, children }) => (
  <div className={`relative rounded-2xl border p-6 ${highlight ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10 bg-white/[0.03]'} text-white`}>
    {highlight && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs text-blue-200">Most Popular</div>
    )}
    <h5 className="mb-2 text-lg font-semibold">{label}</h5>
    <div className="mb-4 text-4xl font-extrabold">{price}<span className="ml-1 text-base font-medium text-white/60">/month</span></div>
    <ul className="mb-6 space-y-2 text-sm text-white/80">
      {children}
    </ul>
    <Link to="/onboarding" className={`inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-medium ${highlight ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-white/10 text-white hover:bg-white/20'}`}>{cta}</Link>
  </div>
)

const Landing = () => {
  return (
    <div className="text-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-neutral-950 py-24">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-32 -top-24 h-80 w-80 rounded-full bg-gradient-to-tr from-blue-500/20 to-pink-500/20 blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-gradient-to-tr from-purple-500/20 to-blue-500/20 blur-3xl"></div>
        </div>
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8"><StatBadge /></div>
          <h1 className="mb-4 text-5xl font-extrabold leading-tight sm:text-6xl">
            Your AI
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">receptionist that</span>
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">never sleeps</span>
          </h1>
          <p className="mb-10 max-w-2xl text-lg text-white/75">Transform your nail salon with an intelligent WhatsApp assistant that books appointments, handles payments, and chats with clients in their language — 24/7.</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/onboarding" className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium hover:bg-blue-500">Get Started</Link>
            <Link to="#how" className="rounded-full border border-white/20 px-5 py-2 text-sm font-medium text-white hover:bg-white/10">How It Works</Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="bg-neutral-950 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-2 text-center text-3xl font-bold">How It Works</h2>
          <p className="mb-10 text-center text-white/70">Four simple steps to get your AI salon assistant running</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StepCard step={1} title="Connect WhatsApp">Link your salon's WhatsApp Business account to our AI system in under 5 minutes.</StepCard>
            <StepCard step={2} title="Setup Your Salon">Configure your services, pricing, staff schedules, and salon information.</StepCard>
            <StepCard step={3} title="Train Your AI">Set tone, policies, FAQs and booking preferences for your assistant.</StepCard>
            <StepCard step={4} title="Go Live">Clients start booking appointments through WhatsApp instantly and automatically.</StepCard>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-neutral-950 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-2 text-center text-3xl font-bold">Powered by Advanced AI Technology</h2>
          <p className="mb-10 text-center text-white/70">Our intelligent system understands your salon's needs and provides human‑like customer service through WhatsApp.</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard icon={Brain} title="Intelligent Appointment Scheduling">AI finds the best available slots based on service duration, staff availability, and client preferences.</FeatureCard>
            <FeatureCard icon={MessageCircle} title="Natural Language Processing">Understands client requests in multiple South African languages and responds naturally.</FeatureCard>
            <FeatureCard icon={CreditCard} title="Smart Payment Processing">Automatically sends payment links, tracks deposits, and handles refunds for cancellations.</FeatureCard>
            <FeatureCard icon={CalendarIcon} title="Predictive Booking Analytics">Learns busy periods and popular services to optimize schedule and revenue.</FeatureCard>
            <FeatureCard icon={ShieldCheck} title="Privacy & Security Focused">Bank‑level encryption for client and payment info. POPIA compliant.</FeatureCard>
            <FeatureCard icon={Zap} title="Instant Response System">Responds to messages within seconds, even during peak hours or after hours.</FeatureCard>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-neutral-950 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-10 text-center text-3xl font-bold">Choose Your Plan</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            <PlanCard label="Starter" price="R299" cta="Start Free Trial">
              <li>Up to 100 bookings per month</li>
              <li>WhatsApp AI assistant</li>
              <li>Basic scheduling system</li>
              <li>Email support</li>
              <li>1 staff member</li>
              <li>Payment link generation</li>
            </PlanCard>
            <PlanCard label="Professional" price="R599" cta="Start Free Trial" highlight>
              <li>Up to 500 bookings per month</li>
              <li>Advanced AI with learning</li>
              <li>Multi‑language support (EN, ZU, XH, AF)</li>
              <li>Priority WhatsApp support</li>
              <li>Up to 4 staff members</li>
              <li>Advanced analytics dashboard</li>
              <li>Automated reminders</li>
              <li>Payment processing integration</li>
            </PlanCard>
            <PlanCard label="Enterprise" price="R1,299" cta="Contact Sales">
              <li>Unlimited bookings</li>
              <li>Custom AI training for your brand</li>
              <li>Multi‑location support</li>
              <li>24/7 priority phone support</li>
              <li>Unlimited staff members</li>
              <li>Custom integrations (POS)</li>
              <li>Advanced reporting & analytics</li>
              <li>Dedicated account manager</li>
            </PlanCard>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-neutral-950 pb-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <h3 className="mb-4 text-3xl font-extrabold">Ready to transform your salon?</h3>
            <p className="mx-auto mb-6 max-w-2xl text-white/70">Join hundreds of successful South African salons using SalonChat AI. Start your free trial today and see the difference in 24 hours.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/onboarding" className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500">Start Your Free 14‑Day Trial</Link>
              <a href="mailto:hello@salonchat.ai" className="rounded-full border border-white/20 px-5 py-2 text-sm font-medium text-white hover:bg-white/10">Schedule a Demo Call</a>
            </div>
            <p className="mt-3 text-xs text-white/50">No credit card required • Setup in 15 minutes • Cancel anytime</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Landing


