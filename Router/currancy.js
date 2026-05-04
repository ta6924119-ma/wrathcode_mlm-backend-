import { Router } from "express";
import { getUserCurrency } from "../Controllers/CurrencyController.js";
import { Userprotect } from "../middleware/MIddlewares.js";

const router = Router();

router.post("/convert", Userprotect, getUserCurrency);

export const CurrencyRouter = router;
