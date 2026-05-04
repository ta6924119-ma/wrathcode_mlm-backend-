import { User } from "../models/User.js";
import { Admin } from "../models/Admin.js";
import { startROI } from "../Utils/ROI.js";
import {distributeLevelIncome} from "../Utils/Level.js";
import {checkRank } from "../Utils/RANK.js";

import { distributeMatrixIncome } from "../Utils/matrxincom.js";

export const joinMatrix = async (req, res) => {
  try {
    const { referral } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);

    //  PLAN CHECK
    const hasPlan = user.plans.some(p => p.name === "Matrix");
    if (!hasPlan) {
      return res.status(400).json({ message: "Buy Matrix plan first" });
    }

    if (user.parentMatrix) {
      return res.status(400).json({ message: "Already joined Matrix" });
    }

    let parent = await User.findOne({ referral }) || await Admin.findOne({ referral });
    if (!parent) return res.status(400).json({ message: "Invalid referral" });

    const queue = [parent];
    let foundParent = null;

    while (queue.length) {
      const current = queue.shift();

      if (!current.leftMatrix || !current.middleMatrix || !current.rightMatrix) {
        foundParent = current;
        break;
      }

      if (current.leftMatrix) queue.push(await User.findById(current.leftMatrix));
      if (current.middleMatrix) queue.push(await User.findById(current.middleMatrix));
      if (current.rightMatrix) queue.push(await User.findById(current.rightMatrix));
    }

    if (!foundParent) return res.status(400).json({ message: "Matrix full" });

    let position;
    if (!foundParent.leftMatrix) position = "left";
    else if (!foundParent.middleMatrix) position = "middle";
    else position = "right";

    user.parentMatrix = foundParent._id;
    user.positionMatrix = position;
    await user.save();

    if (position === "left") foundParent.leftMatrix = user._id;
    else if (position === "middle") foundParent.middleMatrix = user._id;
    else foundParent.rightMatrix = user._id;

    await foundParent.save();

    // FIXED AMOUNT
    const plan = user.plans.find(p => p.name === "Matrix");
    await distributeMatrixIncome(user, plan.amount);

    res.json({ success: true, message: "Joined Matrix successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



//  ==============================Get Matrix Tree====================================



export const getMatrixTree = async (req, res) => {
  try {
    const userId = req.user._id;

    // Aaj ki date ka start (12:00 AM)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const getLevelData = async (memberId, currentLevel) => {
      if (currentLevel > 6) return null;

      const member = await User.findById(memberId)
        .select("name isActive side createdAt")
        .lean();

      if (!member) return null;

      // Niche ke teeno sides ke members dhoondo
      const children = await User.find({ sponsor: memberId }).select("_id side");

      let leftNode = null;
      let midNode = null;
      let rightNode = null;

      for (const child of children) {
        if (child.side === "left") {
          leftNode = await getLevelData(child._id, currentLevel + 1);
        } else if (child.side === "mid") {
          midNode = await getLevelData(child._id, currentLevel + 1);
        } else if (child.side === "right") {
          rightNode = await getLevelData(child._id, currentLevel + 1);
        }
      }

      // --- CALCULATIONS (Bottom-Up) ---
      const isNewJoin = (date) => new Date(date) >= startOfToday;

      // Helper function totals calculate karne ke liye
      const getTotals = (node) => {
        if (!node) return { count: 0, amount: 0, new: 0 };
        // Node khud + uske niche ke saare stats
        const nodeSelfNew = isNewJoin(node.createdAt) ? 1 : 0;
        return {
          count: node.stats.totalMembers + 1,
          amount: node.stats.totalAmount + (node.isActive ? 1000 : 0),
          new: node.stats.totalNewJoins + nodeSelfNew
        };
      };

      const leftStats = getTotals(leftNode);
      const midStats = getTotals(midNode);
      const rightStats = getTotals(rightNode);

      return {
        _id: member._id,
        name: member.name,
        level: currentLevel,
        side: member.side,
        stats: {
          leftCount: leftStats.count,
          midCount: midStats.count,
          rightCount: rightStats.count,
          
          leftAmount: leftStats.amount,
          midAmount: midStats.amount,
          rightAmount: rightStats.amount,

          leftNewJoins: leftStats.new,
          midNewJoins: midStats.new,
          rightNewJoins: rightStats.new,

          totalMembers: leftStats.count + midStats.count + rightStats.count,
          totalAmount: leftStats.amount + midStats.amount + rightStats.amount,
          totalNewJoins: leftStats.new + midStats.new + rightStats.new
        },
        children: {
          left: leftNode,
          mid: midNode,
          right: rightNode
        }
      };
    };

    const tree = await getLevelData(userId, 0);

    res.status(200).json({
      success: true,
      type: "3-Leg Matrix",
      data: tree
    });

  } catch (error) {
    res.status(500).json({ message: "Matrix Tree Error: " + error.message });
  }
};