const express = require("express");
const bp=require("body-parser");
const bc=require("bcrypt");
const router=express.Router();
const admin = require('firebase-admin');
const {db}=require('../firebase.js');
const { collection, deleteDoc } = require("firebase/firestore");
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
        if(snapshot.size===0){
            return 0
        }
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


const stationBrands=db.collection("stationBrands")


router.post("/api/v1/station-brand/createStationBrand",async(req,res)=>{

    let name=req.body.name

    if(errorCheck([name])){
        //No null values

        const now =getCurrentTime()
        const lastId=await getIndexOfLastElement("stationBrands")
        if(lastId===-1){
            //Id not an Int
            res.status(422).send({"message":"The last Station Brand Id is not an Integer"})
        }else{
            //last id is an int
           
            const newId=lastId+1

            stationBrands
               .doc(String(newId))
               .set({
                   name: name,
                   createdAt: now,
                   updatedAt: now
               })
               .then(() => {
                callLastDataBaseUpdate();
                   console.log('Document added with ID:', newId);
                   res.status(200).json(createResponseModel("Successfully added new station brand","",[],{},"200",false));
               })
               .catch(error => {
                   console.error('Error adding document:', error);
                   res.status(500).json({ "message": 'Error adding Brand Station in database' });
               });
       } 
        }
       

    else{
        //Null values
        res.status(400).json({"message":"null value detected"})
    }

})

class StationBrand {
    constructor(id, name, createdAt, updatedAt) {
        this.id = id;
        this.name = name;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
class Provider {
    constructor(id, name, email, phone, brand, createdAt, updatedAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.brand = brand;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
class Station {
    constructor(id, latitude, longitude, name, address, serviceList, providerId, logo, phone, image, createdAt, updatedAt) {
        this.id = id;
        this.latitude = latitude;
        this.longitude = longitude;
        this.name = name;
        this.address = address;
        this.serviceList = serviceList;
        this.providerId = providerId;
        this.logo = logo;
        this.phone = phone;
        this.image = image;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

router.get(`${apiHandler.getAllStationBrand}`,async(req,res)=>{

    try {
        const snapshot = await stationBrands.get();
        const stationBrandsData = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const stationBrand = new StationBrand(
                doc.id,
                data.name,
                data.createdAt,
                data.updatedAt
            );
            stationBrandsData.push(stationBrand);
        });
        res.status(200).json(stationBrandsData);
    } catch (error) {
        console.error('Error getting all station brands:', error);
        res.status(500).json({ "error": 'Error getting all station brands from the database' });
    }
});

//////////////////// PRRRRRROVIIIIIDERRRRRSSSSSSSSSSSSSSSSS \\\\\\\\\\\\\\\\


router.get(`${apiHandler.getAllProviders}`,async(req,res)=>{

    try {
        const snapshot = await db.collection("Providers").get();
        const providersData = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const provider = new Provider(
                doc.id,
                data.name,
                data.email,
                data.phone,
                data.stationBrand,
                data.createdAt,
                data.updatedAt
            );
            providersData.push(provider);
        });
        res.status(200).json(providersData);
    } catch (error) {
        res.status(500).json({ "error": 'Error getting all providers from the database' });
    }
});

ter.get(`${apiHandler.getProviderById}`,async (req,res)=>{
    const id= req.params.providerId

    if(errorCheck([id])){
        //no null values
        const providers=db.collection("Providers").doc(id)
        await providers.get()
        .then((provider)=>{
            if(!provider.exists){
                return res.status(404).json({"message":'No provider found'})
            }else{      
                let data=provider.data()
                res.status(200).json(data)
        }
    })
    .catch((e)=>{
        res.status(500).json({"message":"Error getting  provider by ID from the database"})
    })

    }
    else{
        return res.status(400).json({message:'Missing required fields'});

    }

})
//////////// STAAATIIIIIONNNNNN \\\\\\\\\

router.get(`${apiHandler.getAllStations}`,async(req,res)=>{

    try {
        const snapshot = await db.collection("Stations").get();
        const stationsData = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const stationInstance = new Station(
                doc.id,
                data.latitude,
                data.longitude,
                data.name,
                data.address,
                data.serviceList,
                data.providerId,
                data.logo,
                data.phone,
                data.image,
                data.createdAt,
                data.updatedAt
            );
            stationsData.push(stationInstance);
        });
        res.status(200).json(stationsData);
    } catch (error) {
        res.status(500).json({ "error": 'Error getting all stations from the database' });
    }
});



/*//////////Station Brad \\\\\\\\\\\
public class charger {
    Integer id;
    String name;
    Integer stationId;
    Boolean Status;
    String createdAt;
    String updatedAt;
}*/

