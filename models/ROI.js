import mongoose from "mongoose";

const ROIConfigSchema = new mongoose.Schema({

  // 1. ROI Percentage (return on investment percentage)
  roiPercentage: {
    type: Number,
    required: true,
    default: 5,
    min: 0,
    max: 100
  },

  // 2. ROI Frequency (how often ROI is calculated)
  roiFrequency: {
    type: String,
    required: true,
    enum: ["daily", "weekly", "monthly"],
    default: "daily"
  },

  // 3. Validity Period (days) - ROI calculation period
  validityPeriod: {
    type: Number,
    required: true,
    default: 30,
    min: 1
  },

  // 4. Capital Lock (lock capital during ROI period) - Toggle button
  capitalLock: {
    type: Boolean,
    default: false
  },

  // 5. ROI Stop Conditions
  roiStopConditions: {
    type: [String],
    default: ["period_expiry", "max_reached"],
    enum: ["period_expiry", "max_reached", "manual_stop", "withdrawal"]
  },

  
  maxROIAmount: {
    type: Number,
    default: 0,  // 0 means no limit
    description: "Maximum ROI amount (0 = unlimited)"
  },

  isActive: {
    type: Boolean,
    default: true
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  }

}, { timestamps: true });

export const ROIConfig = mongoose.model("ROIConfig", ROIConfigSchema);