
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

/*const firebaseConfig = {
  apiKey: "AIzaSyB9VJsfiMuBmixI4nflg4V9QeAt-635-JI",
  authDomain: "ijachargi.firebaseapp.com",
  projectId: "ijachargi",
  storageBucket: "ijachargi.appspot.com",
  messagingSenderId: "463962922296",
  appId: "1:463962922296:web:1353229966349de4e4b5cd",
  measurementId: "G-QEPBYL09XG"
};
*/