
const express = require("express");
const bp=require("body-parser");
const bc=require("bcrypt");
const router=express.Router();
const admin = require('firebase-admin');
const {db}=require('../firebase.js');
const { collection } = require("firebase/firestore");
require("dotenv").config()
const axios=require("axios");

router.use(bp.urlencoded({extended:true}));
router.use(express.json())

const apiHandler=require("../ApiHandler.js")




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


    
function createResponseModel(msg,idhold,Errorcode,Thereisanerror){
    return { 
      message:msg,
      idHolder:idhold,
      errorCode:Errorcode,
      thereIsAnError:Thereisanerror
    }
}


async function getIndexOfLastElement(documentName) {
    try {
        const collectionRef = db.collection(documentName);
        const snapshot = await collectionRef.get();
        const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        documents.sort((a, b) => {
            const intValueA = parseInt(a.id);
            const intValueB = parseInt(b.id);

            return intValueA - intValueB;
        });

        return parseInt(documents[documents.length-1].id);
    } catch (error) {
        console.error('Error getting documents:', error);
        return -1;
    }
}

/*public class Notification {
    Integer id;
    String title;
    String message;
    Integer senderId;
    Integer receiverId;
    String createdAt;
    String updatedAt;
}
*/

router.get(`${apiHandler.getAllNotificationByReceiverId}`,async(req,res)=>{
    const receiverId=req.params.receiverId

    if(errorCheck([receiverId])){
        try{
    const snapshot =await db.collection("Notifications").get()
        if(snapshot.empty){
            res.status(404).json({"message":"There is no notifications at all"});
        }
        else{
            const notifList=[]
           snapshot.forEach((notif)=>{
            const data=notif.data()
            if(data.receiverId==receiverId){
                const notification={
                    id:notif.id,
                     title:data.title,
                     message:data.message,
                     senderId:data.senderId,
                     receiverId:data.receiverId,
                     createdAt:data.createdAt,
                     updatedAt:data.updateAt,
                }

                notifList.push(notification)
            }
           })
           
           return res.status(200).json(notifList)
           
        }

    }
    catch{
        return res.status(500).json({ "error": 'Error getting info from DataBase ',error });
    }
}
else{
    return res.status(400).json({"message":"null values detected"})
}

})



router.get(`${apiHandler.getAllServices}`,async(req,res)=>{

        try{
    const snapshot =await db.collection("services").get()
    
        if(snapshot.empty){
            return res.status(404).json({"message":"There is no services at all"});
        }
        
            const servicesList=[]
           snapshot.forEach((service)=>{
            const data=service.data()
                const newservice={
                    id:service.id,
                     name:data.name,
                     description:data.description,
                     logo:data.logo,
                     createdAt:data.createdAt,
                     updatedAt:data.updateAt,
                }
                servicesList.push(newservice)
           })
           return res.status(200).json(servicesList)
           
    }
    catch{
        return res.status(500).json({ "error": 'Error getting services from DataBase '});
    }

})


async function callLastDataBaseUpdate() {
    try {
        const URL=`${process.env.DOMAIN}api/v1/LastDataBaseUpdate`
        axios.post(URL)
    } catch (error) {
        console.error('Error calling LastDataBaseUpdate:', error);
    }
}






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
                res.status(500).json(createResponseModel("Error updating the value","",500000,true))
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



module.exports=router

