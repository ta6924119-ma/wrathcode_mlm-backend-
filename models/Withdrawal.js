import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  // Amount details
  amount: { type: Number, required: true },           // Requested amount
  taxAmount: { type: Number, required: true },        // 10% TDS
  finalAmount: { type: Number, required: true },      // Amount after tax
  
  // Payment method
  method: { type: String, enum: ["bank", "upi", "crypto"], required: true },
  
  // User's payment details
  paymentDetails: {
    bank: {
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String,
      bankName: String,
    },
    upiId: String,
    cryptoAddress: String,
  },
  
  // Razorpay fund account ID (created once, reused)
  fundAccountId: { type: String },
  
  // Status tracking
  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected", "failed"], 
    default: "pending" 
  },

  
  transactionId: { type: String },      // Razorpay payout ID
  referenceId: { type: String },        // Our reference
  
  // Admin tracking
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  processedAt: Date,
  adminRemark: { type: String, default: "" },
  
  // Payout response
  payoutResponse: { type: Object }

}, { timestamps: true });

export const Withdrawal = mongoose.model("Withdrawal", withdrawalSchema);