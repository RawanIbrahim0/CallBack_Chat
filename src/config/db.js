import mongoose from "mongoose";
import dotenv from "dotenv";
const connectingDB=async()=>{
    try{
        mongoose.connect(process.env.MONGO_URL)
        console.log("Database connected successfully");
    }catch(err){
        console.log("Database connection error:", err.message);
        device.exit(1);
    }
}
export default connectingDB;