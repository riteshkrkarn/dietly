import { Router } from "express";
import { chat } from "../controllers/chat-controller.js";

const router = Router();

// Chat with copilot
router.route("/").post(chat);

export default router;
