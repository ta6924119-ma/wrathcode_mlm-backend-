import { RANK_PLANS } from "../Utils/RANK_PLANS.js";
import { RankPlan } from "../models/Rankplan.js";

export const getRankLimits = async (rank) => {
  
  const defaultLimits = RANK_PLANS[rank];
  if (!defaultLimits) return null;
  
  
  const override = await RankPlan.findOne({ rank });
  
  if (override) {
    return {
      min: override.min ?? defaultLimits.min,
      max: override.max ?? defaultLimits.max,
      roi: override.roi ?? defaultLimits.roi,
      duration: override.duration ?? defaultLimits.duration,
      dailyPercent: override.dailyPercent ?? defaultLimits.dailyPercent
    };
  }
  
  return defaultLimits;
};