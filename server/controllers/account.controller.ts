import { AuthRequest } from "../middlewares/auth.middleware.js";
import { Account } from "../models/account.model.js";
import {Response} from  "express"
import zernio from "../config/zernio.js";

//get all accounts
// GET /api/accounts

export const getAccounts = async(req: AuthRequest,res:Response) : Promise<void>=>{
     try {
        const accounts = await Account.find({user:req.user._id})
        res.json(accounts);
     } catch (error:any) {
        res.status(500).json({message:error?.message || "server error"});
     }
}

//add account
//POST /api/accounts

export const addAccount = async(req: AuthRequest,res:Response) : Promise<void>=>{
     try {
        const {platform,handle,avatarUrl} = req.body;

        const account = await Account.create({user:req.user._id,platform,handle,avatarUrl});

        res.status(201).json(account);

     } catch (error:any) {
        res.status(500).json({message:error?.message || "server error"});
     }
}

//disconnect account
//DELETE /api/account/:id

export const disconnectAccount = async(req: AuthRequest,res:Response) : Promise<void>=>{
     try {
       const account = await Account.findOne({_id:req.params.id,user:req.user._id});

       if(!account){
           res.status(404).json({message:"Account not found"});
       }

       if(account?.zernioAccountId){
           try {
               await zernio.accounts.deleteAccount({path:{accountId:account.zernioAccountId}});

           } catch (error:any) {
               res.status(500).json({message:error?.response?.data?.message || error?.message});
           }
       }
       await account?.deleteOne();
       res.json({message:"account disconnected successfully"});

     } catch (error:any) {
        res.status(500).json({message:error?.message || "server error"});
     }
}
