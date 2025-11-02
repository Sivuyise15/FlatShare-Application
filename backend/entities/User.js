// backend/Entities/user.js
{/* User entity representing a user in the system */}
class User {
    constructor(name, surname, email, role) {
        this.name = name;
        this.surname = surname;
        this.email = email;
        this.role = role;
        this.createdAt = new Date();
        this.status = "pending";
        this.bio = null;
        this.profileImage = null;
        this.lastActivity = null;

        {/* for admin tracking */}
        this.approvedBy = null;
        this.approvedAt = null;
        this.suspendedBy = null;
        this.suspendedAt = null;
        this.suspensionReason = null;
        this.suspensionEnd = null;
    }
}

module.exports = User;