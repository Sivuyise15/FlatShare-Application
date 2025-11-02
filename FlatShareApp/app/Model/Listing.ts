import { auth, storage } from '@/lib/firebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import Item from "../Entities/Item";

export default class Listing {
    private _items: Item;
    private _imageUrl?: string;

    constructor(items: Item) {
        this._items = items;
    }

    get items(): Item {
        return this._items;
    }

    set items(value: Item) {
        this._items = value;
    }

    setImage(downloadURL: string) {
            this._imageUrl = downloadURL;
    }

    getImage(): string | undefined {
        return this._imageUrl;
    }

    // Member methods

    handleAddPhoto = async () => {
        try {
            // Get current user ID
            const userId = auth.currentUser?.uid;
            if (!userId) {
            console.log("No user logged in.");
            return;
            }

            console.log("User ID:", userId);

            // Ask for media library permissions
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
            alert("Permission to access gallery is required!");
            return;
            }

            // Open image picker
            const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
            });

            if (result.canceled) {
            console.log("Image selection canceled");
            return;
            }

            const uri = result.assets[0].uri;

            // Convert image to blob
            const response = await fetch(uri);
            const blob = await response.blob();

            // Create a storage reference in user's folder
            const storageRef = ref(storage, `users/residents/listings/${userId}/${Date.now()}.jpg`);

            // Upload file
            await uploadBytes(storageRef, blob);

            // Get download URL
            const downloadURL = await getDownloadURL(storageRef);
            console.log("File uploaded successfully, available at:", downloadURL);

            // Optionally: update user's profile in Firestore or Firebase Auth
            this.setImage(downloadURL);
            return downloadURL;

        } catch (error) {
            console.error("Error uploading image:", error);
        }
    };

    
}
