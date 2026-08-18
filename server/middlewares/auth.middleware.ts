import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export interface AuthRequest extends Request {
    user?: any,
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer")) {
        try {
            token = authHeader.split(" ")[1];
            if (!token || token === "undefined" || token === "null" || token.trim() === "") {
                res.status(401).json({ message: "Not authorized, No token" });
                return;
            }
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "fallback secret");

            req.user = await User.findById(decoded.id).select("-password");
            if (!req.user) {
                res.status(401).json({ message: "User not found" });
                return;
            }

            next();
        } catch (error: any) {
            res.status(401).json({ message: error?.message || "Not authorized, token failed" });
        }
    } else {
        res.status(401).json({ message: "Not authorized, No token" });
    }
};