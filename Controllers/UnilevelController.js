
import { User } from "../models/User.js";
import { Admin } from "../models/Admin.js";
import { startROI } from "../Utils/ROI.js";
import {distributeLevelIncome} from "../Utils/Level.js";
import {checkRank } from "../Utils/RANK.js";
import { distributeUnilevelIncome } from "../Utils/unilevelincom.js";


export const joinUnilevel = async (req, res) => {
  try {
    const { referral } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);

    //  PLAN CHECK
    const hasPlan = user.plans.some(p => p.name === "Unilevel");
    if (!hasPlan) {
      return res.status(400).json({ message: "Buy Unilevel plan first" });
    }

    if (user.parentUnilevel) {
      return res.status(400).json({ message: "Already joined" });
    }

    let parent = await User.findOne({ referral }) || await Admin.findOne({ referral });
    if (!parent) return res.status(400).json({ message: "Invalid referral" });

    user.parentUnilevel = parent._id;
    parent.childrenUni.push(user._id);

    await user.save();
    await parent.save();

    //  FIXED PARAM
    const plan = user.plans.find(p => p.name === "Unilevel");
    await distributeUnilevelIncome(user, plan.amount);

    res.json({ success: true, message: "Joined Unilevel successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};