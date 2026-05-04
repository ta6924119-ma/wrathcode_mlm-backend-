import { KYC } from "../models/KYC.js";

export const checkKYCApproved = async (userId) => {
  const kyc = await KYC.findOne({ userId });

  if (!kyc) return false;

  return kyc.kycStatus === "Approved";
};