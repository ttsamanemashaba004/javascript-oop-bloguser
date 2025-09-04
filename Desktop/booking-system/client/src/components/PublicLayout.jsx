import { Link } from 'react-router-dom'

const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <span className="text-xl">💬</span>
            <span className="ml-2 text-lg font-bold text-white">SalonChat AI</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-white/80 sm:flex">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#how" className="hover:text-white">How It Works</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="#contact" className="hover:text-white">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="rounded-full border border-white/20 px-4 py-1.5 text-sm text-white hover:bg-white/10">Login</Link>
            <Link to="/onboarding" className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500">Get Started</Link>
          </div>
        </div>
      </header>
      <main>
        {children}
      </main>
      <footer id="contact" className="border-t border-white/10 bg-neutral-950 py-10">
        <div className="mx-auto max-w-7xl px-4 text-white/80">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="mb-2 text-white">SalonChat AI</div>
              <p className="text-sm">Empowering South African salons with intelligent AI assistance.</p>
            </div>
            <div>
              <div className="mb-2 text-white">Product</div>
              <ul className="space-y-1 text-sm">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#how" className="hover:text-white">Demo</a></li>
                <li><a href="#features" className="hover:text-white">Integrations</a></li>
              </ul>
            </div>
            <div>
              <div className="mb-2 text-white">Support</div>
              <ul className="space-y-1 text-sm">
                <li><a href="#contact" className="hover:text-white">Help Center</a></li>
                <li><a href="#contact" className="hover:text-white">Training</a></li>
                <li><a href="#contact" className="hover:text-white">Contact Us</a></li>
                <li><a href="#contact" className="hover:text-white">Status</a></li>
              </ul>
            </div>
            <div>
              <div className="mb-2 text-white">Contact</div>
              <ul className="space-y-1 text-sm">
                <li>+27 11 555 0123</li>
                <li>hello@salonchat.ai</li>
                <li>Cape Town, South Africa</li>
              </ul>
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-white/50">© 2024 SalonChat AI. All rights reserved. Made with 💜 in South Africa.</p>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout



