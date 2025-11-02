

export default class Item{
    private _itemId: string;
    private _itemName: string;
    private _itemDescription: string;
    private _itemPrice: number = 0;
    private _itemImage: string | null = null;
    private _itemStatus: string;

    constructor(itemId: string, itemName: string, itemDescription: string, itemPrice: number, itemImage: string | null, itemStatus: string) {
        this._itemId = itemId;
        this._itemName = itemName;
        this._itemDescription = itemDescription;
        this._itemPrice = itemPrice;
        this._itemImage = itemImage;
        this._itemStatus = itemStatus;
    }

    // Getters
    get itemId(): string {
        return this._itemId;
    }

    get itemName(): string {
        return this._itemName;
    }

    get itemDescription(): string {
        return this._itemDescription;
    }

    get itemPrice(): number {
        return this._itemPrice;
    }

    // Setters
    set itemId(value: string) {
        this._itemId = value;
    }

    set itemName(value: string) {
        this._itemName = value;
    }

    set itemDescription(value: string) {
        this._itemDescription = value;
    }

    set itemPrice(value: number) {
        this._itemPrice = value;
    }

    // Member methods
    public updateItemDetails(itemName: string, itemDescription: string, itemPrice: number, itemImage: string | null, itemStatus: string): void {
        this._itemName = itemName;
        this._itemDescription = itemDescription;
        this._itemPrice = itemPrice;
        this._itemImage = itemImage;
        this._itemStatus = itemStatus;
    }

    isAvailable(): boolean {
        return this._itemStatus === "available";
    }

    isLent(): boolean {
        return this._itemStatus === "lent";
    }

    isDonated(): boolean {
        return this._itemStatus === "donated";
    }

    isSold(): boolean {
        return this._itemStatus === "sold";
    }
}
