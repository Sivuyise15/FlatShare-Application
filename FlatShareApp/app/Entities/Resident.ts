import Person from './Person';

export default class Resident extends Person{
    private _flatNumber: string;
    private _role: string;
    private _communityName: string;

    constructor(name: string, surname: string, email: string, communityName: string, flatNumber: string, role: string) {
        super(name, surname, email);
        this._flatNumber = flatNumber;
        this._role = role;
        this._communityName = communityName;
    }

    // Getters and Setters
    get communityName(): string {
        return this._communityName;
    }
    set communityName(value: string) {
        this._communityName = value;
    }
    get role(): string {
        return this._role;
    }
    set role(value: string) {
        this._role = value;
    }
    get flatNumber(): string {
        return this._flatNumber;
    }

    set flatNumber(value: string) {
        this._flatNumber = value;
    }

    // Member methods

    public updateResidentDetails(name: string, surname: string, email: string, flatNumber: string, role: string): void {
        this.name = name;
        this.surname = surname;
        this.email = email;
        this._flatNumber = flatNumber;
        this._role = role;
    }

    findIndexById(id: string): number {
        return this._role === id ? 0 : -1;
    }
}