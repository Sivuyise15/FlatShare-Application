import Admin from "../Entities/Admin";
import Resident from "../Entities/Resident";

enum UserRole {
    ADMIN = "admin",
    RESIDENT = "resident"
}

export default class User {
    private _username: string;
    private _password: string;
    private _role: UserRole;
    private _isLoggedIn: boolean = false;
    private _residents: Resident[] = [];
    private _admins: Admin[] = [];


    constructor(username: string, password: string, role: UserRole) {
        this._username = username;
        this._password = password;
        this._role = role;
    }

    // Getters & Setters

    public getUsername(): string {
        return this._username;
    }

    public setUsername(username: string): void {
        this._username = username;
    }

    public getPassword(): string {
        return this._password;
    }

    public setPassword(password: string): void {
        this._password = password;
    }

    // Member Methods
    public addResident(resident: Resident): void {
        this._residents.push(resident);
    }

    public getResidents(): Resident[] {
        return this._residents;
    }

    public addAdmin(admin: Admin): void {
        this._admins.push(admin);
    }

    public removeAdmin(admin: Admin): void {
        this._admins = this._admins.filter(a => a !== admin);
    }

    public getAdmins(): Admin[] {
        return this._admins;
    }

    removeResident(id: string): boolean {
        const index = this._residents.findIndex(r => r.id === id);
        if (index !== -1) {
            this._residents.splice(index, 1);
            return true;
        }
        return false;
    }


    findUserByEmail(email: string): Resident | Admin | undefined {
        return (
            this._residents.find(r => r.email === email) ||
            this._admins.find(a => a.email === email)
        );
    }
}