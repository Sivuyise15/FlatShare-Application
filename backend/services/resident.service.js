// backend/services/ResidentService.js
{/* ResidentService.js
  This service handles resident registration.
  It integrates with Firebase Authentication for user creation
  and Firestore for storing resident details.
  The Resident entity ensures data validation before storage.
  */}
const { auth, db } = require("../firebase");
const Resident = require("../entities/Resident");

class ResidentService {
  // Register a new resident
  async registerResident({ name, surname, email, password, community, flatNumber }) {
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({ email, password });

    // Build entity
    const resident = new Resident(name, surname, email, community, flatNumber);

    // Store in Firestore
    const ref = db
      .collection("users")
      .doc("residents")
      .collection("communities")
      .doc(community)
      .collection("details")
      .doc(userRecord.uid);

    await ref.set(resident.toFirestore());

    return { uid: userRecord.uid, ...resident.toFirestore() };
  }

  // Check if user is approved by admin
  async checkUserApproval({ email, community }) {
    try {
      // Check in the admin-managed users (assuming they're stored with status)
      const userSnapshot = await db
        .collection("users")
        .doc("residents") 
        .collection("communities")
        .doc(community)
        .collection("details")
        .where('email', '==', email)
        .get();

      if (userSnapshot.empty) {
        return {
          approved: false,
          status: 'not_found',
          message: 'USER_NOT_FOUND: Please contact your building admin to be added to the system'
        };
      }

      const userData = userSnapshot.docs[0].data();
      
      if (userData.status !== 'active') {
        return {
          approved: false,
          status: userData.status,
          message: userData.status === 'pending' 
            ? 'USER_NOT_APPROVED: Your account is still pending admin approval'
            : 'USER_NOT_APPROVED: Your account application was not approved'
        };
      }

      return {
        approved: true,
        status: 'active',
        message: 'User approved for signup',
        userData: userData
      };

    } catch (error) {
      throw new Error(`Error checking user approval: ${error.message}`);
    }
  }
}

module.exports = ResidentService;
