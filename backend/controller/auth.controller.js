// backend/controllers/auth.controller.js
{/* This file handles user authentication using Firebase Authentication and Firestore. 
  It verifies user credentials, determines their role (admin or resident),
  and retrieves associated community information.
  It 
  */}
const axios = require("axios");
const { db } = require('../firebase');

const FIREBASE_API_KEY = "API KEY HERE";

exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt for:", email);
  console.log("Received body:", req.body);

  try {
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        email,
        password,
        returnSecureToken: true,
      }
    );

    const data = response.data;
    const uid = data.localId;

    let role = null;
    let communityName = null;

    // Check admins
    const adminDoc = await db.doc(`users/admins/details/${uid}`).get();
    if (adminDoc.exists) {
      role = "admin";
      const adminData = adminDoc.data();
      communityName = adminData?.communityName || null;

      console.log("Admin login detected for UID:", uid, "Community:", communityName);
    } else {
      // Check residents - it comes with cost since we have to loop through communities, but well take it
      const communitiesSnap = await db.collection('users').doc('residents').collection('communities').listDocuments();

      for (const communityDoc of communitiesSnap) {
        communityName = communityDoc.id;

        const residentDoc = await db
          .doc(`users/residents/communities/${communityName}/details/${uid}`)
          .get();

        if (residentDoc.exists) {
          console.log("User is a resident in community:", communityName);
          role = "resident";
          break; // Stop once found
        }
      }
    }

    // If role is still null, user not found in either collection
    if (!role) {
      return res.status(404).json({ error: "User role not found in Firestore" });
    }
    
    console.log("Community Name:", communityName);
    // Respond with user details and role
    res.json({
      uid: data.localId,
      email: data.email,
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
      role,
      communityName,
    });
  } catch (error) {
    res.status(401).json({
      error: error.response?.data?.error?.message || "Invalid login",
    });
  }
};


