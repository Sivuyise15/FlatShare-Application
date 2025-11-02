
export default class Person {
    private _name: string;
    private _surname: string;
    private _email: string;

    constructor(name: string, surname: string, email: string) {
        this._name = name;
        this._email = email;
        this._surname = surname;

    }

    // Getters
    get name(): string {
        return this._name;
    }

    get surname(): string {
        return this._surname;
    }

    get email(): string {
        return this._email;
    }
    // Setters
    set name(value: string) {
        this._name = value;
    }

    set surname(value: string) {
        this._surname = value;
    }

    set email(value: string) {
        this._email = value;
    }

}