const mongoose=require('mongoose');

const connectDB=async ()=>{
    try{
        const dbURI=process.env.dbURI;
        await mongoose.connect(dbURI)
        console.log("Mongodb connnected successfully!");        
    }
    catch(e){
        console.log("MongoDB connection failed", e);
        process.exit(1);
    }
}

module.exports=connectDB;