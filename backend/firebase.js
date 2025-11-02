// backend/firebase.js
{/* This file initialize Firebase Admin SDK
  It serves 
  as a centralized module to manage Firebase services
  /* such as Firestore, Authentication, messaging and Storage. 
  */}

const admin = require('firebase-admin');
const serviceAccount = require('./firebaseAdminConfig.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://flatshare-app-849d9.firebasestorage.app"
});

// Initialize services
const db = admin.firestore();
const bucket = admin.storage().bucket();
const auth = admin.auth();
const messaging = admin.messaging();

// Configured to ignore undefined values
db.settings({ ignoreUndefinedProperties: true });

console.log("Firebase initialized successfully");
console.log("Storage bucket name:", bucket.name);

module.exports = { admin, db, auth, bucket, messaging };
