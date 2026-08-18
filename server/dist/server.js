import "dotenv/config";
import express from 'express';
import cors from "cors";
import connectDB from "./config/db.js";
import dns from "node:dns"; // <-- 1. Import DNS module
import authRouter from "./routes/auth.route.js";
import socialAuthRouter from "./routes/socialAuth.route.js";
import accountRouter from "./routes/account.route.js";
import postRouter from "./routes/post.route.js";
import activityRouter from "./routes/activity.route.js";
import { initScheduler } from "./services/scheduler.service.js";
// <-- 2. Force Node.js to use IPv4 for DNS resolution
dns.setDefaultResultOrder('ipv4first');
const app = express();
//Database connection
await connectDB();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 3000;
app.get('/', (_req, res) => {
    res.send('Server is Live!');
});
app.use('/api/auth', authRouter);
app.use('/api/oauth', socialAuthRouter);
app.use('/api/accounts', accountRouter);
app.use('/api/posts', postRouter);
app.use('/api/activity', activityRouter);
//initilize scheduler
initScheduler();
//Global error handle
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).send(err?.response?.data?.message || err?.message);
});
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
