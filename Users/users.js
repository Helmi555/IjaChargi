const express = require("express");
const bp=require("body-parser");
const bcrypt=require("bcrypt");
const router=express.Router();
const admin = require('firebase-admin');
const {db,auth}=require('../firebase.js');
const { collection } = require("firebase/firestore");
require("dotenv").config()
const axios=require("axios");
const { createUserWithEmailAndPassword } = require('firebase-admin/auth');



router.use(bp.urlencoded({extended:true}));
router.use(express.json())

const apiHandler=require("../ApiHandler.js");
const { sendEmailVerification } = require("firebase/auth");

function errorCheck(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return false;
    for (let element of arr) {
        if (element == null || element === '') return false;
        if (typeof element === 'string' && element.length === 0) return false;
        if (typeof element === 'number' && isNaN(element)) return false;
    }
    return true;
}
function getCurrentTime(){
    
    const currentDate = new Date();
    const hours = currentDate.getHours().toString().padStart(2, '0');
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); 
    const year = currentDate.getFullYear();
    const formattedDate = `${hours}:${minutes} ${day}/${month}/${year}`;
    
    const dateString = formattedDate.toString();
    return dateString
    }

/*
public class Account {
    Integer id;
    String email;
    String password;
    String createdAt;
    String updatedAt;
    Boolean emailVerified;
    Boolean disabled
}

public class User
{
    Integer id;
    String fullName;
    String image;
    String birthDay;
    Integer numberOfCancelledAppointmentByMonth;
    String listOfCars;
    String phoneNumber;
    String token;
    String tokenExpiration;
    String createdAt;
    String updatedAt;
}

--login(String mail,String pass)
--signUp(Account,User)
--getProfileByAccountId(Integer AccountId)

*/


router.post(`${apiHandler.signUp}`,async(req,res)=>{

    const {account,user}=req.body
    const { email, password } = account;
    const { fullName, image, birthDay, listOfCars,phoneNumber } = user;
  

    if(errorCheck([email,password,fullName, image, birthDay, listOfCars,phoneNumber])){
      //check if the user  already exists in the FB AUTH
      
      try {
        const existingUser=await checkUserExistsByEmail(email)
       if(existingUser){

        
       return  res.status(409).json({message:"This Email is Already Registered"})
        
       }else{
         //new user
        
         try {
            const userRecord = await auth.createUser({
                email,
                password,
                photoURL:image,
                displayName:fullName,
                phoneNumber:phoneNumber
            });
            const userUID=userRecord.uid
            const now =getCurrentTime()


            bcrypt.hash(password, 10, async (err,hash) => {
                if (err) {
                    console.error('Error hashing password:', err);
                } else{
                   
            //check if there is an account/user with this userUID in the DB
            try{
            const checkAccount=await db.collection("Accounts").doc(userUID).get()
            if(!checkAccount.exists){
                try{
                const checkUser=await db.collection("Users").doc(userUID).get()
                if(!checkUser.exists){
                    //user and account dont exist , so create new ones
                    try{
                        const newAccount={
                             email:email,
                             password:hash,
                            emailVerified:userRecord.emailVerified,
                            disabled:userRecord.disabled,
                             createdAt:now,
                             updatedAt:now
                        }
                        await db.collection("Accounts").doc(userUID).set(newAccount)
                        try{
                            const newUser={
                                fullName:fullName,
                                image:image,
                                birthDay:birthDay,
                                numberOfCancelledAppointmentByMonth:0,
                                listOfCars:listOfCars,
                                phoneNumber:phoneNumber,
                                createdAt:now,
                                updatedAt:now
                           }
                           await db.collection("Users").doc(userUID).set(newUser)
                           callLastDataBaseUpdate();
                           return res.status(201).json({message:"Successfully Signed Up!"})

                        }
                        catch{
                           return res.status(500).json({ message: "error adding the user to the DB"});

                        }


                    }
                    catch{
                       return res.status(500).json({ message: "error adding the account to the DB"});
                    }
                    
            }
            else{
               return res.status(409).json({ message: "user already registred in the DB"});

            }
                }catch{
                   return res.status(400).json({ message: "error checking user existence"});

                }
        }
            else{
                
               return res.status(409).json({ message: "account already registred in the DB"});

            }
        }catch{
           return res.status(400).json({ message: "error checking account  existence"});

        }
     
    }
})

        } catch (error) {
            console.error('Error during signup:', error);
           return res.status(500).json({ message: "Error in signing up Auth", error: error.message });
        }
      }
    }
      catch(e){
        console.log(e)
       return res.status(400).json({ message: "error checking user Email"});

      }

    }else{
       return res.status(400).json({message:"Missing values"})
    }
})

