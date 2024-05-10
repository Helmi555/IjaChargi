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

const apiHandler=require("../ApiHandler.js");




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
      Message:msg,
      IdHolder:idhold,
      ErrorCode:Errorcode,
      ThereIsAnError:Thereisanerror
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
//////////// RRRRRDDDDDDDDDVVVVVVVVVVVV \\\\\\\\\\

/*public class RDV {

    public RDV(Integer id, Integer carId, Integer userId, Integer chargerPortId, String date, String time, String price, String paymentType, String status) {
        this.id = id;
        this.carId = carId;
        this.userId = userId;
        this.chargerPortId = chargerPortId;
        this.date = date;
        this.time = time;
        this.price = price;
        this.paymentType = paymentType;
        this.status = status;
        this.createdAt=createdAt;
        this.updated=updated;
        // zid createdAT and updatedAt
    }
}
 */

router.post(`${apiHandler.createAppointment}`,async (req,res)=>{
    
    const carId = req.body.carId;
    const userId = req.body.userId;
    const chargerPortId = req.body.chargerPortId;
    const date = req.body.date;
    const time = req.body.time;
    const price = req.body.price;
    const paymentType = req.body.paymentType;
    const status = req.body.status;

    if(errorCheck([carId,userId,chargerPortId,date,time,price,paymentType,status]))
        {
            //all good 
            try{
                //check if the user exists
            const usersnap=await db.collection("Users").doc(userId).get()
            if(!usersnap.exists)
                {
                    return res.status(404).json({ "message": "User not found!" });
                }
            
                //user exists + check if the car exists 
                try{
                    const carsnap=await db.collection("Cars").doc(carId).get()
                    if(!carsnap.exists){
                        //car doesnt exist
                        return res.status(404).json({ "message": "Car not found!" });
                
                    }
                    //check if the user own the car

                const userdata=usersnap.data()
                let carList=userdata.listOfCars
                const carExist=carList.some(car =>car.chassisNumber==carId)
                if (!carExist) {
                //the user doesnt have this car
                return res.status(403).json({"message":"This user doesnt own this car"});
                }

                try{
                    const chargerPortsnap=await db.collection("chargerPort").doc(chargerPortId).get()
                    if(!chargerPortsnap.exists){
                        //chargerPort doesnt exist
                        
                        return res.status(404).json({ "message": "chargerPort not found!" });
                    }   
                    //car && user exits check portCharger exits
                    
                        const chargerPortData=chargerPortsnap.data()
                        chargerId=chargerPortData.chargerId
                        if(chargerId!="undefined" && chargerId!=""){
                            

                            // Make all the checks

                                if ( await checkIfChargerStatusIsONBychargerId(chargerId, res)){
                                    return res.status(200).json({ "message": "car charger is unavailable" });
                                }
                                
                                if(await checkIfThereIsAppointmentWithTheSameTimeAndSameDate(date,time,res)){
                                    return res.status(404).json({ "message": "this date is already taken" });

                                }
                               
                                if(await checkIfUserHaveMoreThen2AppointmentFiDateHaki(userId,date,res)){
                                    return res.status(404).json({ "message": "the user has already 2 appointments in this date" });

                                }
                                if(await checkIfUserHaveMoreThen10ActiveAppointmentInTheNext7Days(userId,date,res)){
                                    return res.status(404).json({ "message": "the user has already 10 appointments in this week" });

                                }

                                if(await checkIfCarHaveMoreThen10ActiveAppointmentInTheNext7Days(carId,date,res)){
    
                                return res.status(404).json({ "message": "the car has already 10 appointments in this week" });

                                }
                                //all good just create the APPPPPOOINNTMMENNNTTT plllllllllllzzzzzzzzz     \\\\\\\\\\\\\\\\\\\\\\

                            
                        try{
                            const lastIndexOfRDV=await getIndexOfLastElement("Appointments")
                            //const nextIndex = isNaN(parseInt(lastIndexOfRDV)) ? 1 : parseInt(lastIndexOfRDV) + 1;
                            const now=getCurrentTime()
                            if(lastIndexOfRDV!==-1){
                                //add the RDV
                                const newRDV={
                                    carId :carId,
                                    userId :userId,
                                    chargerPortId :chargerPortId,
                                    date :date,
                                    time :time,
                                    price :price,
                                    paymentType :paymentType,
                                    status :status,
                                    updatedAt:now,
                                    createdAt:now
                                }
                                try {
                                    await db.collection("Appointments").doc(String(lastIndexOfRDV+1)).set(newRDV);

                                    callLastDataBaseUpdate();
                                    return res.status(200).json(createResponseModel("Appointment added successfully",String(lastIndexOfRDV+1),200000,false));
                                } catch {
                                    return res.status(404).json({ "message": "error adding appointment" });
                                }
                            }
                            else{
                                //error getting last index
                                return res.status(500).send({"message":"Error getting last Index from database"});
                            }
                        }
                        catch{
                            //error adding the RDV
                            res.status(500).json({ "message": "Error adding the RDV to the database" });
        
                        }
                        }
                        else{
                            return res.status(404).json({ "message": "chargerPort has no chargerId" });

                        }

                    } 
                    catch(e){
                        console.log("the error is : ",e)
                        return res.status(500).send({"message":"Error getting chargerPort from database"});
                    }

           }
            catch{
                    return res.status(500).send({"message":"Error getting car from database"});
                }

            }
            catch(error){
                return res.status(500).send({"message":"Error getting user from database"});
            }
        }

    else{
        //null values
         res.status(400).json({"message":"Missing required fields"});

    }

})

router.post(`${apiHandler.deleteAppointmentById}`,async(req,res)=>{

    const appId=req.params.appointmentId

    if(errorCheck([appId])){

        try{
        const appsnapshot= await db.collection("Appointments").doc(appId).get()
    
        if(!appsnapshot.exists){

        return res.status(404).json({ "message": "Appointment not found!" });
        }
            db.collection("Appointments").doc(appId).delete()
            .then(()=>{
                callLastDataBaseUpdate()
                return res.status(200).json(createResponseModel("Appointment deleted successfully",appId,200000,false));
            })
    
            .catch((e)=>{
                console.log(e)
            return res.status(500).json({"message":"Error deleting appointment from database"})
        })

        }
    catch(e){
        console.log("The Error Is:", e);
        return res.status(500).json({"message":"Error getting appointment from database"})
    }
    }
    else{
        res.status(400).json({"message":"Missing required fields"});

    }
})

router.get(`${apiHandler.getAllAppointmentForDateAndChargerPort}`,async(req,res)=>{

    const date=req.body.date
    const chargerPortId=req.body.chargerPortId

    if(errorCheck([date,chargerPortId])){

        try{
        const appsnapshot= await db.collection("Appointments").get()
         
        if(appsnapshot.empty){
        return res.status(404).json({ "message": "Appointments not found!" });
        }
        const appList=[]
        appsnapshot.forEach((doc)=> {
           let docdata = doc.data(); 
           if(docdata.date==date && docdata.chargerPortId==chargerPortId){
            const newdoc={
                id : doc.id ,
                carId : docdata.carId,
                userId : docdata.userId,
                chargerPortId : docdata.chargerPortId,
                date : docdata.date,
                time : docdata.time,
                price : docdata.price,
                paymentType : docdata.paymentType,
                status : docdata.status,
                createdAt: docdata.createdAt,
                updated: docdata.updated
            }
            appList.push(newdoc)
           }

        })
        return res.status(200).json(appList)

        
    }
    catch(e){
        console.log("The Error Is:", e);
        return res.status(500).json({"message":"Error getting appointment from database"})
    }
    }
    else{
        res.status(400).json({"message":"Missing required fields"});

    }
})

router.get(`${apiHandler.getAllAppointmentForUser}`,async(req,res)=>{

    const userId=req.params.userId

    if(errorCheck([userId])){

        try{
        const appsnapshot= await db.collection("Appointments").where("userId","==",userId).get()
         
        if(appsnapshot.empty){
        return res.status(404).json({ "message": "The user has no appointments" });
        }
        const appList=[]
        appsnapshot.forEach((doc)=> {
           let docdata = doc.data(); 
          
            const newdoc={
                id : doc.id ,
                carId : docdata.carId,
                userId : docdata.userId,
                chargerPortId : docdata.chargerPortId,
                date : docdata.date,
                time : docdata.time,
                price : docdata.price,
                paymentType : docdata.paymentType,
                status : docdata.status,
                createdAt: docdata.createdAt,
                updated: docdata.updated
            }
            appList.push(newdoc)

        })
        return res.status(200).json(appList)

        
    }
    catch(e){
        console.log("The Error Is:", e);
        return res.status(500).json({"message":"Error getting appointment from database"})
    }
    }
    else{
        res.status(400).json({"message":"Missing required fields"});

    }
})


