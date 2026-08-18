//get all activity
//GET /api/activity
import { ActivityLog } from "../models/activitylog.model.js";
export const getActivity = async (req, res) => {
    try {
        const activity = await ActivityLog.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10).populate("relatedPost", "content");
        res.json(activity);
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "server error" });
    }
};
