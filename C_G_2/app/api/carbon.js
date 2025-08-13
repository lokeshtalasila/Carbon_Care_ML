import axios from "axios"
import { setAuthToken } from "./auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"
const FLASK_API_URL = process.env.NEXT_PUBLIC_FLASK_API_URL || "http://localhost:5000"

// Submit carbon footprint data
export const submitCarbonData = async (formData) => {
  try {
    // Get prediction and insights from Flask API
    console.log("Sending data to Flask API:", formData)
    const flaskResponse = await axios.post(`${FLASK_API_URL}/predict`, formData)
    console.log("Flask API response:", flaskResponse.data)

    // Check if we have a prediction
    if (flaskResponse.data && flaskResponse.data.prediction !== undefined) {
      return {
        prediction: flaskResponse.data.prediction,
        insights: {
          category_breakdown: flaskResponse.data.category_breakdown || [],
          top_individual_features: flaskResponse.data.top_individual_features || [],
          recommendations: flaskResponse.data.recommendations || [],
        },
      }
    } else {
      throw new Error("No prediction received from the API")
    }
  } catch (error) {
    console.error("Error in submitCarbonData:", error)
    throw error
  }
}

// Save carbon data to database with proper field mapping
export const saveCarbonDataToDatabase = async (formData, carbonEmission) => {
  try {
    const token = localStorage.getItem("token")
    setAuthToken(token)

    // Map API field names to MongoDB schema field names
    const dbData = {
      bodyType: formData["Body Type"],
      sex: formData["Sex"],
      diet: formData["Diet"],
      howOftenShower: formData["How Often Shower"],
      heatingEnergySource: formData["Heating Energy Source"],
      transport: formData["Transport"],
      vehicleType: formData["Vehicle Type"],
      socialActivity: formData["Social Activity"],
      monthlyGroceryBill: formData["Monthly Grocery Bill"],
      frequencyOfTravelingByAir: formData["Frequency of Traveling by Air"],
      vehicleMonthlyDistanceKm: formData["Vehicle Monthly Distance Km"],
      wasteBagSize: formData["Waste Bag Size"],
      wasteBagWeeklyCount: formData["Waste Bag Weekly Count"],
      howLongTvPcDailyHour: formData["How Long TV PC Daily Hour"],
      howManyNewClothesMonthly: formData["How Many New Clothes Monthly"],
      howLongInternetDailyHour: formData["How Long Internet Daily Hour"],
      energyEfficiency: formData["Energy efficiency"],
      recycling: formData["Recycling"],
      cookingWith: formData["Cooking_With"],
      // Store the prediction in kg as is
      carbonEmission: carbonEmission,
    }

    console.log("Saving to database with mapped fields:", dbData)

    const response = await axios.post(`${API_URL}/carbon-data`, dbData)
    return response.data
  } catch (error) {
    console.error("Error saving to database:", error)
    throw error.response?.data || { message: "Failed to save carbon data to database" }
  }
}

// Get all carbon footprint data for user
export const getCarbonData = async () => {
  try {
    const token = localStorage.getItem("token")
    setAuthToken(token)

    const response = await axios.get(`${API_URL}/carbon-data`)
    return response.data
  } catch (error) {
    console.error("Error fetching carbon data:", error)
    return []
  }
}

// Get latest carbon footprint data with insights
export const getLatestCarbonData = async () => {
  try {
    const token = localStorage.getItem("token")
    setAuthToken(token)

    const response = await axios.get(`${API_URL}/carbon-data/latest`)

    // If we have data, try to get insights with properly formatted field names
    if (response.data && response.data.latestData) {
      try {
        // Format the data with the field names the model expects
        const formattedData = {
          "Body Type": response.data.latestData.bodyType,
          Sex: response.data.latestData.sex,
          Diet: response.data.latestData.diet,
          "How Often Shower": response.data.latestData.howOftenShower,
          "Heating Energy Source": response.data.latestData.heatingEnergySource,
          Transport: response.data.latestData.transport,
          "Vehicle Type": response.data.latestData.vehicleType,
          "Social Activity": response.data.latestData.socialActivity,
          "Monthly Grocery Bill": response.data.latestData.monthlyGroceryBill,
          "Frequency of Traveling by Air": response.data.latestData.frequencyOfTravelingByAir,
          "Vehicle Monthly Distance Km": response.data.latestData.vehicleMonthlyDistanceKm,
          "Waste Bag Size": response.data.latestData.wasteBagSize,
          "Waste Bag Weekly Count": response.data.latestData.wasteBagWeeklyCount,
          "How Long TV PC Daily Hour": response.data.latestData.howLongTvPcDailyHour,
          "How Many New Clothes Monthly": response.data.latestData.howManyNewClothesMonthly,
          "How Long Internet Daily Hour": response.data.latestData.howLongInternetDailyHour,
          "Energy efficiency": response.data.latestData.energyEfficiency,
          Recycling: response.data.latestData.recycling,
          Cooking_With: response.data.latestData.cookingWith,
        }

        // Get insights directly from Flask API with properly formatted data
        console.log("Sending formatted data to Flask API for insights:", formattedData)
        const insightsResponse = await axios.post(`${FLASK_API_URL}/insights`, { carbonData: formattedData })

        if (insightsResponse.data && insightsResponse.data.insights) {
          // Replace the insights in the response with the ones from Flask API
          response.data.insights = insightsResponse.data.insights
        }
      } catch (insightsError) {
        console.error("Error getting insights from Flask API:", insightsError)
        // Don't provide fallback insights, just use what we have
      }
    }

    return response.data
  } catch (error) {
    console.error("Error fetching latest carbon data:", error)
    // Return null for new users instead of fallback data
    return null
  }
}

// Convert kg to tons
export const kgToTons = (kg) => {
  return kg / 1000
}
