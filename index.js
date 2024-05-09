const express = require("express");
const bp=require("body-parser");
const bc=require("bcrypt");
const app=express();
const jwt=require("jsonwebtoken");
const admin = require('firebase-admin');
const {db}=require('./firebase.js');
const { collection } = require("firebase/firestore");
require("dotenv").config()
const axios=require("axios");

const PORT= process.env.PORT||3000

app.use(bp.urlencoded({extended:true}));
app.use(express.json())

const stationRouter=require("./Stations/stations.js")
app.use("",stationRouter)

const carRouter=require("./Cars/cars.js")
app.use("",carRouter)

const notificationRouter=require("./Notifications/notifications.js")
app.use("",notificationRouter)

const rdvRouter=require("./Appointment/appointment.js")
app.use("",rdvRouter)

const userRouter=require("./Users/users.js")
app.use("",userRouter)








app.listen(PORT,()=>{
    console.log(`Listening on port ${PORT}`)

})


