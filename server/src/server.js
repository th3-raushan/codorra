require('dotenv').config();
const app = require('./app.js');
const connectDB= require('./config/db.js');

const port = process.env.PORT || 3000;

const startServer= async ()=>{
    try{
        await connectDB();
        app.listen(port, () => {
        console.log(`Listening to port: ${port}`)
})
    }
    catch(error){
        console.log("Failed to start server:", error.message);
        process.exit(1);
    }
}

startServer();

