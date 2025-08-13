import Link from "next/link"
import { ArrowRight, BarChart3, Leaf, Shield } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-green-500 to-emerald-700 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto gap-6">
            <div className="inline-flex items-center justify-center p-2 bg-white/10 backdrop-blur-sm rounded-full mb-4">
              <Shield className="h-6 w-6 mr-2" />
              <span className="text-sm font-medium">Carbon Care</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Monitor & Reduce Your Carbon Footprint</h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl">
              Track your daily activities, understand your environmental impact, and take action to reduce your carbon
              emissions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Link
                href="/signup"
                className="bg-white text-emerald-700 hover:bg-white/90 px-6 py-3 rounded-lg font-medium flex items-center justify-center"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="bg-emerald-600 text-white hover:bg-emerald-500 px-6 py-3 rounded-lg font-medium"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How Carbon Care Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our platform makes it easy to track, analyze, and reduce your carbon footprint through simple data
              collection and powerful insights.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Leaf className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Your Activities</h3>
              <p className="text-gray-600">
                Log your daily habits, transportation, energy usage, and consumption patterns through our simple form.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Personalized Insights</h3>
              <p className="text-gray-600">
                Receive detailed analysis of your carbon footprint with breakdown by categories and comparison to
                averages.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Reduce Your Impact</h3>
              <p className="text-gray-600">
                Get personalized recommendations and track your progress as you work to reduce your environmental
                impact.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Join the Movement Today</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Be part of the solution to climate change. Start tracking your carbon footprint and make a positive impact
            on the environment.
          </p>
          <Link
            href="/signup"
            className="bg-emerald-600 text-white hover:bg-emerald-500 px-6 py-3 rounded-lg font-medium inline-flex items-center"
          >
            Create Your Account
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center mb-4">
                <Shield className="h-6 w-6 mr-2" />
                <span className="text-xl font-bold">Carbon Care</span>
              </div>
              <p className="text-gray-400 max-w-md">
                Helping individuals understand and reduce their environmental impact through data-driven insights.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Product</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white">
                      How it works
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white">
                      Pricing
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Resources</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white">
                      Guides
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white">
                      Support
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Company</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white">
                      Contact
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white">
                      Privacy
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            {/* <p>© {new Date().getFullYear()} Carbon Care. All rights reserved.</p> */}
          </div>
        </div>
      </footer>
    </div>
  )
}
