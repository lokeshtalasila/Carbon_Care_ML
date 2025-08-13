"use client"

import { useState, useEffect } from "react"
import { Save, Loader2 } from "lucide-react"
import { getUserProfile, updateUserProfile } from "../../api/user"

export default function Settings() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    notifications: {
      email: true,
      monthlyReport: true,
      tips: true,
    },
    preferences: {
      theme: "light",
      units: "metric",
    },
  })

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userData = await getUserProfile()
        setFormData({
          name: userData.name,
          email: userData.email,
          notifications: userData.notifications,
          preferences: userData.preferences,
        })
      } catch (err) {
        console.error("Error fetching user profile:", err)
        setError("Failed to load user profile. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target
    const [category, setting] = name.split(".")

    setFormData({
      ...formData,
      [category]: {
        ...formData[category],
        [setting]: checked,
      },
    })
  }

  const handleSelectChange = (e) => {
    const { name, value } = e.target
    const [category, setting] = name.split(".")

    setFormData({
      ...formData,
      [category]: {
        ...formData[category],
        [setting]: value,
      },
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setSuccessMessage("")
    setError("")

    try {
      await updateUserProfile(formData)
      setSuccessMessage("Settings saved successfully!")
    } catch (err) {
      console.error("Error saving settings:", err)
      setError(err.message || "Failed to save settings. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-600">Manage your account preferences</p>
      </div>

      <form onSubmit={handleSubmit}>
        {successMessage && <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6">{successMessage}</div>}
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}

        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold mb-6">Account Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifications.email"
                name="notifications.email"
                checked={formData.notifications.email}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label htmlFor="notifications.email" className="ml-2 block text-sm text-gray-700">
                Email notifications
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifications.monthlyReport"
                name="notifications.monthlyReport"
                checked={formData.notifications.monthlyReport}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label htmlFor="notifications.monthlyReport" className="ml-2 block text-sm text-gray-700">
                Monthly carbon footprint report
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifications.tips"
                name="notifications.tips"
                checked={formData.notifications.tips}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label htmlFor="notifications.tips" className="ml-2 block text-sm text-gray-700">
                Tips and recommendations for reducing carbon footprint
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold mb-6">Display Preferences</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <select
                name="preferences.theme"
                value={formData.preferences.theme}
                onChange={handleSelectChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
              <select
                name="preferences.units"
                value={formData.preferences.units}
                onChange={handleSelectChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="metric">Metric (kg, km)</option>
                <option value="imperial">Imperial (lb, mi)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-emerald-600 text-white py-2 px-6 rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
