
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

    const plan = user.plans.find(p => p.name === "Unilevel");
    await distributeUnilevelIncome(user, plan.amount);

    res.json({ success: true, message: "Joined Unilevel successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ============================== GET UNILEVEL TREE =============================


export const getUnilevelTree = async (req, res) => {
  try {
    const userId = req.user._id;

    const getLevelData = async (memberId, currentLevel) => {
      if (currentLevel > 10) return null;

      const member = await User.findById(memberId)
        .select("name isActive createdAt childrenUni plans")
        .populate("childrenUni", "name isActive createdAt")
        .lean();

      if (!member) return null;

      // Calculate user's total investment
      const userInvestment = member.plans?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      const children = [];
      let totalInvestment = userInvestment;

      for (const child of (member.childrenUni || [])) {
        const childData = await getLevelData(child._id, currentLevel + 1);
        if (childData) {
          children.push(childData);
          totalInvestment += childData.stats.totalAmount;
        }
      }

      return {
        _id: member._id,
        name: member.name,
        level: currentLevel,
        createdAt: member.createdAt,
        stats: {
          directCount: member.childrenUni?.length || 0,
          totalMembers: children.length + 1,
          totalAmount: totalInvestment
        },
        children: children
      };
    };

    const tree = await getLevelData(userId, 0);

    res.status(200).json({
      success: true,
      type: "Unilevel",
      data: tree
    });

  } catch (error) {
    console.error("Get Unilevel Tree Error:", error);
    res.status(500).json({ message: error.message });
  }
};