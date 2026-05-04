import { Router } from "express";

import { getProfile ,Updateprofile } from "../Controllers/userProfileController.js";
import { Userprotect } from "../middleware/MIddlewares.js";
const router = Router()

//profile get
router.get("/getprofile" ,Userprotect, getProfile)

//edit profile

router.patch("/edit/profile" ,Userprotect, Updateprofile)


export  const profilerouter  = router