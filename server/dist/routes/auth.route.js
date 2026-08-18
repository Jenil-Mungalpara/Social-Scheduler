import { Router } from "express";
import { loginuser, registeruser } from "../controllers/auth.controller.js";
const authRouter = Router();
authRouter.post('/register', registeruser);
authRouter.post('/login', loginuser);
export default authRouter;
