// =============================import .env package and import necessary values
const dotEnv=require('dotenv');
dotEnv.config();
const port=process.env.PORT || 5000;

// ==============import db connect file and connect db
const connectDB=require('./src/config/db.js');
connectDB();

// =========================import app from app.js
const app=require('./src/app.js');


// =========================give a response in home route
app.get('/', (req, res)=>{
    res.send('Backend app is running...');
})

// ========================listen on port
app.listen(port, ()=>{
    console.log(`Backend App is running on port ${port}`);
})

