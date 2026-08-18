import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || "fallback secret", { expiresIn: '30d' });
};
export const registeruser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400).json({ message: "user already exists" });
            return;
        }
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);
        const user = await User.create({ name, email, password: hashPassword });
        if (user) {
            res.status(201).json({ _id: user._id, name: user.name, email: user.email, token: generateToken(user._id.toString()) });
        }
        else {
            res.status(400).json({ message: "Invalid user data" });
        }
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "server error" });
    }
};
//login user
//POST /api/auth/login
export const loginuser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({ _id: user._id, name: user.name, email: user.email, token: generateToken(user._id.toString()) });
        }
        else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "server error" });
    }
};
