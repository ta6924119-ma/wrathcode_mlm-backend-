import cron from "node-cron";
import { User } from "./models/User.js";
import { shouldStopROI } from "./Utils/ROI.js";

export const startROICron = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("ROI Cron Running...");

    const users = await User.find({ roiEndDate: { $gte: new Date() } });

    for (let user of users) {
      const { shouldStop } = await shouldStopROI(user);
      if (shouldStop) continue;
      if (user.roiGiven >= user.maxEarning) continue;

      let roi = user.dailyROI;
      if (user.roiGiven + roi > user.maxEarning) {
        roi = user.maxEarning - user.roiGiven;
      }

      if (user.capitalLocked && new Date() < user.capitalLockUntil) {
        user.lockedWallet = (user.lockedWallet || 0) + roi;
      } else {
        user.wallet = (user.wallet || 0) + roi;
        if (user.capitalLocked) {
          user.capitalLocked = false;
          user.wallet = (user.wallet || 0) + (user.lockedWallet || 0);
          user.lockedWallet = 0;
        }
      }
      
      user.totalEarned = (user.totalEarned || 0) + roi;
      user.roiGiven = (user.roiGiven || 0) + roi;
      await user.save();
    }

    console.log("ROI Distributed");
  });
};