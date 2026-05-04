import { Router } from "express";

import {
 createTicket, getMyTickets, addReply} from "../Controllers/CreateTicketController.js";

import { Userprotect } from "../middleware/MIddlewares.js";

import { upload } from "../Uploads/multer.js";

const router = Router();

// Create a new support ticket
router.post("/create", Userprotect, upload.single("attachment"), createTicket);
// Get all tickets of the logged-in user
router.get("/my-ticket", Userprotect, getMyTickets);
// Add a reply to a ticket
router.post("/reply", Userprotect, addReply);


export const TicketRouter = router;
