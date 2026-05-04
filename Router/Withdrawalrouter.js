import { Router } from "express";

import { requestWithdrawal ,getWithdrawalHistory} from "../Controllers/WithdrawalController.js";
import { Userprotect } from "../middleware/MIddlewares.js";

const router = Router();

//post request withdrawal

router.post("/amount",Userprotect,requestWithdrawal);

router.get("/history",Userprotect,getWithdrawalHistory);
export const Withdrawalrouter = router;
