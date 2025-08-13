"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Shield, Home, BarChart3, FileInput, Settings, LogOut, Menu, X, User } from "lucide-react"
import { isAuthenticated, logout, getCurrentUser } from "../api/auth"

export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }

    // Get user data
    const userData = getCurrentUser()
    setUser(userData)
    setIsLoading(false)
  }, [router])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md bg-white shadow-md">
          {isMobileMenuOpen ? <X className="h-6 w-6 text-gray-600" /> : <Menu className="h-6 w-6 text-gray-600" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transition-transform duration-300 transform ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <Link href="/" className="flex items-center">
              <Shield className="h-6 w-6 text-emerald-600 mr-2" />
              <span className="text-xl font-bold">Carbon Care</span>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Home className="h-5 w-5 mr-3 text-gray-500" />
              Dashboard
            </Link>
            <Link
              href="/dashboard/carbon-form"
              className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <FileInput className="h-5 w-5 mr-3 text-gray-500" />
              Carbon Form
            </Link>
            <Link
              href="/dashboard/insights"
              className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <BarChart3 className="h-5 w-5 mr-3 text-gray-500" />
              Insights
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Settings className="h-5 w-5 mr-3 text-gray-500" />
              Settings
            </Link>
          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center mb-4">
              <div className="bg-gray-200 rounded-full p-2 mr-2">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium">{user?.name || "User"}</p>
                <p className="text-xs text-gray-500">{user?.email || "user@example.com"}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100"
            >
              <LogOut className="h-5 w-5 mr-3 text-gray-500" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
