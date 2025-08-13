import axios from "axios"
import { setAuthToken } from "./auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"

// Get user profile
export const getUserProfile = async () => {
  try {
    const token = localStorage.getItem("token")
    setAuthToken(token)

    const response = await axios.get(`${API_URL}/user`)
    return response.data
  } catch (error) {
    throw error.response?.data || { message: "Server error" }
  }
}

// Update user profile
export const updateUserProfile = async (userData) => {
  try {
    const token = localStorage.getItem("token")
    setAuthToken(token)

    const response = await axios.put(`${API_URL}/user`, userData)

    // Update local storage with new user data
    localStorage.setItem("user", JSON.stringify(response.data))

    return response.data
  } catch (error) {
    throw error.response?.data || { message: "Server error" }
  }
}