async function checkUserExistsByEmail(email) {
    try {
      // Attempt to get the user by email
      const userRecord = await auth.getUserByEmail(email);
      console.log('User exists:', userRecord.toJSON());
      return true; // User exists
    } catch (error) {
      console.error('Error checking if user exists:', error.message);
      return false; // User does not exist
    }
  }


router.post(`${apiHandler.login}`, async (req, res) => {
    
    const { idToken } = req.body;
    console.log(idToken)
    if(errorCheck([idToken])){
        try {
            // Verify the ID token
            const decodedToken = await auth.verifyIdToken(idToken);
            const uid = decodedToken.uid;
    
            // Additional logic, such as fetching user data from Firestore
            const userRecord = await db.collection('users').doc(uid).get();
            const userData = userRecord.data();
            console.log(userData)
    
            res.status(200).json({message:"User signed in successfully"});
        } catch (error) {
            console.log(error);
            res.status(500).json({message:"Error signing in"});
        }

}
else{
    res.status(400).json({message:'Missing values'});
}
  });

  router.post(`${apiHandler.getProfileByAccountId}`, async (req, res) => {
    
    const accountId=req.params.accountId

    if(errorCheck([accountId])){
        try {
           const accountsnap=await db.collection("Users").doc(accountId).get()
            if(!accountsnap.exists){
                res.status(400).json({message:'This account does not exist'});

            }
            const accountData=accountsnap.data()
                const newUser={
                    id:accountId,
                    fullName:accountData.fullName,
                    image:accountData.image,
                    birthDay:accountData.birthDay,
                    numberOfCancelledAppointmentByMonth:accountData.numberOfCancelledAppointmentByMonth,
                    listOfCars:accountData.listOfCars,
                    phoneNumber:accountData.phoneNumber,
                    createdAt:accountData.now,
                    updatedAt:accountData.now
               }
               return res.status(201).json(newUser)

        } catch (error) {
            console.log(error);
            res.status(500).send('Error signing in');
        }

}
else{
    res.status(400).json({message:'Missing values'});
}
  });


router.post("/api/v1/LastDataBaseUpdate",async(req,res)=>{
    let col = db.collection("DataBaseUpdate")
    await col.doc("DataBaseUpdate").get()
    .then(async(data)=>{
        if(!data.exists){
            res.sendStatus(404);
        }
        else{
            let now=parseInt((new Date().getTime())/1000)
            col.doc("DataBaseUpdate").update({
            lastDataBaseUpdate:now
            }) 
            .then(()=>{
                res.status(200).json({ "message": "the last database update has been updated "});
            })
            .catch((error)=>{console.log(error)
                res.status(500).json(createResponseModel("Error updating the value","",[],{},500,true))
            });
        }

    })
    .catch((error)=>{
        res.status(500).json({ "error": 'Error getting the LastDataBaseUpdate',error });
    })

})



async function callLastDataBaseUpdate() {
    try {
        const URL=`${process.env.DOMAIN}api/v1/LastDataBaseUpdate`
        axios.post(URL)
    } catch (error) {
        console.error('Error calling LastDataBaseUpdate:', error);
    }
}

async function sendVerificationEmail(uid) {
    try {
      await auth.sendEmailVerification(uid);
      console.log('Verification email sent to user');
    } catch (error) {
      console.error('Error sending verification email:', error);
    }
  }

  async function checkEmailVerificationStatus(uid) {
    try {
      const userRecord = await auth.getUser(uid);
      if (userRecord.emailVerified) {
        console.log('Email is verified');
        return true
      } else {
        console.log('Email is not verified');
        return  false;
      }
    } catch (error) {
    
      console.error('Error checking email verification status:', error);
      return false
    }
  }
  

/*  try {
            // Create a new user in Firebase Auth using the Admin SDK
            const userRecord = await auth.createUser({
                email,
                password,
            });

            // Additional logic for handling database updates or other post-signup actions
            callLastDataBaseUpdate(); // Ensure this function is defined elsewhere in your code

            // Respond with success message
            res.status(201).send('User created successfully');
        } catch (error) {
            console.error('Error during signup:', error);
            res.status(500).send({ message: "Error in signing up", error: error.message });
        }




*/
module.exports=router