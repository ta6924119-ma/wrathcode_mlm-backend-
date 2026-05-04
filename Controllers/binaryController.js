import { User } from "../models/User.js";
import { Admin } from "../models/Admin.js";
import { startROI } from "../Utils/ROI.js";
import {distributeLevelIncome} from "../Utils/Level.js";
import {checkRank } from "../Utils/RANK.js";
import { distributeBinaryIncome } from "../Utils/Binaryincom.js";

export const joinBinary = async (req, res) => {
  try {
    const { referral, position } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    
    // PLAN CHECK
    const hasPlan = user.plans.some(p => p.name === "Binary");
    if (!hasPlan) {
      return res.status(400).json({ message: "Buy Binary plan first" });
    }

    if (user.parent) {
      return res.status(400).json({ message: "Already joined Binary tree" });
    }

    let parent = await User.findOne({ referral }) || await Admin.findOne({ referral });
    if (!parent) return res.status(400).json({ message: "Invalid referral code" });

    
    let finalParent = parent;
    let finalPosition = position;

    if (finalParent.left && finalParent.right) {
      
      const queue = [finalParent];
      let found = false;
      
      while (queue.length && !found) {
        const current = queue.shift();
        
        if (current.left) queue.push(await User.findById(current.left));
        if (current.right) queue.push(await User.findById(current.right));
        
        if (!current.left || !current.right) {
          finalParent = current;
          finalPosition = !current.left ? "left" : "right";
          found = true;
          break;
        }
      }
      
      if (!found) {
        return res.status(400).json({ message: "Binary tree full" });
      }
    }

    // JOIN
    user.parent = finalParent._id;
    user.position = finalPosition;
    await user.save();

    if (finalPosition === "left") finalParent.left = user._id;
    else finalParent.right = user._id;

    await finalParent.save();

    
    await distributeBinaryIncome(user._id);

    return res.status(200).json({
      success: true,
      message: `Joined Binary successfully at ${finalParent.name}'s ${finalPosition}`
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





//  ==============================Get Binary Tree====================================



export const getBinaryTree = async (req, res) => {
  try {
    const userId = req.user._id;

    // Aaj ki date ka start (12:00 AM) nikalne ke liye
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const getLevelData = async (memberId, currentLevel) => {
      if (currentLevel > 6) return null;

      const member = await User.findById(memberId)
        .select("name isActive side createdAt")
        .lean();

      if (!member) return null;

      const children = await User.find({ sponsor: memberId }).select("_id side");

      let leftNode = null;
      let rightNode = null;

      for (const child of children) {
        if (child.side === "left") {
          leftNode = await getLevelData(child._id, currentLevel + 1);
        } else if (child.side === "right") {
          rightNode = await getLevelData(child._id, currentLevel + 1);
        }
      }

      // --- CALCULATIONS ---
      
      // 1. Total Members Count
      const leftCount = leftNode ? (leftNode.stats.leftCount + leftNode.stats.rightCount + 1) : 0;
      const rightCount = rightNode ? (rightNode.stats.leftCount + rightNode.stats.rightCount + 1) : 0;

      // 2. New Joins Calculation (Jo aaj join huye hain)
      const isNewJoin = (memberDate) => new Date(memberDate) >= startOfToday;

      const leftNewJoins = leftNode ? 
        (leftNode.stats.leftNewJoins + leftNode.stats.rightNewJoins + (isNewJoin(leftNode.createdAt) ? 1 : 0)) : 0;
      
      const rightNewJoins = rightNode ? 
        (rightNode.stats.leftNewJoins + rightNode.stats.rightNewJoins + (isNewJoin(rightNode.createdAt) ? 1 : 0)) : 0;

      // 3. Amount Calculation
      const leftAmount = leftNode ? (leftNode.stats.leftAmount + leftNode.stats.rightAmount + (leftNode.isActive ? 1000 : 0)) : 0;
      const rightAmount = rightNode ? (rightNode.stats.leftAmount + rightNode.stats.rightAmount + (rightNode.isActive ? 1000 : 0)) : 0;

      return {
        _id: member._id,
        name: member.name,
        level: currentLevel,
        createdAt: member.createdAt,
        stats: {
          leftCount,
          rightCount,
          leftAmount,
          rightAmount,
          leftNewJoins, // Aaj ke new members (Left)
          rightNewJoins, // Aaj ke new members (Right)
          totalNewJoins: leftNewJoins + rightNewJoins,
          totalMembers: leftCount + rightCount,
          totalAmount: leftAmount + rightAmount
        },
        children: {
          left: leftNode,
          right: rightNode
        }
      };
    };

    const tree = await getLevelData(userId, 0);

    res.status(200).json({
      success: true,
      data: tree
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



//===============================List all viwers====================================




export const getListView = async (req, res) => {
  try {
    const userId = req.user._id;
    const { levelFilter } = req.query;

    const fetchDownline = async (parentIds, currentLevel, allMembers = []) => {
      if (currentLevel > 10) return allMembers;

      const members = await User.find({ sponsor: { $in: parentIds } })
        .populate("sponsor", "name")
        .select("name email isActive createdAt leftBV rightBV side")
        .lean();

      if (members.length === 0) return allMembers;

      
      const membersWithReferrals = await Promise.all(
        members.map(async (m) => {
          const referralCount = await User.countDocuments({ sponsor: m._id });
          return {
            ...m,
            level: currentLevel,
            volume: (m.leftBV || 0) + (m.rightBV || 0) || 0,
            sponsorName: m.sponsor ? m.sponsor.name : "You",
            referralCount // Naya Field
          };
        })
      );

      allMembers.push(...membersWithReferrals);

      const nextParentIds = members.map(m => m._id);
      return fetchDownline(nextParentIds, currentLevel + 1, allMembers);
    };

    let fullList = await fetchDownline([userId], 1);

    
    const totalMembers = fullList.length;
    const activeMembers = fullList.filter(m => m.isActive).length;
    const totalVolume = fullList.reduce((sum, m) => sum + m.volume, 0);

    
    if (levelFilter && levelFilter !== "All") {
      const lvl = parseInt(levelFilter);
      fullList = fullList.filter(m => m.level === lvl);
    }

    res.status(200).json({
      success: true,
      stats: {
        totalMembers,
        activeMembers,
        totalVolume: `$${totalVolume.toLocaleString()}`
      },
      members: fullList.map(m => ({
        name: m.name,
        email: m.email,
        level: `Level ${m.level}`,
        volume: `$${m.volume}`,
        referrals: m.referralCount, 
        joinDate: new Date(m.createdAt).toLocaleDateString("en-GB"), 
        sponsor: m.sponsorName,
        status: m.isActive ? "Active" : "Inactive"
      }))
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};