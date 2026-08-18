import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
export const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            if (!token || token === "undefined" || token === "null" || token.trim() === "") {
                res.status(401).json({ message: "Not authorized, No token" });
                return;
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback secret");
            req.user = await User.findById(decoded.id).select("-password");
            if (!req.user) {
                res.status(401).json({ message: "User not found" });
                return;
            }
            next();
        }
        catch (error) {
            res.status(401).json({ message: error?.message || "Not authorized, token failed" });
        }
    }
    else {
        res.status(401).json({ message: "Not authorized, No token" });
    }
};
