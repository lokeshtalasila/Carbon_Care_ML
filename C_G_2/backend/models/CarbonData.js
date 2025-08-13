const mongoose = require("mongoose");

const CarbonDataSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  bodyType: {
    type: String,
    enum: ["overweight", "obese", "underweight", "normal"],
    required: true,
  },
  sex: {
    type: String,
    enum: ["female", "male"],
    required: true,
  },
  diet: {
    type: String,
    enum: ["pescatarian", "vegetarian", "omnivore", "vegan"],
    required: true,
  },
  howOftenShower: {
    type: String,
    enum: ["daily", "less frequently", "more frequently", "twice a day"],
    required: true,
  },
  heatingEnergySource: {
    type: String,
    enum: ["coal", "natural gas", "wood", "electricity"],
    required: true,
  },
  transport: {
    type: String,
    enum: ["public", "walk/bicycle", "private"],
    required: true,
  },
  vehicleType: {
    type: String,
    enum: ["lpg", "petrol", "diesel", "hybrid", "electric"],
    required: true,
  },
  socialActivity: {
    type: String,
    enum: ["often", "never", "sometimes"],
    required: true,
  },
  monthlyGroceryBill: {
    type: Number,
    required: true,
  },
  frequencyOfTravelingByAir: {
    type: String,
    enum: ["frequently", "rarely", "never", "very frequently"],
    required: true,
  },
  vehicleMonthlyDistanceKm: {
    type: Number,
    required: true,
  },
  wasteBagSize: {
    type: String,
    enum: ["large", "extra large", "small", "medium"],
    required: true,
  },
  wasteBagWeeklyCount: {
    type: Number,
    required: true,
  },
  howLongTvPcDailyHour: {
    type: Number,
    required: true,
  },
  howManyNewClothesMonthly: {
    type: Number,
    required: true,
  },
  howLongInternetDailyHour: {
    type: Number,
    required: true,
  },
  energyEfficiency: {
    type: String,
    enum: ["No", "Sometimes", "Yes"],
    required: true,
  },
  recycling: {
  type: [String],
  required: true,
  validate: {
    validator: function(arr) {
      const allowed = ["Paper", "Plastic", "Glass", "Metal"];
      return arr.every(val => allowed.includes(val));
    },
    message: props => `${props.value} contains invalid recycling type`
  }
},
cookingWith: {
  type: [String],
  required: true,
  validate: {
    validator: function(arr) {
      const allowed = ["Stove", "Oven", "Microwave", "Grill", "Airfryer"];
      return arr.every(val => allowed.includes(val));
    },
    message: props => `${props.value} contains invalid cooking method`
  }
},

  carbonEmission: {
    type: Number,
    default: 0,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("CarbonData", CarbonDataSchema);
