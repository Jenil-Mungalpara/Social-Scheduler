import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { getActivity } from '../controllers/activity.controller.js';
const activityRouter = express.Router();
activityRouter.get('/', protect, getActivity);
export default activityRouter;
