
const { initializeApp,cert } =require('firebase-admin/app');
const { getFirestore } =require( 'firebase-admin/firestore');
const serviceAccount=require('./credentials.json')
const admin = require('firebase-admin'); 
const { getAuth } = require('firebase-admin/auth');


admin.initializeApp({
    credential:admin.credential.cert(serviceAccount)
})
const db=admin.firestore()
const auth=admin.auth()

console.log("DataBase and Firebase Auth Connected")


module.exports={db,auth}
