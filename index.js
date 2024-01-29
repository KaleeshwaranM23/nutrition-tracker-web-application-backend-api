const express = require ("express");
const mongoose = require ("mongoose");

const bcrypt = require ("bcryptjs");
const jwt = require ("jsonwebtoken");

const cors = require ("cors")

//Importing model
const userModel = require('./models/userModel')
const foodModel = require('./models/foodModel')
const trackingModel = require('./models/trackingModel')
const verifyToken = require('./verifyToken')

//database connection
mongoose.connect("mongodb://localhost:27017/Backend-Nutrition-Tracker-App")
.then(()=>{
    console.log("Connection successfull");
})
.catch((err)=>{
    console.log(err);
})



const app = express();

app.use(express.json());
app.use(cors());


//Endpoint for registering users
app.post("/register", (req,res)=>{

    let users = req.body;

   
    bcrypt.genSalt(10,(err,salt)=>{
        if(!err)
        {
            bcrypt.hash(users.password, salt, async(err, hpass)=>{
                if(!err)
                {
                    users.password=hpass;
                    try
                    {
                        let doc = await userModel.create(users)
                        res.status(201).send({message:"Registered Successfully!"})
                    }
                    catch(err)
                    {
                        console.log(err);
                        res.status(500).send({message:"Sorry...Something is wrong with me..."})
                    }
                }
            })
        }
    })    
})


//Endpoint for login

app.post("/login", async(req,res)=>{

    let userCred = req.body;

    try{
        const users = await userModel.findOne({email:userCred.email});
        if(users!=null)
        {
            bcrypt.compare(userCred.password,users.password,(err,success)=>{
                if(success==true){
                    jwt.sign({email:userCred.email},"nutrition",(err,token)=>{
                        if(!err)
                        {
                            res.send({message:"Login Successfull!", token:token, name:users.name, userid:users.id});
                        }
                    })
                }
                else{
                    res.status(403).send({message:"Incorrect password"})
                }
            })
        }
        else
        {
            res.status(404).send({message:"User not found!"})
        }
    }
    catch(err){
        console.log(err);
        res.status(500).send({message:"Sorry...Something is wrong with me..."})
    }
})


//Endpoint to fetch/get foods

app.get("/foods", verifyToken, async(req,res)=>{

    try{
        let foods = await foodModel.find();
        res.send(foods);
    }
    catch(err){
        console.log(err);
        res.status(500).send({message:"Problem getting info"})
    }

})


//Endpoint to search food by name

app.get("/foods/:name", verifyToken, async(req,res)=>{

    try
    {
        let foods = await foodModel.find({name:{$regex:req.params.name, $options:'i'}})
        if(foods.length!==0)
        {
            res.send(foods);
        }
        else
        {
            res.status(404).send({message:"Food not found"})
        }
        
    }
    catch(err)
    {
        console.log(err)
        res.status(500).send({message:"Error getting the food"})
    }

})


//Endpoint to track food

app.post("/track",verifyToken, async(req,res)=>{

    let trackData = req.body;

    try
    {
        let data = await trackingModel.create(trackData)
        res.status(201).send({message:"Food is added"})
    }
    catch(err)
    {
        console.log(err)
        res.status(500).send({message:"Error adding the food"})
    }

})


//Endpoint to fetch all food eaten by a person

app.get("/track/:userid/:date", verifyToken, async(req,res)=>{

    let userid = req.params.userid;
    let date = new Date(req.params.date);
    let strDate = date.getDate()+"/"+(date.getMonth()+1)+"/"+date.getFullYear();

    try
    {
        let foods = await trackingModel.find({userId:userid, eatenDate:strDate}).populate('userId').populate('foodId')
        res.send(foods)
    }
    catch(err)
    {
        console.log(err)
        res.status(500).send({message:"Error getting the food"})
    }

})





app.listen(8000,()=>{
    console.log("server is up")
})