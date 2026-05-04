import { KYC } from "../models/KYC.js";
import {
  isValidAdharNumber,
  isValidPanNumber,
  isValidPassportNumber,
  isValidVoterId,
  isValidPhone,
  isDraiverylicenceId
} from "../Utils/RegisterValidation.js";

export const submitKYC = async (req, res) => {
  try {
    const userId = req.user._id;
    const files = req.files || {};

    const {
      fullName,
      dateOfBirth,
      address,
      city,
      state,
      country,
      pincode,
      phoneNumber,
      idType,
      idNumber,
      idName,
      submit
    } = req.body;
 console.log(req.body)
    let kyc = await KYC.findOne({ userId });
    if (!kyc) kyc = new KYC({ userId });

    console.log(kyc)

    // ================= VALIDATION =================
    if (phoneNumber && !isValidPhone(phoneNumber)) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    if (idType === "Aadhaar" && !isValidAdharNumber(idNumber)) {
      return res.status(400).json({ message: "Invalid Aadhaar" });
    }

    if (idType === "PAN" && !isValidPanNumber(idNumber)) {
      return res.status(400).json({ message: "Invalid PAN" });
    }

    if (idType === "Passport" && !isValidPassportNumber(idNumber)) {
      return res.status(400).json({ message: "Invalid Passport" });
    }

    if (idType === "VoterID" && !isValidVoterId(idNumber)) {
      return res.status(400).json({ message: "Invalid Voter ID" });
    }

    if (idType === "Driver_License" && !isDraiverylicenceId(idNumber)) {
      return res.status(400).json({ message: "Invalid Driver License" });
    }

    // ================= SAVE DATA =================
    
    kyc.fullName = fullName || kyc.fullName;
    kyc.dateOfBirth = dateOfBirth || kyc.dateOfBirth;
    kyc.address = address || kyc.address;
    kyc.city = city || kyc.city;
    kyc.state = state || kyc.state;
    kyc.country = country || kyc.country;
    kyc.pincode = pincode || kyc.pincode;
    kyc.phoneNumber = phoneNumber || kyc.phoneNumber;

    kyc.idType = idType || kyc.idType;
    kyc.idNumber = idNumber || kyc.idNumber;
    kyc.idName = idName || kyc.idName;

    if (files.frontImage) {
      kyc.frontImage = files.frontImage[0].filename;
    }

    if (files.backImage) {
      kyc.backImage = files.backImage[0].filename;
    }

    if (files.selfiewithidnumber) {
      kyc.selfiewithidnumber = files.selfiewithidnumber[0].filename;
    }

    if (files.addressImage) {
      kyc.addressImage = files.addressImage[0].filename;
    }

    // ================= SUBMIT =================
    if (submit) {
      kyc.submitted = true;
      kyc.kycStatus = "Pending";
    }

    await kyc.save();

    return res.status(200).json({
      success: true,
      message: "KYC updated successfully",
      data: kyc
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};




// ================= GET MY KYC  =================
export const getMyKYC = async (req, res) => {
  try {
    const userId = req.user._id;

    const kyc = await KYC.findOne({ userId });

    if (!kyc) {
      return res.status(200).json({
        success: true,
        data: {
          hasKYC: false,
          message: "You haven't submitted KYC yet. Please submit your KYC documents."
        }
      });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const uploadPath = "/uploads/up/";

    let statusMessage = "";
    let statusColor = "";

    if (kyc.kycStatus === "Approved") {
      statusMessage = "Your KYC has been approved";
      statusColor = "green";
    } else if (kyc.kycStatus === "Rejected") {
      statusMessage = `Your KYC was rejected. Reason: ${kyc.adminRemark || "No reason provided"}`;
      statusColor = "red";
    } else if (kyc.kycStatus === "Pending") {
      statusMessage = " Your KYC is under review. Admin will verify soon.";
      statusColor = "orange";
    }

    res.status(200).json({
      success: true,
      data: {
        hasKYC: true,
        status: kyc.kycStatus.toLowerCase(),
        statusMessage: statusMessage,
        statusColor: statusColor,
        adminRemark: kyc.adminRemark || "",
        submittedAt: kyc.createdAt,
        verifiedAt: kyc.verifiedAt || null,
        personalInfo: {
          fullName: kyc.fullName,
          dateOfBirth: kyc.dateOfBirth,
          address: kyc.address,
          city: kyc.city,
          state: kyc.state,
          country: kyc.country,
          pincode: kyc.pincode,
          phoneNumber: kyc.phoneNumber
        },
        idInfo: {
          idType: kyc.idType,
          idNumber: kyc.idNumber,
          idName: kyc.idName
        },
        documents: {
          frontImage: kyc.frontImage ? `${baseUrl}${uploadPath}${kyc.frontImage}` : null,
          backImage: kyc.backImage ? `${baseUrl}${uploadPath}${kyc.backImage}` : null,
          selfie: kyc.selfiewithidnumber ? `${baseUrl}${uploadPath}${kyc.selfiewithidnumber}` : null,
          addressProof: kyc.addressImage ? `${baseUrl}${uploadPath}${kyc.addressImage}` : null
        }
      }
    });

  } catch (error) {
    console.error("Get My KYC Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};