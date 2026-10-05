import mongoose from "mongoose";
import "dotenv/config";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log("se conecto a la base de datos")
    }
    catch (error){
        console.log("error al conectar a la base de datos",error)
        process.exit(1)
    }
}

export const disconnectDB = async () => {
    await mongoose.disconnect()
}

export default connectDB;