router.get(`${apiHandler.getAllChargerForStation}`,async (req,res)=>{

    const stationId=req.params.stationId
    if(errorCheck([stationId])){
        try {
            const snapshot1 = await db.collection("Stations").doc(stationId).get();
            if(!snapshot1.exists){
                //Station with the given ID
                res.status(404).json({"message":'No such station exists'}) 
            } 
            else{
                //the station exists
                try {
                    const snapshot = await db.collection("Chargers").where("stationId", "==", stationId).get();
                    const chargersData = [];
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        chargersData.push({
                            id: doc.id,
                            name: data.name,
                            stationId: data.stationId,
                            Status: data.Status,
                            createdAt: data.createdAt,
                            updatedAt: data.updatedAt
                        });
                    });
                    if(chargersData.length==0){
                        res.status(200).json({"message":"This Station does not have any charger"})

                    }else{
                    res.status(200).json(chargersData);
                    }
                } catch (error) {
                    res.status(500).json({"message":"Error getting chargers by stationId:"})
                }

        } 
     
    }catch (error) {
        res.status(500).json({"message":"Error getting station from the database"})
    }
}
    else{
        res.status(400).json({"message":"Missing required fields"});
    }

})


router.post(`${apiHandler.createCharger}`,async (req,res)=>{

    const name=req.body.name
    const stationId=req.body.stationId 
    const Status=req.body.Status
    if(errorCheck([name,Status,stationId])){
        try {
            const snapshot1 = await db.collection("Stations").doc(stationId).get();
            if(!snapshot1.exists){
                //Station with the given ID
                res.status(404).json({"message":'No such station exists'}) 
            } 
            else{
                //the station exists
                try {
                    const snapshot = await db.collection("Chargers").where("stationId", "==", stationId).get();
                    if(snapshot.size<4){
                        const snapshot2= await db.collection("Chargers").where("name","==",name).where("stationId", "==", stationId).get()
                        if(snapshot2.size==0){
                            //this charger name doesnt exist with the same stationId
                            const lastindex=await getIndexOfLastElement("Chargers")
                        if(lastindex===-1){
                            //Id not an Int
                           return res.status(422).send({"message":"The last Charger id is not an Integer"})
                        }
                        const now=getCurrentTime()
                        const newCharger={
                            name: name,
                            stationId: stationId,
                            Status: Status,
                            createdAt: now,
                            updatedAt: now
                    }
                    await db.collection("Chargers").doc(String(lastindex+1)).set(newCharger)
                    .then(()=>{
                        callLastDataBaseUpdate()
                       return res.status(200).json(createResponseModel("Charger added sucessfully",String(lastindex+1),200000,false));
                    })
                    .catch(()=>{
                       return res.status(500).json({"message":"Error adding charger to the DB"})

                    })
                        }
                        else{
                            res.status(400).json({message:"this Station has already a charger with the same name"});

                        }
                        
                    }
                    else{
                        res.status(400).json({message:"this Station has already 4 chargers"});

                    }
                   
                
                } catch (error) {
                    res.status(500).json({"message":"Error getting chargers by stationId"})
                }

        } 
     
    }catch (error) {
        res.status(500).json({"message":"Error getting stations from the database"})
    }
}
    else{
        res.status(400).json({message:"Missing values"});
    }

})


router.post(`${apiHandler.deleteCharger}`,async(req,res)=>{
    const chargerId= req.params.chargerId;

    if(errorCheck([chargerId])){
        try{
        const checkCharger=await db.collection("Chargers").doc(chargerId).get()

        if(checkCharger.exists){
           try{
           const chargerportsnap=await db.collection("chargerPort").where("chargerId","==",chargerId).get()
           console.log("Number of charger port documents:", chargerportsnap.size);

           chargerportsnap.forEach(async (doc) => {
            try{
                await doc.ref.delete()
            }
            catch(e){
            return  res.status(500).json({message:"Error deleting chargerPort from the database"})
            }
            
        });
           //chargerPorts deleted , now the charger itself
           await db.collection("Chargers").doc(chargerId).delete()
           .then(()=>{
            callLastDataBaseUpdate()
            return res.status(200).json(createResponseModel("Charger deleted sucessfully","",200000,false));
           })
           .catch(()=>{
            return  res.status(500).json({message:"Error deleting charger from the database"})

           })

        }
        catch(e){
            console.log(e)
           return  res.status(500).json({message:"Error deleting chargerPorts from the database"})

        }
        }
        else{
            res.status(400).json({message:"this Charger does not exist"});

        }
    }
    catch(e){
        console.log(e)
        return res.status(500).json({"message":"Error getting chargers from the database"})

    }

    }
    else{
        return res.status(400).json({message:"Missing values"});

    }



})


/*public class chargerPort {
    Integer id;
    String name;
    String type;
    String chargingSpeed;
    Integer chargerId;
    String createdAt;
    String updatedAt;*/


