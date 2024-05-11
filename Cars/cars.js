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
const { onLog } = require("firebase/app");




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

////////////////    classssssssssssssss \\\\\\\\\\\\\
class Car {
    constructor(chassisNumber,panelNumber, carRegistrationDoc, carModel, color, batteryCapacity, createdAt, updatedAt) {
        if (typeof updatedAt === 'undefined') {
            // Constructor without chassisNumber
            this.panelNumber = chassisNumber;
            this.carRegistrationDoc = panelNumber;
            this.carModel = carRegistrationDoc;
            this.color = carModel;
            this.batteryCapacity = color;
            this.createdAt = batteryCapacity;
            this.updatedAt = createdAt;
        } else {
            // Constructor with chassisNumber
            this.chassisNumber=chassisNumber
            this.panelNumber = panelNumber;
            this.carRegistrationDoc = carRegistrationDoc;
            this.carModel = carModel;
            this.color = color;
            this.batteryCapacity = batteryCapacity;
            this.createdAt = createdAt;
            this.updatedAt = updatedAt;
        }
    }
}



router.post(`${apiHandler.registerCar}`, async (req, res) => {

    const carData = req.body.car;
    const userId = req.body.userId;
    const chassisNumber = carData.chassisNumber;
    const panelNumber = carData.panelNumber;
    const carRegistrationDoc = carData.carRegistrationDoc;
    const carModel = carData.carModel;
    const color = carData.color;
    const batteryCapacity = carData.batteryCapacity;

    if (errorCheck([chassisNumber, panelNumber, carModel, carRegistrationDoc, color, batteryCapacity])) {
        try {
            const userDoc = await db.collection("Users").doc(userId).get();
            if (!userDoc.exists) {
                return res.status(401).json({ "message": "User Not Found" });
            }

            const userData = userDoc.data();
            const listOfCars = userData.listOfCars || [];

            if (listOfCars.some(car => car.chassisNumber === chassisNumber)) {
                return res.status(409).json({ "message": "The car is already in the user's listOfCars" });
            }

            const now = getCurrentTime();
            const newCar = {
                chassisNumber: chassisNumber,
                panelNumber: panelNumber,
                carRegistrationDoc: carRegistrationDoc,
                carModelId: carModel,
                color: color,
                batteryCapacity: batteryCapacity,
                createdAt: now,
                updatedAt: now
            };

            await db.collection("Cars").doc(chassisNumber).set(newCar);
            callLastDataBaseUpdate()
            listOfCars.push(newCar);
            await db.collection("Users").doc(userId).update({ listOfCars: listOfCars });
            callLastDataBaseUpdate()
            return res.status(200).json(createResponseModel("Car added successfully to the listOfCars of the user",userId,"200000",false));
        } catch (error) {
            console.error('Error registering car:', error);
            res.status(500).json({ "message": "Error registering car" });
        }
    } else {
        res.status(400).json({ "message": "Null values detected" });
    }
});




router.get(`${apiHandler.getCarById}`,async(req,res)=>{

    const carId=req.params.carId

    if(errorCheck([carId])){
        //all good
        //check if there is another car with the same chassiNumber
       await db.collection("Cars").doc(carId).get()
        .then(async(car)=>{
            if(!car.exists){
                //car already exists
                res.status(409).send({"message":"No car with this carId."})
            }
            else{
                const carData = car.data();
                const newCar = new Car(
                    carId,
                    carData.panelNumber,
                    carData.carRegistrationDoc,
                    carData.carModel,
                    carData.color,
                    carData.batteryCapacity,
                    carData.createdAt,
                    carData.updatedAt
                );
              
                    res.status(200).json(newCar)
            }

        })
        .catch((e)=>{
            res.status(500).json({"message":"Error getting info from Database"})
        })


    }

    else{
        //There are some null values
        res.status(400).json({"message":"null values detected"})

    }
})


