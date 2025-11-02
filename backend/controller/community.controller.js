// backend/controllers/communityController.js
{/* This files contains the controller logic for registering a new community along with its admin user.
  It uses Firebase Firestore for database interactions.
  It handles the creation of both the community and the admin user in a single request.
  Error handling is included to manage potential issues during the registration process.
  */}
const { db, auth } = require('../firebase');

// Register a new community along with its admin user
const registerCommunity = async (req, res) => {
  const { 
    communityName, streetNumber, streetName, state, city, zip, flats,
    adminName, adminEmail, adminPhone, adminPassword, notes
  } = req.body;

  try {
    // Create admin user in Firebase Auth
    const userRecord = await auth.createUser({
      email: adminEmail,
      password: adminPassword,
      displayName: adminName,
      phoneNumber: adminPhone,
    });

    // Save admin data
    await db.collection('users')
      .doc('admins')
      .collection('details')
      .doc(userRecord.uid)
      .set({
        communityName,
        streetNumber,
        streetName,
        zip,
        flats,
        adminName,
        adminEmail,
        adminPhone,
        notes,
        role: 'admin',
        createdAt: new Date().toISOString(),
      });

    // Save community data
    await db.collection('communities').doc(communityName).set({
      communityName,
      streetNumber,
      streetName,
      state,
      city,
      zip,
      units: flats,
    });

    res.status(201).json({ message: 'Community registered successfully' });
  } catch (error) {
    console.error('Error registering community:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { registerCommunity };