router.get(`${apiHandler.getAllAppointmentForCar}`,async(req,res)=>{

    const carId=req.params.carId

    if(errorCheck([carId])){

        try{
        const appsnapshot= await db.collection("Appointments").where("carId","==",carId).get()
         
        if(appsnapshot.empty){
        return res.status(404).json({ "message": "The cas has no appointments" });
        }
        const appList=[]
        appsnapshot.forEach((doc)=> {
           let docdata = doc.data(); 
          
            const newdoc={
                id : doc.id ,
                carId : docdata.carId,
                userId : docdata.userId,
                chargerPortId : docdata.chargerPortId,
                date : docdata.date,
                time : docdata.time,
                price : docdata.price,
                paymentType : docdata.paymentType,
                status : docdata.status,
                createdAt: docdata.createdAt,
                updated: docdata.updated
            }
            appList.push(newdoc)

        })
        return res.status(200).json(appList)

        
    }
    catch(e){
        console.log("The Error Is:", e);
        return res.status(500).json({"message":"Error getting appointment from database"})
    }
    }
    else{
        res.status(400).json({"message":"Missing required fields"});

    }
})


/*
Functions declarations

200 OK: The request was successful.
201 Created: The request has been fulfilled and a new resource has been created.
204 No Content: The server successfully processed the request and is not returning any content.
400 Bad Request: The server cannot or will not process the request due to an apparent client error (e.g., malformed request syntax, size too large, invalid request message framing).
401 Unauthorized: The request has not been applied because it lacks valid authentication credentials for the target resource.
403 Forbidden: The server understood the request but refuses to authorize it.
404 Not Found: The requested resource could not be found but may be available in the future.
405 Method Not Allowed: The request method is known by the server but has been disabled and cannot be used.
500 Internal Server Error: A generic error message, given when an unexpected condition was encountered and no more specific message is suitable.
*/


async function checkIfCarHaveMoreThen10ActiveAppointmentInTheNext7Days(carId, date, res) {
    try {
        let next7Days = new Date(date);
        
        next7Days.setDate(next7Days.getDate() + 7); 
        next7Days=formatDate(next7Days)
 
        const appointmentsSnapshot =await db.collection("Appointments")
            .where("carId", "==", carId)
            //.where("date",">=",date)
            //.where("date","<",next7Days)
            .where("status","==", "Scheduled")
            .get()

            let appList=[]
            
            appointmentsSnapshot.forEach(app=>{
                const x=app.data()

                if(x.date>=date && x.date<next7Days){
                    appList.push(x)
                }
            })
      
        return (appList.length>9)
    } catch (error) {
        return res.status(500).json({ message: "Error checking the 10 appointments of this car" });
    }
}


async function checkIfUserHaveMoreThen10ActiveAppointmentInTheNext7Days(userId, date, res) {
    try {
        let next7Days = new Date(date);
        
        next7Days.setDate(next7Days.getDate() + 7);
        next7Days=formatDate(next7Days)
 
        const appointmentsSnapshot =await db.collection("Appointments")
            .where("userId", "==", userId)
            //.where("date",">=",date)
            //.where("date","<",next7Days)
            .where("status","==", "Scheduled")
            .get()

            let appList=[]
            
            appointmentsSnapshot.forEach(app=>{
                const x=app.data()

                if(x.date>=date && x.date<next7Days){
                    appList.push(x)
                }
            })
      
        return (appList.length>9)
    } catch (error) {
        return res.status(500).json({ message: "Error checking the 10 appointments of this user" });
    }
}


async function checkIfUserHaveMoreThen2AppointmentFiDateHaki(userID,date,res){
    try{
        
        const appointmentsnap=await db.collection("Appointments").where("userId","==",userID).where("date","==",date).get()
            return (appointmentsnap.size>1)
    
        }
        catch{
            return res.status(500).json({"message":"you already reach daily appointemnt maximum number,re-try tomorow! "})

        }
}

async function checkIfThereIsAppointmentWithTheSameTimeAndSameDate(date,time,res){
    try{
    const appointmentsnap=await db.collection("Appointments")
    .where("date","==",date)
    .where("time","==",time)
    .get()

    return !appointmentsnap.empty
    }
    catch{
        return res.status(500).json({"message":"error checking date + time  from database"})
    }

}


async function checkIfChargerStatusIsONBychargerId(chargerId,res)
{
    try{
        
    const snapcharger= await db.collection("Chargers").doc(chargerId).get()
  
    const chargerData=snapcharger.data()

        return !chargerData.status

    }
    catch{
        return res.status(500).json({"message":"error checking charger status from database"})
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
                res.status(500).json({message:"Error updating the value"})
            });
        }

    })
    .catch((error)=>{
        res.status(500).json({ "error": 'Error getting the LastDataBaseUpdate',error });
    })

})

function formatDate(date) {
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return (`${year}-${month}-${day}`).toString();
}



async function callLastDataBaseUpdate() {
        try {
            const URL=`${process.env.DOMAIN}api/v1/LastDataBaseUpdate`
            axios.post(URL)
        } catch (error) {
            console.error('Error calling LastDataBaseUpdate:', error);
        }
    }



module.exports=router;


