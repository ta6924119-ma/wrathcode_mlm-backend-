import { Router } from "express";

import { createDeposit } from "../Controllers/depositController.js";

import { Userprotect } from "../middleware/MIddlewares.js";

const router = Router();

router.post("/wallet", Userprotect, createDeposit);

export const depositrouter = router;
