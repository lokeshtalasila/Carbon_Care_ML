"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  BarChart3,
  FileInput,
  ArrowRight,
  Leaf,
  TrendingDown,
  AlertTriangle,
  Award,
  Target,
  Calendar,
  CheckCircle2,
} from "lucide-react"
import { getLatestCarbonData, kgToTons } from "../api/carbon"

export default function Dashboard() {
  const [userData, setUserData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getLatestCarbonData()

        // Check if user has any data
        if (!data || !data.latestData) {
          // New user - no data available
          setUserData(null)
          setIsLoading(false)
          return
        }

        // Transform data for UI
        const transformedData = {
          name: data.latestData?.user?.name || "User",
          carbonFootprint: {
            // Convert kg to tons
            current: kgToTons(data.latestData?.carbonEmission || 0),
            previous: kgToTons(data.previousData?.carbonEmission || 0),
            change: data.changePercentage || 0,
            globalAverage: 1.35, // Static value for now (monthly in tons)
            countryAverage: 1.31, // Static value for now (monthly in tons)
          },
          lastSubmission: data.latestData?.date || null,
          categoryBreakdown: data.insights?.category_breakdown || [],
          topIndividualFeatures: data.insights?.top_individual_features || [],
          recommendations: data.insights?.recommendations || [],
        }

        setUserData(transformedData)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load dashboard data. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  // Show new user interface if no data
  if (!userData) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-16">
          <div className="bg-white p-8 rounded-xl border border-gray-200 max-w-2xl mx-auto">
            <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileInput className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Welcome to Carbon Guard!</h1>
            <p className="text-gray-600 mb-8 text-lg">
              Start your carbon footprint tracking journey by filling out your first assessment form. This will help us
              understand your current environmental impact and provide personalized recommendations.
            </p>
            <Link
              href="/dashboard/carbon-form"
              className="bg-emerald-600 text-white py-3 px-8 rounded-lg hover:bg-emerald-500 inline-flex items-center text-lg font-medium"
            >
              <FileInput className="h-5 w-5 mr-2" />
              Fill Your First Form
            </Link>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
              <div className="flex items-center justify-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Track your impact
              </div>
              <div className="flex items-center justify-center">
                <Target className="h-4 w-4 mr-2" />
                Get recommendations
              </div>
              <div className="flex items-center justify-center">
                <TrendingDown className="h-4 w-4 mr-2" />
                Reduce emissions
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
        <Link
          href="/dashboard/carbon-form"
          className="bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-500 inline-flex items-center"
        >
          <FileInput className="h-4 w-4 mr-2" />
          Submit Your Carbon Data
        </Link>
      </div>
    )
  }

  // Calculate achievement level based on carbon reduction
  const getAchievementLevel = () => {
    if (!userData.carbonFootprint.previous) return "beginner"

    const reduction = userData.carbonFootprint.change
    if (reduction <= -15) return "gold"
    if (reduction <= -10) return "silver"
    if (reduction <= -5) return "bronze"
    return "beginner"
  }

  const achievementLevel = getAchievementLevel()

  // Calculate progress percentage toward target (assuming target is 20% below global average)
  const targetEmission = userData.carbonFootprint.globalAverage * 0.8 // Monthly target in tons
  const currentMonthlyEmission = userData.carbonFootprint.current
  const progressPercentage = Math.min(
    100,
    Math.max(
      0,
      ((userData.carbonFootprint.globalAverage - currentMonthlyEmission) /
        (userData.carbonFootprint.globalAverage - targetEmission)) *
        100,
    ),
  )

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Welcome back, {userData.name}</h1>
        <p className="text-gray-600">Here's an overview of your carbon footprint</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link
          href="/dashboard/carbon-form"
          className="bg-white p-6 rounded-xl border border-gray-200 hover:border-emerald-500 transition-colors flex items-center"
        >
          <div className="bg-emerald-100 p-3 rounded-full mr-4">
            <FileInput className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Update Your Data</h3>
            <p className="text-gray-600 text-sm">
              {userData.lastSubmission
                ? `Last updated on ${new Date(userData.lastSubmission).toLocaleDateString()}`
                : "Submit your first carbon footprint data"}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400" />
        </Link>

        <Link
          href="/dashboard/insights"
          className="bg-white p-6 rounded-xl border border-gray-200 hover:border-emerald-500 transition-colors flex items-center"
        >
          <div className="bg-emerald-100 p-3 rounded-full mr-4">
            <BarChart3 className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">View Detailed Insights</h3>
            <p className="text-gray-600 text-sm">Analyze your carbon footprint in depth</p>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400" />
        </Link>
      </div>

      {/* Carbon footprint overview */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold mb-4">Carbon Footprint Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Current Monthly Footprint</p>
            <div className="flex items-end">
              <span className="text-3xl font-bold">{userData.carbonFootprint.current.toFixed(2)}</span>
              <span className="text-gray-500 ml-1 mb-1">tons CO₂/month</span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Previous Period</p>
            <div className="flex items-end">
              <span className="text-3xl font-bold">{userData.carbonFootprint.previous.toFixed(2)}</span>
              <span className="text-gray-500 ml-1 mb-1">tons CO₂/month</span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Change</p>
            <div className="flex items-center">
              <span
                className={`text-3xl font-bold ${userData.carbonFootprint.change < 0 ? "text-green-600" : "text-red-600"}`}
              >
                {userData.carbonFootprint.change.toFixed(2)}%
              </span>
              {userData.carbonFootprint.change < 0 ? (
                <TrendingDown className="h-5 w-5 text-green-600 ml-2" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600 ml-2" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Carbon Reduction Progress (New Section) */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold mb-6">Your Carbon Reduction Journey</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Progress Toward Target */}
          <div className="col-span-2">
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Progress Toward Target</span>
                <span className="text-sm text-emerald-600 font-medium">{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-emerald-600 h-4 rounded-full transition-all duration-1000 ease-in-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Current: {currentMonthlyEmission.toFixed(2)} tons/month</span>
                <span>Target: {targetEmission.toFixed(2)} tons/month</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Tracking Since</p>
                  <p className="text-gray-600 text-xs">
                    {userData.lastSubmission ? new Date(userData.lastSubmission).toLocaleDateString() : "Just started"}
                  </p>
                </div>
              </div>

              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Carbon Saved</p>
                  <p className="text-gray-600 text-xs">
                    {userData.carbonFootprint.change < 0
                      ? `${(Math.abs(userData.carbonFootprint.change / 100) * userData.carbonFootprint.previous).toFixed(2)} tons/month`
                      : "0 tons/month"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Achievement Badge */}
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl">
            <div
              className={`p-4 rounded-full mb-3 ${
                achievementLevel === "gold"
                  ? "bg-yellow-100"
                  : achievementLevel === "silver"
                    ? "bg-gray-200"
                    : achievementLevel === "bronze"
                      ? "bg-amber-100"
                      : "bg-blue-100"
              }`}
            >
              <Award
                className={`h-12 w-12 ${
                  achievementLevel === "gold"
                    ? "text-yellow-600"
                    : achievementLevel === "silver"
                      ? "text-gray-500"
                      : achievementLevel === "bronze"
                        ? "text-amber-700"
                        : "text-blue-600"
                }`}
              />
            </div>
            <h3 className="text-lg font-semibold mb-1">
              {achievementLevel === "gold"
                ? "Gold Reducer"
                : achievementLevel === "silver"
                  ? "Silver Reducer"
                  : achievementLevel === "bronze"
                    ? "Bronze Reducer"
                    : "Carbon Guardian"}
            </h3>
            <p className="text-sm text-center text-gray-600 mb-3">
              {achievementLevel === "gold"
                ? "Exceptional 15%+ reduction"
                : achievementLevel === "silver"
                  ? "Great 10%+ reduction"
                  : achievementLevel === "bronze"
                    ? "Good 5%+ reduction"
                    : "Just getting started"}
            </p>
            <div className="flex space-x-1">
              <CheckCircle2
                className={`h-5 w-5 ${achievementLevel !== "beginner" ? "text-emerald-500" : "text-gray-300"}`}
              />
              <CheckCircle2
                className={`h-5 w-5 ${achievementLevel === "bronze" || achievementLevel === "silver" || achievementLevel === "gold" ? "text-emerald-500" : "text-gray-300"}`}
              />
              <CheckCircle2
                className={`h-5 w-5 ${achievementLevel === "silver" || achievementLevel === "gold" ? "text-emerald-500" : "text-gray-300"}`}
              />
              <CheckCircle2
                className={`h-5 w-5 ${achievementLevel === "gold" ? "text-emerald-500" : "text-gray-300"}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
        <ul className="space-y-3">
          {userData.recommendations.map((recommendation, index) => (
            <li key={index} className="flex items-start">
              <Leaf className="h-5 w-5 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{recommendation.description || recommendation}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
