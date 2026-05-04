// Uploads/multer.js
import multer from "multer";
import path from "path";
import fs from "fs";
import bodyParser from "body-parser";  

// ================= FOLDER SETUP =================
const dir = "uploads/up";
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// ================= STORAGE CONFIG =================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// ================= FILE FILTER =================
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG images allowed"), false);
  }
};

// ================= MULTER CONFIG =================
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB per file
    files: 4                     // Max 4 files (front, back, selfie, address)
  }
});

// ================= BODY PARSER WITH LIMITS =================
//
export const kycBodyParser = [
  bodyParser.json({ 
    limit: '50mb',
    extended: true 
  }),
  bodyParser.urlencoded({ 
    limit: '50mb', 
    extended: true,
    parameterLimit: 50000 
  })
];

// ================= ERROR HANDLER =================
// 
export const kycErrorHandler = (err, req, res, next) => {

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: "Request too large. Max allowed: 50MB"
    });
  }
  
  //  File size exceeded (Multer error)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: "File too large. Max 5MB per image allowed"
    });
  }
  
  // Invalid file type
  if (err.message?.includes('Only JPG, JPEG, PNG')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  //  Too many files
  if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: "Too many files uploaded. Max 4 files allowed"
    });
  }
  
  next();
};