import {
  createNotification,
  getUserNotifications,
  markAsRead,
} from "../Controllers/notificationController.js";
import { Userprotect } from "../middleware/MIddlewares.js";
import { Router } from "express";

const router = Router();

//  Create a notification and emit in real-time
router.post("/create", Userprotect, createNotification);

// Get all notifications for a user
router.get("/user/:userId", Userprotect, getUserNotifications);
// Optional: Mark notification as read
router.put("/mark-as-read/:notificationId", Userprotect, markAsRead);

export const NotificationRouter = router;
