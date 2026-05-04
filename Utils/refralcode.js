// Refral code

export const generateReferralCode = (length = 6) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let referralCode = "";
    for (let i = 0; i < length; i++) {
        referralCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return referralCode;
};