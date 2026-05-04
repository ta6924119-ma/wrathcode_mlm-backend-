import { KYC } from "../models/KYC.js";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";


// =================  UPDATE KYC STATUS (APPROVE/REJECT) =================
export const updateKYCStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remark } = req.body;

    // Validation
    if (!status || !["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Status must be 'Approved' or 'Rejected'" 
      });
    }

    // Rejected ke liye remark mandatory
    if (status === "Rejected" && (!remark || remark.trim() === "")) {
      return res.status(400).json({ 
        success: false, 
        message: "Remark is required for rejection" 
      });
    }

    const kyc = await KYC.findById(id);
    if (!kyc) {
      return res.status(404).json({ success: false, message: "KYC not found" });
    }

    // Update KYC
    kyc.kycStatus = status;
    kyc.adminRemark = remark || "";
    kyc.verifiedAt = new Date();
    await kyc.save();

    // If approved, activate user
    if (status === "Approved") {
      await User.findByIdAndUpdate(kyc.userId, { isActive: true });
    }

    res.status(200).json({
      success: true,
      message: status === "Approved" ? "KYC Approved successfully" : "KYC Rejected",
      data: {
        kycStatus: kyc.kycStatus,
        adminRemark: kyc.adminRemark,
        verifiedAt: kyc.verifiedAt
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};




// =================  BLOCK/UNBLOCK USER =================
export const blockUnblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action } = req.body; 

    if (!action || !["block", "unblock"].includes(action)) {
      return res.status(400).json({ 
        success: false, 
        message: "Action must be 'block' or 'unblock'" 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (action === "block") {
      user.isBlocked = true;
      user.blockedAt = new Date();
      user.blockedBy = req.admin._id;
    } else {
      user.isBlocked = false;
      user.unblockedAt = new Date();
      user.unblockedBy = req.admin._id;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${action}ed successfully`,
      data: {
        userId: user._id,
        name: user.name,
        isBlocked: user.isBlocked
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= DELETE USER =================
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const userName = user.name;
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: `User "${userName}" deleted successfully`
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =================  EDIT REFERRAL  =================
export const editReferral = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, bonusAmount } = req.body;

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Get all referrals of this user
    const referrals = user.referredUsers || [];
    if (referrals.length === 0) {
      return res.status(404).json({ success: false, message: "No referrals found for this user" });
    }

    // Update all referrals? Or first one? 
    // Aapke requirement ke hisaab se - user ke saare referrals update honge
    let updatedCount = 0;
    let totalBonusDiff = 0;

    for (const referral of referrals) {
      let oldStatus = referral.hasInvested;
      let oldBonus = (referral.amountInvested * 5) / 100;

      // Update status
      if (status === "approved" && oldStatus === false) {
        referral.hasInvested = true;
        referral.investedAt = new Date();
        updatedCount++;
        
        // Update referred user's active status
        await User.findByIdAndUpdate(referral.user, { isActive: true });
      } else if (status === "pending" && oldStatus === true) {
        referral.hasInvested = false;
        updatedCount++;
      } else if (status === "rejected" && oldStatus === true) {
        referral.hasInvested = false;
        updatedCount++;
      }

      // Update bonus amount
      if (bonusAmount !== undefined && bonusAmount !== oldBonus) {
        const bonusDiff = bonusAmount - oldBonus;
        totalBonusDiff += bonusDiff;
      }
    }

    // Update total referral earnings
    if (totalBonusDiff !== 0) {
      user.totalReferralEarnings = (user.totalReferralEarnings || 0) + totalBonusDiff;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `Updated ${updatedCount} referral(s) for user ${user.name}`,
      data: {
        userId: user._id,
        userName: user.name,
        updatedCount: updatedCount,
        status: status,
        bonusAmount: bonusAmount,
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error("Edit Referral Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
