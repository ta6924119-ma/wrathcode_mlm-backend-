import mongoose from "mongoose";

const WalletSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },

  

  incomeWallet: {
    balance: { type: Number, default: 0 },
    pending: { type: Number, default: 0 }
  },

  roiWallet: {
    balance: { type: Number, default: 0 },
    pending: { type: Number, default: 0 }
  },

  fundWallet: {
    balance: { type: Number, default: 0 },
    pending: { type: Number, default: 0 }
  }

}, { timestamps: true });

export const Wallet = mongoose.model("Wallet", WalletSchema);