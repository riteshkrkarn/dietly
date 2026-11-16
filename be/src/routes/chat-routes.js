import { Router } from "express";
import { chat, getModels } from "../controllers/chat-controller.js";

const router = Router();

// Chat with copilot
router.route("/").post(chat);

// Get available models
router.route("/models").get(getModels);

export default router;

