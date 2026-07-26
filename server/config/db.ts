import mongoose from "mongoose";

const connectDB = async()=>{
    try {
        mongoose.connection.on("connected",async()=>{
            console.log("mongoDB connected");
        })
        
        // <-- ADD { family: 4 } to force IPv4 connection
        await mongoose.connect(process.env.MONGODB_URI!, { family: 4 })
        
    } catch (error:any) {
        console.error(error)
        process.exit(1);
    }
}

export default connectDB;