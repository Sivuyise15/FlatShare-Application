import Item from './Item';

export default class Post {
    private _postId: string;
    private _title: string;
    private _description: string;
    private _authorId: string;
    private _createdAt: Date;
    private _item: Item;

    constructor(postId: string, title: string, description: string, authorId: string, item: Item) {
        this._postId = postId;
        this._title = title;
        this._description = description;
        this._authorId = authorId;
        this._createdAt = new Date();
        this._item = item;
    }
 
}    