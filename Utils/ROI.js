import { ROIConfig } from "../models/ROI.js";

export const startROI = async (user, investment, planLimits) => {
  let config = await ROIConfig.findOne();
  
  if (!config) {

    const today = new Date();
    user.roiStartDate = today;
    const end = new Date();
    end.setDate(today.getDate() + planLimits.duration);
    user.roiEndDate = end;
    user.dailyROI = (investment * planLimits.dailyPercent) / 100;
    user.maxEarning = investment + (investment * planLimits.roi) / 100;
    await user.save();
    return;
  }

  const today = new Date();
  user.roiStartDate = today;
  
  const end = new Date();
  end.setDate(today.getDate() + config.validityPeriod);
  user.roiEndDate = end;
  
  const totalROI = (investment * config.roiPercentage) / 100;
  
  let frequencyMultiplier = 1;
  if (config.roiFrequency === "daily") frequencyMultiplier = 1;
  else if (config.roiFrequency === "weekly") frequencyMultiplier = 7;
  else if (config.roiFrequency === "monthly") frequencyMultiplier = 30;
  
  const frequencyCount = config.validityPeriod / frequencyMultiplier;
  user.dailyROI = totalROI / frequencyCount;
  user.maxEarning = investment + totalROI;
  
  if (config.capitalLock) {
    user.capitalLocked = true;
    user.capitalLockUntil = user.roiEndDate;
  }
  
  await user.save();
};

export const shouldStopROI = async (user) => {
  let config = await ROIConfig.findOne();
  if (!config) {
    if (user.roiGiven >= user.maxEarning) {
      return { shouldStop: true, reason: "Maximum limit reached" };
    }
    if (new Date() > new Date(user.roiEndDate)) {
      return { shouldStop: true, reason: "ROI period expired" };
    }
    return { shouldStop: false, reason: "" };
  }
  
  if (config.roiStopConditions.includes("period_expiry")) {
    if (new Date() > new Date(user.roiEndDate)) {
      return { shouldStop: true, reason: "ROI period expired" };
    }
  }
  
  if (config.roiStopConditions.includes("max_reached")) {
    if (user.roiGiven >= user.maxEarning) {
      return { shouldStop: true, reason: "Maximum ROI limit reached" };
    }
  }
  
  if (config.maxROIAmount > 0 && user.roiGiven >= config.maxROIAmount) {
    return { shouldStop: true, reason: "Maximum ROI amount reached" };
  }
  
  return { shouldStop: false, reason: "" };
};