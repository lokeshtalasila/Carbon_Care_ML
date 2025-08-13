const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  preferences: {
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "light",
    },
    units: {
      type: String,
      enum: ["metric", "imperial"],
      default: "metric",
    },
  },
  notifications: {
    email: {
      type: Boolean,
      default: true,
    },
    monthlyReport: {
      type: Boolean,
      default: true,
    },
    tips: {
      type: Boolean,
      default: true,
    },
  },
  date: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("User", UserSchema)