router.post(`${apiHandler.createChargerPort}`,async (req,res)=>{

    const name=req.body.name
    const chargerId=req.body.chargerId 
    const chargingSpeed=req.body.chargingSpeed
    const type=req.body.type
    if(errorCheck([name,type,chargerId,chargingSpeed])){
        try {         
            const snapshot1 = await db.collection("Chargers").doc(chargerId).get();
            if(!snapshot1.exists){
                //Station with the given ID
                res.status(404).json({"message":'No such charger exists'}) 
            } 
            else{
                //the station exists
                try {
                    const snapshot = await db.collection("chargerPort").where("chargerId", "==", chargerId).get();
                    if(snapshot.size<4){
                        
                        const snapshot2= await db.collection("chargerPort").where("name","==",name).where("chargerId", "==", chargerId).get()
                        if(snapshot2.size==0){
                            //this charger name doesnt exist with the same stationId
                            const lastindex=await getIndexOfLastElement("chargerPort")
                        if(lastindex===-1){
                            //Id not an Int
                           return res.status(422).send({"message":"The last ChargerPort id is not an Integer"})
                        }
                        const now=getCurrentTime()
                        const newChargerPort={
                            name: name,
                            chargerId: chargerId,
                            type: type,
                            chargingSpeed:chargingSpeed,
                            createdAt: now,
                            updatedAt: now
                    }
                    await db.collection("chargerPort").doc(String(lastindex+1)).set(newChargerPort)
                    .then(()=>{
                        callLastDataBaseUpdate()
                        return res.status(200).json(createResponseModel("ChargerPort added sucessfully",String(lastindex+1),200000,false));

                    })
                    .catch(()=>{
                       return res.status(500).json({"message":"Error adding chargerPort to the DB"})

                    })
                        }
                        else{
                            res.status(400).json({message:"this Charger has already a chargerPort with the same name"});

                        }
                        
                    }
                    else{
                        res.status(400).json({message:"this Charger has already 4 chargerPorts"});

                    }
                } catch (error) {
                    res.status(500).json({"message":"Error getting chargerPorts by chargerId"})
                }
        } 
     
    }catch (error) {
        res.status(500).json({message:"Error getting chargers from the database"})
    }
}
    else{
        res.status(400).json({message:"Missing values"});
    }

})


router.post(`${apiHandler.deleteChargerPort}`,async(req,res)=>{
    const chargerPortId= req.params.chargerPortId;

    if(errorCheck([chargerPortId])){
        try{
        const checkCharger=await db.collection("chargerPort").doc(chargerPortId).get()

        if(checkCharger.exists){
           try{
           await db.collection("chargerPort").doc(chargerPortId).delete()
           
            callLastDataBaseUpdate()
            return res.status(200).json(createResponseModel("ChargerPort deleted sucessfully","",200000,false));



        }
        catch(e){
            console.log(e)
           return  res.status(500).json({message:"Error deleting chargerPort from the database"})

        }
        }
        else{
            res.status(400).json({message:"this ChargerPort does not exist"});

        }
    }
    catch(e){
        console.log(e)
        return res.status(500).json({"message":"Error getting chargerPorts from the database"})

    }

    }
    else{
        return res.status(400).json({message:"Missing values"});

    }

})

////////////   Charger Port \\\\\\\\\\\

router.get(`${apiHandler.getAllChargerPortForCharger}`,async (req,res)=>{

    const chargerId=req.params.chargerId
    if(errorCheck([chargerId])){
        try {
            const snapshot1 = await db.collection("Chargers").doc(chargerId).get();
            if(!snapshot1.exists){
                //Charger does not exists 
                res.status(404).json({"message":'No such charger exists'}) 
            } 
            else{
                //the charger exists
                try {
                    const snapshot = await db.collection("chargerPort").where("chargerId", "==", chargerId).get();
                    const chargerPortsData = [];
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        chargerPortsData.push({
                            id: doc.id,
                            name: data.name,
                            type:data.type,
                            chargingSpeed:data.chargingSpeed,
                            chargerId: data.chargerId,
                            Status: data.Status,
                            createdAt: data.createdAt,
                            updatedAt: data.updatedAt
                        });
                    });
                    if(chargerPortsData.length==0){
                        res.status(200).json({"message":"This Charger does not have any chargerPort"})

                    }else{
                    res.status(200).json(chargerPortsData);
                    }
                } catch (error) {
                    res.status(500).json({"message":"Error getting chargersPort by chargerId:"})
                }

        } 
     
    }catch (error) {
        res.status(500).json({"message":"Error getting charger from the database"})
    }
}
    else{
        res.status(400).json({"message":"Missing required fields"});
    }

})




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



module.exports=router;









