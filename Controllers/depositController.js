import { Deposit } from "../models/deposit.js";
import Razorpay from "razorpay";
import { Wallet } from "../models/wallet.js";
import { addTransaction } from "../Utils/wallet.js";
import crypto from "crypto";
import { User } from "../models/User.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET
});

// =================  DEPOSIT=================
export const createDeposit = async (req, res) => {
  try {
    const { amount, method, upiId, bankDetails } = req.body;
    const userId = req.user._id;

    // ========== 1. VALIDATION ==========
    if (!amount || amount < 10) {
      return res.status(400).json({ 
        success: false, 
        message: "Minimum deposit amount is ₹10" 
      });
    }

    if (!method) {
      return res.status(400).json({ 
        success: false, 
        message: "Select payment method: upi, bank, or razorpay" 
      });
    }

    // ========== 2. METHOD 1: UPI (Auto - Real Payment) ==========
    if (method === "upi") {
      if (!upiId || !upiId.includes("@")) {
        return res.status(400).json({ 
          success: false, 
          message: "Valid UPI ID required (e.g., user@okhdfcbank)" 
        });
      }

      const paymentId = `UPI_${Date.now()}_${userId}`;

      // Store deposit request
      const deposit = await Deposit.create({
        user: userId,
        orderId: paymentId,
        amount: amount,
        method: "upi",
        upiId: upiId,
        status: "pending"
      });

      // Generate UPI payment link
      const upiLink = `paytmmp://pay?pa=${upiId}&pn=MLM%20Network&am=${amount}&cu=INR&tn=Wallet%20Deposit&payid=${paymentId}`;

      return res.status(200).json({
        success: true,
        method: "upi",
        message: "UPI payment initiated",
        paymentId: paymentId,
        upiId: upiId,
        amount: amount,
        upiLink: upiLink,
        instructions: "Open this link in any UPI app to complete payment"
      });
    }

    // ========== 3. METHOD 2: BANK TRANSFER (Admin Approval Required) ==========
    if (method === "bank") {
      if (!bankDetails || !bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.ifsc || !bankDetails.accountHolder) {
        return res.status(400).json({ 
          success: false, 
          message: "All bank details required: bankName, accountNumber, ifsc, accountHolder" 
        });
      }

      const referenceId = `BANK_${Date.now()}_${userId}`;

      // Company bank details for user to transfer
      const companyBank = {
        accountName: process.env.BANK_ACCOUNT_NAME || "MLM Network India Pvt Ltd",
        accountNumber: process.env.BANK_ACCOUNT_NUMBER || "1234567890123456",
        bankName: process.env.BANK_NAME || "State Bank of India",
        ifsc: process.env.BANK_IFSC || "SBIN0001234"
      };

      // Store deposit request
      await Deposit.create({
        user: userId,
        orderId: referenceId,
        amount: amount,
        method: "bank",
        bankDetails: bankDetails,
        status: "pending"
      });

      return res.status(200).json({
        success: true,
        method: "bank",
        message: "Bank transfer request submitted",
        referenceId: referenceId,
        amount: amount,
        yourBankDetails: bankDetails,
        transferTo: companyBank,
        instructions: [
          `1. Transfer ₹${amount} to the company bank account above`,
          `2. Use Reference ID: ${referenceId}`,
          `3. Admin will verify and update wallet within 24 hours`
        ]
      });
    }

    // ========== 4. METHOD 3: RAZORPAY (Auto - Real Payment) ==========
    if (method === "razorpay") {
      const options = {
        amount: Number(amount) * 100,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        notes: {
          userId: userId.toString(),
          method: "razorpay"
        }
      };

      const order = await razorpay.orders.create(options);

      await Deposit.create({
        user: userId,
        orderId: order.id,
        amount: amount,
        method: "razorpay",
        status: "pending"
      });

      return res.status(200).json({
        success: true,
        method: "razorpay",
        message: "Razorpay order created",
        orderId: order.id,
        amount: amount,
        keyId: process.env.RAZORPAY_KEY_ID,
        currency: "INR"
      });
    }

    return res.status(400).json({ 
      success: false, 
      message: "Invalid method. Use: upi, bank, or razorpay" 
    });

  } catch (error) {
    console.error("Deposit Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= VERIFY RAZORPAY PAYMENT =================
export const verifyDeposit = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
    const userId = req.user._id;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    // Update deposit
    const deposit = await Deposit.findOneAndUpdate(
      { orderId: razorpay_order_id },
      { status: "approved", razorpayPaymentId: razorpay_payment_id },
      { new: true }
    );

    if (!deposit) {
      return res.status(404).json({ success: false, message: "Deposit not found" });
    }

    // Update wallet
    const user = await User.findById(userId);
    user.wallet = (user.wallet || 0) + Number(amount);
    await user.save();

    await addTransaction({
      userId: user._id,
      type: "credit",
      walletType: "main",
      amount: Number(amount),
      description: `Razorpay Deposit: ${razorpay_payment_id}`,
      status: "paid"
    });

    res.status(200).json({ 
      success: true, 
      message: "Payment verified! Wallet updated.",
      walletBalance: user.wallet
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= VERIFY UPI PAYMENT (Webhook/Callback) =================
export const verifyUPIPayment = async (req, res) => {
  try {
    const { paymentId, transactionId, status } = req.body;

    const deposit = await Deposit.findOne({ orderId: paymentId });
    if (!deposit) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    if (status === "success" && deposit.status === "pending") {
      const user = await User.findById(deposit.user);
      if (user) {
        user.wallet = (user.wallet || 0) + deposit.amount;
        await user.save();

        await addTransaction({
          userId: user._id,
          type: "credit",
          walletType: "main",
          amount: deposit.amount,
          description: `UPI Deposit: ${transactionId}`,
          status: "paid"
        });

        deposit.status = "approved";
        deposit.razorpayPaymentId = transactionId;
        await deposit.save();

        return res.status(200).json({ success: true, message: "Wallet updated" });
      }
    }

    res.status(200).json({ success: true });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= ADMIN: VERIFY BANK TRANSFER =================
export const adminVerifyBankTransfer = async (req, res) => {
  try {
    const { depositId, status } = req.body;
    const adminId = req.admin._id;

    const deposit = await Deposit.findById(depositId);
    if (!deposit) {
      return res.status(404).json({ success: false, message: "Deposit not found" });
    }

    if (status === "approved") {
      const user = await User.findById(deposit.user);
      if (user) {
        user.wallet = (user.wallet || 0) + deposit.amount;
        await user.save();

        await addTransaction({
          userId: user._id,
          type: "credit",
          walletType: "main",
          amount: deposit.amount,
          description: `Bank Transfer Deposit: ${deposit.orderId}`,
          status: "paid"
        });
      }
    }

    deposit.status = status;
    deposit.approvedBy = adminId;
    deposit.approvedAt = new Date();
    await deposit.save();

    res.status(200).json({ 
      success: true, 
      message: `Bank transfer ${status}`,
      deposit
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= GET DEPOSIT HISTORY =================
export const getDepositHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const deposits = await Deposit.find({ user: userId })
      .sort({ createdAt: -1 })
      .select("amount method status createdAt razorpayPaymentId orderId");

    res.status(200).json({
      success: true,
      deposits: deposits.map(d => ({
        amount: d.amount,
        method: d.method,
        status: d.status,
        date: d.createdAt,
        transactionId: d.razorpayPaymentId || d.orderId
      }))
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};