import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export interface AuthRequest extends Request {
    user?: any,
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split("")[1];
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

            req.user = await User.findById(decoded.id).select("-password");

            next()
        } catch (error: any) {
            res.status(401).json({ message: error?.message || "Not authorized , token failed" });
        }
    }

    else {
        res.status(401).json({ message: "Not authorized , No token"});
    }
}