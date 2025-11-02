import Resident from './Resident';

export default class {
    private _flatNumber: Int32Array;
    private _residents: Array<Resident>;
    private _blockNumber: Int32Array;

    constructor(flatNumber: Int32Array, residents: Array<Resident>, blockNumber: Int32Array) {
        this._flatNumber = flatNumber;
        this._residents = residents;
        this._blockNumber = blockNumber;
    }

    //getters
    get flatNumber(): Int32Array {
        return this._flatNumber;
    }

    get residents(): Array<Resident> {
        return this._residents;
    }

    get blockNumber(): Int32Array {
        return this._blockNumber;
    }

    // setters
    set flatNumber(value: Int32Array) {
        this._flatNumber = value;
    }

    set residents(value: Array<Resident>) {
        this._residents = value;
    }

    set blockNumber(value: Int32Array) {
        this._blockNumber = value;
    }
}