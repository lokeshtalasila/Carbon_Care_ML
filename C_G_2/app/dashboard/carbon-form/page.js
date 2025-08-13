"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mic, MicOff, Send, Loader2, AlertTriangle, CheckCircle2, Info } from "lucide-react"
import { submitCarbonData, saveCarbonDataToDatabase } from "../../api/carbon"

// Azure OpenAI configuration
const AZURE_OPENAI_ENDPOINT = "https://aksha-m9uvmce1-eastus2.services.ai.azure.com/models"
const AZURE_API_KEY = "DjzwH47rDyvMU3grv4PSSDnk6fMRrNMKKesPgYtAg265vWkUgvIDJQQJ99BDACHYHv6XJ3w3AAAAACOGMgjf"

export default function CarbonForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [error, setError] = useState("")
  const [isAiProcessing, setIsAiProcessing] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [aiSuccess, setAiSuccess] = useState(false)
  const [formData, setFormData] = useState({
    bodyType: "",
    sex: "",
    diet: "",
    howOftenShower: "",
    heatingEnergySource: "",
    transport: "",
    vehicleType: "",
    socialActivity: "",
    monthlyGroceryBill: "",
    frequencyOfTravelingByAir: "",
    vehicleMonthlyDistanceKm: "",
    wasteBagSize: "",
    wasteBagWeeklyCount: "",
    howLongTvPcDailyHour: "",
    howManyNewClothesMonthly: "",
    howLongInternetDailyHour: "",
    energyEfficiency: "",
    recycling: [],
    cookingWith: [],
  })

  // Form options
  const options = {
    bodyType: ["overweight", "obese", "underweight", "normal"],
    sex: ["female", "male"],
    diet: ["pescatarian", "vegetarian", "omnivore", "vegan"],
    howOftenShower: ["daily", "less frequently", "more frequently", "twice a day"],
    heatingEnergySource: ["coal", "natural gas", "wood", "electricity"],
    transport: ["public", "walk/bicycle", "private"],
    vehicleType: ["lpg", "petrol", "diesel", "hybrid", "electric"],
    socialActivity: ["often", "never", "sometimes"],
    frequencyOfTravelingByAir: ["frequently", "rarely", "never", "very frequently"],
    wasteBagSize: ["large", "extra large", "small", "medium"],
    energyEfficiency: ["No", "Sometimes", "Yes"],
    recycling: ["Paper", "Plastic", "Glass", "Metal"],
    cookingWith: ["Stove", "Oven", "Microwave", "Grill", "Airfryer"],
  }

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target

    if (type === "checkbox") {
      if (checked) {
        setFormData({
          ...formData,
          [name]: [...(formData[name] || []), value],
        })
      } else {
        setFormData({
          ...formData,
          [name]: formData[name].filter((item) => item !== value),
        })
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      // Convert string numbers to actual numbers
      const processedData = {
        ...formData,
        monthlyGroceryBill: Number(formData.monthlyGroceryBill) || 0,
        vehicleMonthlyDistanceKm: Number(formData.vehicleMonthlyDistanceKm) || 0,
        wasteBagWeeklyCount: Number(formData.wasteBagWeeklyCount) || 0,
        howLongTvPcDailyHour: Number(formData.howLongTvPcDailyHour) || 0,
        howManyNewClothesMonthly: Number(formData.howManyNewClothesMonthly) || 0,
        howLongInternetDailyHour: Number(formData.howLongInternetDailyHour) || 0,
      }

      // Map form field names to the expected API field names
      const apiData = {
        "Body Type": processedData.bodyType,
        Sex: processedData.sex,
        Diet: processedData.diet,
        "How Often Shower": processedData.howOftenShower,
        "Heating Energy Source": processedData.heatingEnergySource,
        Transport: processedData.transport,
        "Vehicle Type": processedData.vehicleType,
        "Social Activity": processedData.socialActivity,
        "Monthly Grocery Bill": processedData.monthlyGroceryBill,
        "Frequency of Traveling by Air": processedData.frequencyOfTravelingByAir,
        "Vehicle Monthly Distance Km": processedData.vehicleMonthlyDistanceKm,
        "Waste Bag Size": processedData.wasteBagSize,
        "Waste Bag Weekly Count": processedData.wasteBagWeeklyCount,
        "How Long TV PC Daily Hour": processedData.howLongTvPcDailyHour,
        "How Many New Clothes Monthly": processedData.howManyNewClothesMonthly,
        "How Long Internet Daily Hour": processedData.howLongInternetDailyHour,
        "Energy efficiency": processedData.energyEfficiency,
        Recycling: processedData.recycling,
        Cooking_With: processedData.cookingWith,
      }

      // Submit data to API
      const response = await submitCarbonData(apiData)

      console.log("API Response:", response)

      // Check if we have a prediction in the response
      if (response && response.prediction !== undefined) {
        // Store the prediction in the database
        const carbonEmission = response.prediction

        // Create a database entry with the prediction using the updated function
        await saveCarbonDataToDatabase(apiData, carbonEmission)

        // Redirect to insights page
        router.push("/dashboard/insights")
      } else {
        throw new Error("No prediction received from the API")
      }
    } catch (err) {
      console.error("Error submitting form:", err)
      setError(err.message || "There was an error submitting your data. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Voice assistant functionality
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Your browser doesn't support speech recognition. Try using Chrome.")
      return
    }

    const recognition = new window.webkitSpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onstart = () => {
      setIsListening(true)
      setTranscript("Listening...")
      setAiError(null)
      setAiSuccess(false)
    }

    recognition.onresult = (event) => {
      let interimTranscript = ""
      let finalTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        } else {
          interimTranscript += event.results[i][0].transcript
        }
      }

      const currentTranscript = finalTranscript || interimTranscript
      setTranscript(currentTranscript)

      // Process voice commands when we have a final transcript
      if (finalTranscript) {
        processVoiceCommand(finalTranscript)
      }
    }

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error)
      setIsListening(false)
      setTranscript((prev) => `${prev}\nError: ${event.error}`)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
    window.recognition = recognition
  }

  const stopListening = () => {
    if (window.recognition) {
      window.recognition.stop()
      setIsListening(false)
    }
  }

  // Process voice command with Azure OpenAI
  const processWithAI = async (command) => {
    if (!command || command.trim() === "") return

    setIsAiProcessing(true)
    setAiError(null)
    setAiSuccess(false)

    try {
      // Prepare the prompt for the AI
      const prompt = `
        Extract form field values from this voice command for a carbon footprint calculator.
        Command: "${command}"
        
        Return a JSON object with any of these fields that were mentioned:
        - bodyType (options: overweight, obese, underweight, normal)
        - sex (options: female, male)
        - diet (options: pescatarian, vegetarian, omnivore, vegan)
        - howOftenShower (options: daily, less frequently, more frequently, twice a day)
        - heatingEnergySource (options: coal, natural gas, wood, electricity)
        - transport (options: public, walk/bicycle, private)
        - vehicleType (options: lpg, petrol, diesel, hybrid, electric)
        - socialActivity (options: often, never, sometimes)
        - frequencyOfTravelingByAir (options: frequently, rarely, never, very frequently)
        - wasteBagSize (options: large, extra large, small, medium)
        - energyEfficiency (options: No, Sometimes, Yes)
        - monthlyGroceryBill (number)
        - vehicleMonthlyDistanceKm (number)
        - wasteBagWeeklyCount (number)
        - howLongTvPcDailyHour (number)
        - howManyNewClothesMonthly (number)
        - howLongInternetDailyHour (number)
        
        Only include fields that were explicitly mentioned. Format as valid JSON.
      `

      // Call Azure OpenAI API
      const response = await fetch(`${AZURE_OPENAI_ENDPOINT}/gpt-4/chat/completions?api-version=2023-12-01-preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": AZURE_API_KEY,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that extracts form field values from voice commands.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 800,
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()
      const aiResponse = data.choices[0]?.message?.content

      if (!aiResponse) {
        throw new Error("No response content from AI")
      }

      // Extract JSON from the response
      const jsonMatch =
        aiResponse.match(/```json\n([\s\S]*?)\n```/) ||
        aiResponse.match(/```([\s\S]*?)```/) ||
        aiResponse.match(/\{[\s\S]*\}/)

      let extractedJson = jsonMatch ? jsonMatch[1] || jsonMatch[0] : aiResponse

      // Clean up the JSON string
      extractedJson = extractedJson.replace(/```json|```/g, "").trim()

      // Parse the JSON
      const extractedData = JSON.parse(extractedJson)
      console.log("AI extracted data:", extractedData)

      // Update form data with extracted values
      setFormData((prevData) => ({
        ...prevData,
        ...extractedData,
      }))

      // Provide feedback to the user
      setTranscript(
        (prev) =>
          `${prev}\n\nAI understood: ${Object.keys(extractedData)
            .map((key) => `${key}: ${extractedData[key]}`)
            .join(", ")}`,
      )

      setAiSuccess(true)
      return true
    } catch (error) {
      console.error("Error processing with AI:", error)
      setAiError("Failed to process with AI. Using basic voice processing instead.")
      return false
    } finally {
      setIsAiProcessing(false)
    }
  }

  // Basic voice processing as a fallback
  const basicVoiceProcessing = (command) => {
    const lowerCommand = command.toLowerCase()
    const updatedFields = {}

    // Process diet
    options.diet.forEach((diet) => {
      if (lowerCommand.includes(diet.toLowerCase()) || lowerCommand.includes(`diet is ${diet.toLowerCase()}`)) {
        updatedFields.diet = diet
      }
    })

    // Process transport
    options.transport.forEach((transport) => {
      if (
        lowerCommand.includes(transport.toLowerCase()) ||
        lowerCommand.includes(`travel by ${transport.toLowerCase()}`)
      ) {
        updatedFields.transport = transport
      }
    })

    // Process vehicle type
    options.vehicleType.forEach((vehicle) => {
      if (
        lowerCommand.includes(vehicle.toLowerCase()) ||
        lowerCommand.includes(`vehicle is ${vehicle.toLowerCase()}`)
      ) {
        updatedFields.vehicleType = vehicle
      }
    })

    // Process body type
    options.bodyType.forEach((body) => {
      if (lowerCommand.includes(body.toLowerCase()) || lowerCommand.includes(`body type is ${body.toLowerCase()}`)) {
        updatedFields.bodyType = body
      }
    })

    // Process heating energy source
    options.heatingEnergySource.forEach((source) => {
      if (lowerCommand.includes(source.toLowerCase()) || lowerCommand.includes(`heating is ${source.toLowerCase()}`)) {
        updatedFields.heatingEnergySource = source
      }
    })

    // Process shower frequency
    options.howOftenShower.forEach((frequency) => {
      if (
        lowerCommand.includes(frequency.toLowerCase()) ||
        lowerCommand.includes(`shower ${frequency.toLowerCase()}`)
      ) {
        updatedFields.howOftenShower = frequency
      }
    })

    // Process numbers
    const numberMatches = {
      "grocery bill": "monthlyGroceryBill",
      groceries: "monthlyGroceryBill",
      distance: "vehicleMonthlyDistanceKm",
      kilometers: "vehicleMonthlyDistanceKm",
      km: "vehicleMonthlyDistanceKm",
      "waste bags": "wasteBagWeeklyCount",
      bags: "wasteBagWeeklyCount",
      tv: "howLongTvPcDailyHour",
      computer: "howLongTvPcDailyHour",
      pc: "howLongTvPcDailyHour",
      clothes: "howManyNewClothesMonthly",
      internet: "howLongInternetDailyHour",
    }

    Object.entries(numberMatches).forEach(([keyword, field]) => {
      if (lowerCommand.includes(keyword)) {
        const numberMatch = lowerCommand.match(/\d+/)
        if (numberMatch) {
          updatedFields[field] = Number.parseInt(numberMatch[0], 10)
        }
      }
    })

    // Update form if we found any fields
    if (Object.keys(updatedFields).length > 0) {
      setFormData((prevData) => ({
        ...prevData,
        ...updatedFields,
      }))

      setTranscript(
        (prev) =>
          `${prev}\n\nUnderstood: ${Object.keys(updatedFields)
            .map((key) => `${key}: ${updatedFields[key]}`)
            .join(", ")}`,
      )

      return true
    }

    return false
  }

  // Main voice command processor
  const processVoiceCommand = async (command) => {
    // Check for submit command first
    if (command.toLowerCase().includes("submit") || command.toLowerCase().includes("save")) {
      document.getElementById("carbon-form").dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }))
      return
    }

    // Try to process with AI first
    try {
      const aiSuccess = await processWithAI(command)

      // If AI processing fails, fall back to basic processing
      if (!aiSuccess) {
        const basicSuccess = basicVoiceProcessing(command)

        // If both methods fail, show a message
        if (!basicSuccess) {
          setTranscript(
            (prev) => `${prev}\n\nI couldn't understand that command. Please try again or use the form directly.`,
          )
        }
      }
    } catch (error) {
      console.error("Voice processing error:", error)
      // Final fallback
      basicVoiceProcessing(command)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Carbon Footprint Data Form</h1>
        <p className="text-gray-600">
          Please fill out this form to calculate your carbon footprint. You can also use the voice assistant to fill out
          the form.
        </p>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}

      {/* Voice assistant */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Voice Assistant (AI-Powered)</h2>
          <div>
            {isListening ? (
              <button
                onClick={stopListening}
                className="bg-red-100 text-red-600 p-2 rounded-full hover:bg-red-200 transition-colors"
                aria-label="Stop listening"
              >
                <MicOff className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={startListening}
                className="bg-emerald-100 text-emerald-600 p-2 rounded-full hover:bg-emerald-200 transition-colors"
                aria-label="Start listening"
              >
                <Mic className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div
          className={`p-4 rounded-lg ${
            isListening
              ? "bg-emerald-50 border border-emerald-200"
              : aiSuccess
                ? "bg-blue-50 border border-blue-200"
                : "bg-gray-50 border border-gray-200"
          }`}
        >
          <div className="flex items-center mb-2">
            <p className="text-sm text-gray-600">
              {isListening ? "Listening... Speak now." : "Click the microphone to start speaking"}
            </p>
            {aiSuccess && !isListening && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                AI Processed
              </span>
            )}
          </div>

          <div className="bg-white bg-opacity-50 p-3 rounded-md mb-3 max-h-32 overflow-y-auto">
            <p className="font-medium whitespace-pre-line">
              {transcript || "Try saying: 'What is carbon footprint ? '"}
            </p>
          </div>

          {isAiProcessing && (
            <div className="mt-2 flex items-center text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600 mr-2"></div>
              Processing with AI...
            </div>
          )}

          {aiError && (
            <div className="mt-2 flex items-center text-sm text-amber-600">
              <AlertTriangle className="h-4 w-4 mr-1" />
              {aiError}
            </div>
          )}

          <div className="mt-3 text-xs text-gray-500">
            <div className="flex items-center mb-1">
              <Info className="h-3 w-3 mr-1 text-blue-500" />
              <p className="font-medium">Try saying things like:</p>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>"What are the primary sources of carbon emissions globally,"</li>
              <li>"How can individuals and communities effectively reduce their carbon footprint"</li>
      
          
            </ul>
          </div>
        </div>
      </div>

      {/* Carbon footprint form */}
      <form id="carbon-form" onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Body Type</label>
              <select
                name="bodyType"
                value={formData.bodyType}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Body Type</option>
                {options.bodyType.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
              <select
                name="sex"
                value={formData.sex}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Sex</option>
                {options.sex.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Diet</label>
              <select
                name="diet"
                value={formData.diet}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Diet</option>
                {options.diet.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">How Often Do You Shower?</label>
              <select
                name="howOftenShower"
                value={formData.howOftenShower}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Frequency</option>
                {options.howOftenShower.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Home Energy */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Home Energy</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Heating Energy Source</label>
              <select
                name="heatingEnergySource"
                value={formData.heatingEnergySource}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Energy Source</option>
                {options.heatingEnergySource.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Do You Care About Energy Efficiency?
              </label>
              <select
                name="energyEfficiency"
                value={formData.energyEfficiency}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Option</option>
                {options.energyEfficiency.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cooking With (Select at least one)</label>
              <div className="grid grid-cols-2 gap-2">
                {options.cookingWith.map((option) => (
                  <label key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      name="cookingWith"
                      value={option}
                      checked={formData.cookingWith?.includes(option) || false}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    {option}
                  </label>
                ))}
              </div>
              {formData.cookingWith.length === 0 && (
                <p className="text-xs text-red-500 mt-1">Please select at least one cooking method</p>
              )}
            </div>
          </div>

          {/* Transportation */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Transportation</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Transport Method</label>
              <select
                name="transport"
                value={formData.transport}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Transport Method</option>
                {options.transport.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
              <select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Vehicle Type</option>
                {options.vehicleType.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Distance Traveled by Vehicle (km)
              </label>
              <input
                type="number"
                name="vehicleMonthlyDistanceKm"
                value={formData.vehicleMonthlyDistanceKm}
                onChange={handleInputChange}
                placeholder="e.g., 500"
                className="w-full p-2 border border-gray-300 rounded-md"
                required
                min="0"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency of Air Travel</label>
              <select
                name="frequencyOfTravelingByAir"
                value={formData.frequencyOfTravelingByAir}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Frequency</option>
                {options.frequencyOfTravelingByAir.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lifestyle */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Lifestyle</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Social Activity Frequency</label>
              <select
                name="socialActivity"
                value={formData.socialActivity}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Frequency</option>
                {options.socialActivity.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Grocery Bill ($)</label>
              <input
                type="number"
                name="monthlyGroceryBill"
                value={formData.monthlyGroceryBill}
                onChange={handleInputChange}
                placeholder="e.g., 400"
                className="w-full p-2 border border-gray-300 rounded-md"
                required
                min="0"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Daily Hours on TV/PC</label>
              <input
                type="number"
                name="howLongTvPcDailyHour"
                value={formData.howLongTvPcDailyHour}
                onChange={handleInputChange}
                placeholder="e.g., 4"
                className="w-full p-2 border border-gray-300 rounded-md"
                required
                min="0"
                max="24"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Daily Hours on Internet</label>
              <input
                type="number"
                name="howLongInternetDailyHour"
                value={formData.howLongInternetDailyHour}
                onChange={handleInputChange}
                placeholder="e.g., 3"
                className="w-full p-2 border border-gray-300 rounded-md"
                required
                min="0"
                max="24"
              />
            </div>
          </div>

          {/* Consumption & Waste */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Consumption & Waste</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Clothes Purchased Monthly</label>
                  <input
                    type="number"
                    name="howManyNewClothesMonthly"
                    value={formData.howManyNewClothesMonthly}
                    onChange={handleInputChange}
                    placeholder="e.g., 2"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                    min="0"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Waste Bag Size</label>
                  <select
                    name="wasteBagSize"
                    value={formData.wasteBagSize}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select Size</option>
                    {options.wasteBagSize.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Waste Bags Per Week</label>
                  <input
                    type="number"
                    name="wasteBagWeeklyCount"
                    value={formData.wasteBagWeeklyCount}
                    onChange={handleInputChange}
                    placeholder="e.g., 2"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                    min="0"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    What Do You Recycle? (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {options.recycling.map((option) => (
                      <label key={option} className="flex items-center">
                        <input
                          type="checkbox"
                          name="recycling"
                          value={option}
                          checked={formData.recycling?.includes(option) || false}
                          onChange={handleInputChange}
                          className="mr-2"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  {formData.recycling.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">Please select at least one option (or 'None')</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || formData.cookingWith.length === 0 || formData.recycling.length === 0}
            className="bg-emerald-600 text-white py-2 px-6 rounded-md hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Calculating...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Calculate Carbon Footprint
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