router.get(`${apiHandler.getCarsForUserById}`, async (req, res) => {
    const userId = req.params.userId;
    
    if (!userId) {
        return res.status(400).json({ "message": "User ID is required" });
    }

    try {
        const user = await db.collection("Users").doc(userId).get();
        if (!user.exists) {
            return res.status(400).json({ "message": "No user with this userId." });
        } else {
            const carsList = user.data().listOfCars;
            const promises = carsList.map(async (carId) => {
                try {
                    const carsnap = await db.collection('Cars').doc(carId).get();
                    if (carsnap.exists) {
                        const newCar = {
                            id: carsnap.id,
                            ...carsnap.data()
                        };
                        return newCar;
                    }
                } catch (err) {
                    console.log(err);
                    throw new Error("Error getting cars from Database");
                }
            });
            const finalCarList = await Promise.all(promises);
            return res.status(200).json(finalCarList.filter(car => car)); // Filter out any undefined values
        }
    } catch (error) {
        console.error("Error getting user information:", error);
        return res.status(500).json({ "message": "Error getting info from Database" });
    }
});

//delete car for user deleteCarForUser(carId,accountId)
router.post(`${apiHandler.deleteCarForUser}`, async (req, res) => {
    const carId = req.params.carId;
    const userId = req.params.userId;

    if (!errorCheck([carId, userId])) {
        return res.status(400).json({ "message": "Both Account ID and Car ID are required" });
    }

    try {
        const userRef = db.collection("Users").doc(userId);
        const userSnapshot = await userRef.get();

        if (!userSnapshot.exists) {
            return res.status(404).json({ "message": "No user with this userId." });
        }

        const userData = userSnapshot.data();
        const carsList = userData.listOfCars || [];

        const index = carsList.findIndex(car => car.chassisNumber === carId);
        if (index !== -1) {
            carsList.splice(index, 1);

            await userRef.update({ listOfCars: carsList });
            callLastDataBaseUpdate();
            return res.status(200).json(createResponseModel("Car deleted from this user's listOfCars","","200000",false));

        } else {
            return res.status(404).json({ "message": "This user doesn't have this car" });
        }
    } catch (error) {
        console.error("Error deleting car:", error);
        return res.status(500).json({ "message": "Error deleting the car from the listOfCars" });
    }
});

////////////car Model
class CarModel {
    constructor(id, modelName, modelYear, carBrand,image, createdAt, updatedAt) {
        this.id = id;
        this.modelName = modelName;
        this.modelYear = modelYear;
        this.carBrand = carBrand;
        this.image=image,
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

router.get(`${apiHandler.getAllCarModels}`, async (req, res) => {

    try {
    const snapshot= await db.collection("CarModels").get()
        if(!snapshot.empty){
        const carModels=[];
        snapshot.forEach((carModel)=>{
            const data=carModel.data()
            const newcarmodel=new CarModel(
                carModel.id,
                data.modelName,
                data.modelYear,
                data.carBrand,
                data.image,
                data.createdAt,
                data.updatedAt
            )
            carModels.push(newcarmodel)
        })
        res.status(200).json(carModels);

        }
        else{
            res.status(404).json({"message":"There is no CarModels"})
        }

    }
    catch{
        res.status(500).json({"message":"Error getting info from DataBase"})
}

});


////////////      carBrands  \\\\\\\\

router.get(`${apiHandler.getAllCarBrands}`, async (req, res) => {
    try {
        const snapshot = await db.collection("CarBrands").get();
        if (!snapshot.empty) {
            const carBrands = [];
            snapshot.forEach((carBrand) => {
                const data = carBrand.data(); 
                const newCarBrand = {
                    id: carBrand.id, 
                    Name: data.Name,
                    logo: data.logo,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt
                };
                carBrands.push(newCarBrand);
            });
            res.status(200).json(carBrands);
        } else {
            res.status(404).json({ "message": "There are no car brands" });
        }
    } catch (error) {
        console.error("Error getting car brands:", error);
        res.status(500).json({ "message": "Error getting car brands from the database" });
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



module.exports=router;









