import multer from "multer";
import path from "path";
import fs from "fs";
 
const dir = "uploads/up";
 
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}
 
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, dir);
  },
 
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
 
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
 
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});
 
const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/jpg",
  ];
 
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG images allowed"));
  }
};
 
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 4,
  },
});