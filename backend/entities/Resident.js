{/* Resident.js 
    This class extends the User class to represent a resident in a community.
    It includes methods for managing resident status, profile updates, and
    serialization for Firestore and JSON formats.
    **/}

const User  = require('./User');

class Resident extends User {
    constructor(name, surname, email, community, flatNumber, status = "pending") {
        super(name, surname, email, "resident");
        this.community = community;
        this.flatNumber = flatNumber;
        this.status = status;
        this.createdAt = new Date();
    }

    // Method to approve a resident
    approve(adminId) {
        this.status = "active";
        this.approvedBy = adminId;
        this.approvedAt = new Date();
        return this;
    }

    // Method to suspend a resident
    suspend(adminId, reason = "Violation of community guidelines", durationDays = 7) {
        this.status = "suspended";
        this.suspendedBy = adminId;
        this.suspendedAt = new Date();
        this.suspensionReason = reason;
        this.suspensionEnd = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
        return this;
    }

    // Method to unsuspend a resident
    unsuspend(adminId) {
        this.status = "active";
        this.unsuspendedBy = adminId;
        this.unsuspendedAt = new Date();
        this.suspensionReason = null;
        this.suspensionEnd = null;
        return this;
    }

    // Update profile method
    updateProfile(profileData) {
        if (profileData.profileImage !== undefined) this.profileImage = profileData.profileImage;
        if (profileData.bio !== undefined) this.bio = profileData.bio;
        if (profileData.name !== undefined) this.name = profileData.name;
        if (profileData.surname !== undefined) this.surname = profileData.surname;
        this.lastActivity = new Date();
        return this;
    }

    // Method to convert resident data to a format suitable for Firestore
    toFirestore() {
        const data = {
            name: this.name,
            surname: this.surname,
            email: this.email,
            community: this.community,
            flatNumber: this.flatNumber,
            role: this.role,
            status: this.status,
            createdAt: this.createdAt,
        };

        // Only add non-null/undefined fields to avoid Firestore errors
        if (this.profileImage !== null && this.profileImage !== undefined) {
            data.profileImage = this.profileImage;
        }
        if (this.bio !== null && this.bio !== undefined) {
            data.bio = this.bio;
        }
        if (this.lastActivity !== null && this.lastActivity !== undefined) {
            data.lastActivity = this.lastActivity;
        }
        
        // Admin tracking fields - only add if they have values
        if (this.approvedBy) data.approvedBy = this.approvedBy;
        if (this.approvedAt) data.approvedAt = this.approvedAt;
        if (this.suspendedBy) data.suspendedBy = this.suspendedBy;
        if (this.suspendedAt) data.suspendedAt = this.suspendedAt;
        if (this.suspensionReason) data.suspensionReason = this.suspensionReason;
        if (this.suspensionEnd) data.suspensionEnd = this.suspensionEnd;
        if (this.unsuspendedBy) data.unsuspendedBy = this.unsuspendedBy;
        if (this.unsuspendedAt) data.unsuspendedAt = this.unsuspendedAt;

        return data;
    }

    // STATIC method to create resident from Firestore document
    static fromFirestore(doc) {
        const data = doc.data();
        const resident = new Resident(
            data.name,
            data.surname, 
            data.email,
            data.community,
            data.flatNumber,
            data.status || 'pending'
        );

        // Set additional properties
        resident.id = doc.id;
        resident.createdAt = data.createdAt?.toDate?.() || data.createdAt || new Date();
        resident.profileImage = data.profileImage || null;
        resident.bio = data.bio || null;
        resident.lastActivity = data.lastActivity?.toDate?.() || data.lastActivity;
        
        // Admin tracking
        resident.approvedBy = data.approvedBy || null;
        resident.approvedAt = data.approvedAt?.toDate?.() || data.approvedAt;
        resident.suspendedBy = data.suspendedBy || null;
        resident.suspendedAt = data.suspendedAt?.toDate?.() || data.suspendedAt;
        resident.suspensionReason = data.suspensionReason || null;
        resident.suspensionEnd = data.suspensionEnd?.toDate?.() || data.suspensionEnd;
        resident.unsuspendedBy = data.unsuspendedBy || null;
        resident.unsuspendedAt = data.unsuspendedAt?.toDate?.() || data.unsuspendedAt;

        return resident;
    }

    // To JSON method
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            surname: this.surname,
            email: this.email,
            community: this.community,
            flatNumber: this.flatNumber,
            role: this.role,
            status: this.status,
            createdAt: this.createdAt,
            profileImage: this.profileImage,
            bio: this.bio,
            lastActivity: this.lastActivity,
            approvedBy: this.approvedBy,
            approvedAt: this.approvedAt,
            suspendedBy: this.suspendedBy,
            suspendedAt: this.suspendedAt,
            suspensionReason: this.suspensionReason,
            suspensionEnd: this.suspensionEnd,
            unsuspendedBy: this.unsuspendedBy,
            unsuspendedAt: this.unsuspendedAt
        };
    }
}

module.exports = Resident;