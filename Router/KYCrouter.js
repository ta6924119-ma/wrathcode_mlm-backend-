// Router/KYCrouter.js
import { Router } from "express";
import { submitKYC ,getMyKYC} from "../Controllers/KYC_Controller.js";
import { Userprotect } from "../middleware/MIddlewares.js";

import { upload, kycBodyParser} from "../Uploads/multer.js";

const router = Router();

router.post(
  "/kyc",
  ...kycBodyParser,      
  Userprotect,           
  upload.fields([        
    { name: "frontImage", maxCount: 1 },
    { name: "backImage", maxCount: 1 },
    { name: "selfiewithidnumber", maxCount: 1 },
    { name: "addressImage", maxCount: 1 }
  ]),
  submitKYC,             
);
//get kyc
router.get("/my-kyc",Userprotect,getMyKYC)



export const KYCrouter = router;
