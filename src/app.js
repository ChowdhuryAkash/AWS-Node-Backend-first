const express=require('express');
const cors=require('cors');

const app=express();
app.use(express.json()) //===========helps to parse incoming json requests
app.use(cors()); //============cors


// ===========import routes
const userRouter = require('./routes/user.route');



// based on the routes lets the respective route files work
app.use('/users', userRouter);


module.exports=app;