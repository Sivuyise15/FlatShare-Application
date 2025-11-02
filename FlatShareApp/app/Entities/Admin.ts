export default class Admin {
    private _adminId: string;

    constructor(adminId: string) {
        this._adminId = adminId;
    }

    //Getters and Setters

    get adminId(): string {
        return this._adminId;
    }

    set adminId(value: string) {
        this._adminId = value;
    }
}
