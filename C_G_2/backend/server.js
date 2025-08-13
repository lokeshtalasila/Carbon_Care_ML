const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const axios = require("axios")

// Load environment variables
dotenv.config()

// Import models
const User = require("./models/User")
const CarbonData = require("./models/CarbonData")

// Initialize Express app
const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb+srv://testuser:shambho801@cluster0.px6ohlp.mongodb.net/")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err))

// Routes
// Auth routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      preferences: {
        theme: "light",
        units: "metric",
      },
      notifications: {
        email: true,
        monthlyReport: true,
        tips: true,
      },
    })

    await user.save()

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "your_jwt_secret", { expiresIn: "7d" })

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        notifications: user.notifications,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Check if user exists
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "your_jwt_secret", { expiresIn: "7d" })

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        notifications: user.notifications,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Middleware to verify JWT token
const auth = (req, res, next) => {
  const token = req.header("x-auth-token")

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret")
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" })
  }
}

// User routes
app.get("/api/user", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    res.json(user)
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.put("/api/user", auth, async (req, res) => {
  try {
    const { name, email, preferences, notifications } = req.body

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        email,
        preferences,
        notifications,
      },
      { new: true },
    ).select("-password")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json(user)
  } catch (error) {
    console.error("Update user error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Carbon data routes
app.post("/api/carbon-data", auth, async (req, res) => {
  try {
    const formData = req.body

    // Create new carbon data entry
    const carbonData = new CarbonData({
      user: req.user.id,
      ...formData,
      date: new Date(),
    })

    await carbonData.save()

    // If carbonEmission is already provided in the request, use it
    if (formData.carbonEmission !== undefined) {
      carbonData.carbonEmission = formData.carbonEmission
      await carbonData.save()

      // Try to get insights from Flask API
      try {
        const flaskResponse = await axios.post(`${process.env.FLASK_API_URL || "http://localhost:5000"}/insights`, {
          carbonData: formData,
        })

        res.status(201).json({
          carbonData,
          insights: flaskResponse.data.insights,
        })
      } catch (flaskError) {
        console.error("Flask API insights error:", flaskError)
        // If Flask API fails, return the data without insights
        res.status(201).json({
          carbonData,
          insights: generateSimpleInsights(formData, carbonData.carbonEmission),
        })
      }
      return
    }

    // If no carbonEmission provided, call Flask API for prediction
    try {
      const flaskResponse = await axios.post(process.env.FLASK_API_URL || "http://localhost:5000/predict", formData)

      // Update carbon data with prediction
      carbonData.carbonEmission = flaskResponse.data.prediction
      await carbonData.save()

      res.status(201).json({
        carbonData,
        insights: flaskResponse.data.insights,
      })
    } catch (flaskError) {
      console.error("Flask API error:", flaskError)
      // If Flask API fails, use a simple calculation
      carbonData.carbonEmission = calculateSimpleCarbonEmission(formData)
      await carbonData.save()

      res.status(201).json({
        carbonData,
        insights: generateSimpleInsights(formData, carbonData.carbonEmission),
      })
    }
  } catch (error) {
    console.error("Save carbon data error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/api/carbon-data", auth, async (req, res) => {
  try {
    const carbonData = await CarbonData.find({ user: req.user.id }).sort({ date: -1 })
    res.json(carbonData)
  } catch (error) {
    console.error("Get carbon data error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update the /api/carbon-data/latest endpoint to properly format data for insights
app.get("/api/carbon-data/latest", auth, async (req, res) => {
  try {
    const latestData = await CarbonData.findOne({ user: req.user.id }).sort({ date: -1 })

    if (!latestData) {
      return res.status(404).json({ message: "No carbon data found" })
    }

    // Get previous data for comparison
    const previousData = await CarbonData.findOne({
      user: req.user.id,
      date: { $lt: latestData.date },
    }).sort({ date: -1 })

    // Calculate change percentage if previous data exists
    let changePercentage = 0
    if (previousData) {
      changePercentage = ((latestData.carbonEmission - previousData.carbonEmission) / previousData.carbonEmission) * 100
    }

    // Format the data with the field names the Flask API expects
    const formattedData = {
      "Body Type": latestData.bodyType,
      Sex: latestData.sex,
      Diet: latestData.diet,
      "How Often Shower": latestData.howOftenShower,
      "Heating Energy Source": latestData.heatingEnergySource,
      Transport: latestData.transport,
      "Vehicle Type": latestData.vehicleType,
      "Social Activity": latestData.socialActivity,
      "Monthly Grocery Bill": latestData.monthlyGroceryBill,
      "Frequency of Traveling by Air": latestData.frequencyOfTravelingByAir,
      "Vehicle Monthly Distance Km": latestData.vehicleMonthlyDistanceKm,
      "Waste Bag Size": latestData.wasteBagSize,
      "Waste Bag Weekly Count": latestData.wasteBagWeeklyCount,
      "How Long TV PC Daily Hour": latestData.howLongTvPcDailyHour,
      "How Many New Clothes Monthly": latestData.howManyNewClothesMonthly,
      "How Long Internet Daily Hour": latestData.howLongInternetDailyHour,
      "Energy efficiency": latestData.energyEfficiency,
      Recycling: latestData.recycling,
      Cooking_With: latestData.cookingWith,
    }

    // Get insights from Flask API or generate simple insights
    let insights
    try {
      // Use the properly formatted data for the Flask API
      const flaskResponse = await axios.post(
        `${process.env.FLASK_API_URL || "http://localhost:5000"}/insights`,
        formattedData,
      )
      insights = flaskResponse.data
    } catch (flaskError) {
      console.error("Flask API insights error:", flaskError)
      // insights = generateSimpleInsights(formattedData, latestData.carbonEmission)
    }

    res.json({
      latestData,
      previousData: previousData || null,
      changePercentage,
      insights,
    })
  } catch (error) {
    console.error("Get latest carbon data error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Helper functions for simple carbon emission calculation and insights
function calculateSimpleCarbonEmission(data) {
  // Simple calculation based on form data
  let emission = 10 // Base value

  // Add based on transport
  if (data.transport === "Car") emission += 5
  if (data.transport === "Public Transport") emission += 2

  // Add based on diet
  if (data.diet === "Heavy Meat Eater") emission += 4
  if (data.diet === "Omnivore") emission += 2
  if (data.diet === "Vegetarian") emission -= 1
  if (data.diet === "Vegan") emission -= 2

  // Add based on heating
  if (data.heatingEnergySource === "Coal") emission += 3
  if (data.heatingEnergySource === "Natural Gas") emission += 2
  if (data.heatingEnergySource === "Electricity") emission += 1

  // Add random variation
  emission += Math.random() * 2

  return Number.parseFloat(emission.toFixed(2))
}

function generateSimpleInsights(data, emission) {
  const insights = {
    breakdown: [
      {
        name: "Transport",
        value:
          data.transport === "Car"
            ? 5.2
            : data.transport === "Public Transport"
              ? 3.1
              : data.transport === "Motorcycle"
                ? 4.0
                : 2.0,
        average: 4.8,
      },
      {
        name: "Home Energy",
        value:
          data.heatingEnergySource === "Coal"
            ? 4.8
            : data.heatingEnergySource === "Natural Gas"
              ? 3.8
              : data.heatingEnergySource === "Electricity"
                ? 3.2
                : 3.5,
        average: 4.2,
      },
      {
        name: "Food",
        value:
          data.diet === "Vegan"
            ? 1.2
            : data.diet === "Vegetarian"
              ? 1.5
              : data.diet === "Omnivore"
                ? 2.1
                : data.diet === "Heavy Meat Eater"
                  ? 3.5
                  : 2.1,
        average: 2.8,
      },
      {
        name: "Consumption",
        value: data.howManyNewClothesMonthly > 5 ? 2.2 : data.howManyNewClothesMonthly > 2 ? 1.6 : 1.4,
        average: 1.9,
      },
      {
        name: "Waste",
        value: data.wasteBagWeeklyCount > 3 ? 1.2 : data.wasteBagWeeklyCount > 1 ? 0.8 : 0.6,
        average: 1.0,
      },
    ],
    recommendations: [
      {
        category: "Transport",
        title: "Reduce car usage",
        description: "Try using public transportation, biking, or walking for short trips.",
        impact: "high",
      },
      {
        category: "Home Energy",
        title: "Switch to LED lighting",
        description: "Replace all incandescent bulbs with energy-efficient LED alternatives.",
        impact: "medium",
      },
      {
        category: "Food",
        title: "Reduce meat consumption",
        description: "Try incorporating more plant-based meals into your diet each week.",
        impact: "high",
      },
      {
        category: "Consumption",
        title: "Buy fewer new clothes",
        description: "Consider second-hand shopping or extending the life of your current wardrobe.",
        impact: "medium",
      },
      {
        category: "Waste",
        title: "Improve recycling habits",
        description: "Ensure you're properly sorting recyclables and composting organic waste.",
        impact: "low",
      },
    ],
  }

  return insights
}

// Start server
const PORT = process.env.PORT || 5001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
