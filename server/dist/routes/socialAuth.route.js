import express from "express";
import { generateAuthUrl, syncAccounts } from "../controllers/socialAuth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
const socialAuthRouter = express.Router();
socialAuthRouter.get('/:platform/url', protect, generateAuthUrl);
socialAuthRouter.get('/sync', protect, syncAccounts);
export default socialAuthRouter;
