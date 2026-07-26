import express from "express";
import { addAccount, disconnectAccount, getAccounts } from "../controllers/account.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const accountRouter = express.Router()

accountRouter.get('/',protect,getAccounts);
accountRouter.post('/',protect,addAccount);
accountRouter.delete('/',protect,disconnectAccount);

export default accountRouter;
