import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { generatePost, getGenerations, getPosts, schedulePost } from "../controllers/post.controller.js";
import { upload } from "../config/multer.js";

const postRouter = express.Router();

postRouter.get('/',protect,getPosts);
postRouter.get('/generations',protect,getGenerations);
postRouter.post('/',protect,upload.single("media"),schedulePost);
postRouter.post('/generate',protect,generatePost);

export default postRouter;

