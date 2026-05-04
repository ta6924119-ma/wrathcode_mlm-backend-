import { Router } from "express";
import { Userprotect } from "../middleware/MIddlewares.js";
import {
  getInvestment,
  buyPlan,
  getPaymentMethods,
  createRazorpayOrder,
  verifyRazorpayPayment,
  initializeBankTransfer,
  verifyBankTransfer,
  initializeOfflinePayment,
} from "../Controllers/InvesmentController.js";

const router = Router();


// Get available payment methods and bank details
router.get("/methods", Userprotect, getPaymentMethods);

// Razorpay Payment Flow
router.post("/razorpay/order", Userprotect, createRazorpayOrder);
router.post("/razorpay/verify", Userprotect, verifyRazorpayPayment);

// Manual Bank Transfer Flow
router.post("/bank/initialize", Userprotect, initializeBankTransfer);
router.post("/bank/verify", Userprotect, verifyBankTransfer);

// Offline Payment Flow
router.post("/offline", Userprotect, initializeOfflinePayment);

// Direct Wallet Payment
router.post("/buy", Userprotect, buyPlan);
// Get investment history
router.get("/history/investment", Userprotect, getInvestment);


export const InvestmentRouter = router;
