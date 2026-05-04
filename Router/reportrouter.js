import { Router } from "express";

import { getIncomeReport , getJoiningReport, getFundTransferReport , getWithdrawalReport , getTaxReport} from "../Controllers/ReportController.js";
import { Userprotect } from "../middleware/MIddlewares.js";
const router = Router();




router.get("/income", Userprotect, getIncomeReport);

//===================Join Report====================

router.get("/joining", Userprotect, getJoiningReport);


//===================Fund Transfer Report====================



router.get("/fund-transfer", Userprotect, getFundTransferReport);


//==========================Withdrawal Report========================




router.get("/withdrawal", Userprotect, getWithdrawalReport);

//==========================Tax Report========================




router.get("/tax", Userprotect, getTaxReport);



export const ReportRouter = router;
