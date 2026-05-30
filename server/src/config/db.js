const mongoose= require('mongoose');
const MONGO_URI= process.env.DATABASE.replace('<db_password>', process.env.DATABASE_PASSWORD);

const connectDB= async ()=>{
    try{
        const conn= await mongoose.connect(MONGO_URI);
        console.log('Database Connected Successfully ✅');
    }
    catch(error){
        console.error(`ERROR: ${error.message}`);
        process.exit(1);
    }
}

module.exports= connectDB;