const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Importing models 
const userModel = require('./models/userModel');
const foodModel = require('./models/foodModel')
const verifyToken = require("./verifyToken")
const trackingModel = require("./models/trackingModel")

// Database connection
mongoose.connect("mongodb://localhost:27017/nutritionapp")
  .then(() => {
    console.log("Database is up");
  })
  .catch((err) => {
    console.log(err);
  });

const app = express();
app.use(express.json());

// endpoint for registring user
app.post("/register", (req, res) => {
  let user = req.body;

  bcrypt.genSalt(10, (err, salt) => {
    if (!err) {
      bcrypt.hash(user.password, salt, async (err, hpass) => {
        if (!err) {
          user.password = hpass;

          try {
            let doc = await userModel.create(user);
            res.status(201).send({ message: "User Registered" });
          } catch (err) {
            console.log(err);
            res.status(500).send({ message: "Some Problem" });
          }
        }
      });
    }
  });
});


//endpoint for login

app.post("/login",async(req,res)=>{

    let userCred = req.body

   try
   {
    const user = await userModel.findOne({email:userCred.email})
    if(user!==null)
    {
        bcrypt.compare(userCred.password,user.password,(err,success)=>{
            if(success==true)
            {
                jwt.sign({email:userCred.email},"nutritionapp",(err,token)=>{
                    if(!err)
                    {
                        res.send({message:"Login Success", token:token})
                    }
                })
            }
            else
            {
                res.status(403).send({message:"Incorrect password"})
            }
        })
    }
    else
    {
        res.status(404).send({message:"User not found"})
    }
   }

   catch(err)
   {
    console.log(err);
    res.status(500).send({message:"Some Problem"})
   }

})

//endpoint to fetch foods
app.get("/foods",verifyToken,async (req,res)=>{

  try
  {
      let foods = await foodModel.find()
      
          res.send(foods); 
  }
  catch(err)
  {
      console.log(err);
      res.status(500).send({message:"Some Problem in getting the food"})
  }
  

})


// endpoint to search food by name

app.get("/foods/:name",verifyToken,async(req,res)=>{
  
  try
  {
    let foods = await foodModel.find({name:{$regex:req.params.name,$options:'i'}})

      if(foods.length!==0)
      {
        res.send(foods)
      }
     else
     {
        res.status(404).send({message:"Food item not found"})
     }

  }

  catch(err)
  {
    console.log(err)
    res.status(500).send({message:"Problems with finding the food"})
  }
    

})


// endpoint to track a food

app.post("/track",verifyToken,async(req,res)=>{

  try
  {
      let trackData = req.body

      let data = await trackingModel.create(trackData)
      res.status(201).send({message:"Food added"})

  }
  catch(err)
  {
    console.log(err)
    res.status(500).send({message:"Problems with adding the food"})
  }

})

//endpoint to fetch all foods eaten by a user

app.get("/track/:userid/:date",async (req,res)=>{

  let userid = req.params.userid;
  let date = new Date(req.params.date);
  let strDate = date.getDate()+"/"+(date.getMonth()+1)+"/"+date.getFullYear();

  try
  {

      let foods = await trackingModel.find({userId:userid,eatenDate:strDate}).populate('userId').populate('foodId')
      res.send(foods);

  }
  catch(err)
  {
      console.log(err);
      res.status(500).send({message:"Some Problem in getting the food"})
  }


})


const PORT = 8000;
app.listen(PORT, () => {
  console.log("Server is up and running");
});
