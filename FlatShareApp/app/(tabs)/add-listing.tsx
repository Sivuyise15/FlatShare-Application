import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { router } from "expo-router";
import React, { useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Item from '../Entities/Item';
import Post from '../Entities/Post';
import Listing from '../Model/Listing';
import AsyncStorage from '@react-native-async-storage/async-storage';

const categories = [
    { label: 'Furniture', value: 'furniture' },
    { label: 'Electronics', value: 'electronics' },
    { label: 'Books', value: 'books' },
    { label: 'Clothing', value: 'clothing' },
    { label: 'Appliances', value: 'appliances' },
    { label: 'Sports', value: 'sports' },
    { label: 'Services', value: 'services' },
    { label: 'Other', value: 'other' },
];

const types = [
    { label: 'Selling', value: 'selling' },
    { label: 'Renting', value: 'renting' },
    { label: 'Donating', value: 'donating' },
    { label: 'Requesting', value: 'requesting' },
    { label: 'Swapping', value: 'swapping' },
    { label: 'Loaning', value: 'loaning' },
    { label: 'Service', value: 'service' },
    { label: 'Lost & Found', value: 'lost & found' },
    { label: 'Other', value: 'other' },
];

const rentalPeriods = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
];

enum ItemStatus {
    AVAILABLE = "available",
    UNAVAILABLE = "unavailable",
    LENT = "lent",
    DONATED = "donated",
    SOLD = "sold"
}

export default function AddListingScreen() {
    const [type, setType] = useState('selling');
    const [rentalPeriod, setRentalPeriod] = useState('');
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [flatNumber, setFlatNumber] = useState('');
    const [description, setDescription] = useState('');
    const [delivery, setDelivery] = useState(false);
    const [image, setImage] = useState<string | null>(null);

    // upload state
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);

    // FIXED: Separate function to just select and upload image
    const handleAddPhoto = async () => {
        try {
            const userId = await AsyncStorage.getItem("userId");
            const token = await AsyncStorage.getItem("authToken");
            const email = await AsyncStorage.getItem("userEmail");
            
            console.log("UserID:", userId);
            console.log("Token:", token);
            console.log("Email:", email);

            if (!userId || !token) {
            alert("No user logged in");
            return;
            }

            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
            alert("Permission to access gallery is required!");
            return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
            });

            if (result.canceled) return;

            // Just store the URI locally; backend handles upload
            setImage(result.assets[0].uri);
        } catch (err) {
            console.error(err);
            alert("Something went wrong while picking the image.");
        }
    };


    // FIXED: Separate function to save the complete listing
    const handlePost = async () => {
    try {
        console.log("=== STARTING LISTING CREATION ===");
        
        const userId = await AsyncStorage.getItem("userId");
        const token = await AsyncStorage.getItem("authToken");
        const userCommunity = await AsyncStorage.getItem("userCommunity");

        console.log("User data:", { userId, token: token ? "exists" : "missing", userCommunity });

        if (!userId || !token) {
        alert("No user logged in");
        return;
        }

        if (!userCommunity) {
        alert("No community selected");
        return;
        }

        // Validate required fields
        if (!title?.trim() || !description?.trim()) {
        alert("Title and description are required");
        return;
        }

        const formData = new FormData();
        formData.append("title", title.trim());
        formData.append("description", description.trim());
        formData.append("price", price || "0");
        formData.append("flatNumber", flatNumber || "");
        formData.append("type", type || "");
        formData.append("category", category || "");
        formData.append("communityName", userCommunity);
        formData.append("userId", userId);

        console.log("Form data prepared:", {
        title: title.trim(),
        description: description.trim(),
        price: price || "0",
        flatNumber: flatNumber || "",
        type: type || "",
        category: category || "",
        communityName: userCommunity,
        userId,
        hasImage: !!image
        });

        if (image) {
        const filename = image.split("/").pop();
        const fileExt = filename?.split(".").pop() || "jpg";
        
        console.log("Adding image:", { filename, fileExt, uri: image });
        
        formData.append("image", {
            uri: image,
            name: filename || `upload_${Date.now()}.${fileExt}`,
            type: `image/${fileExt}`,
        } as any);
        }

        const response = await fetch("https://flatshare-final.onrender.com/listings", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            // DO NOT set Content-Type for FormData - let the system handle it
        },
        body: formData,
        });

        console.log("Response status:", response.status);
        console.log("Response headers:", response.headers);

        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        let result;
        
        if (contentType && contentType.includes("application/json")) {
        result = await response.json();
        } else {
        // If not JSON, get as text to see what the server is returning
        const textResult = await response.text();
        console.error("Non-JSON response:", textResult);
        throw new Error(`Server returned non-JSON response: ${textResult}`);
        }

        console.log("Server response:", result);

        if (response.ok) {
        alert("Listing posted successfully!");
        // Clear form
        setTitle("");
        setDescription("");
        setPrice("");
        setFlatNumber("");
        setType("");
        setCategory("");
        setImage(null);
        
        router.push("/home");
        } else {
        console.error("Server error response:", result);
        const errorMessage = result.message || result.error || "Failed to create listing";
        alert(errorMessage);
        }
    } catch (err) {
        console.error("Error posting listing:", err);
        if (err instanceof Error) {
            alert(`Error posting listing: ${err.message}`);
        } else {
            alert("Error posting listing: An unknown error occurred.");
        }
    }
    };



    const item = new Item('', title, description, price ? parseFloat(price) : 0, image, ItemStatus.AVAILABLE);
    const listing = new Listing(item);
    const post = new Post('', title, description, '', listing.items);
    
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.row}>
                <Text style={styles.label}>Type</Text>
                <View style={styles.typePicker}>
                    <Picker
                        selectedValue={type}
                        onValueChange={setType}
                        style={Platform.OS === 'android' ? { color: '#fff' } : undefined}
                        dropdownIconColor="#fff"
                    >
                        {types.map((t) => (
                            <Picker.Item key={t.value} label={t.label} value={t.value} />
                        ))}
                    </Picker>
                </View>
            </View>

            {/** Photo upload section */}
            <TouchableOpacity style={styles.photoBox} onPress={handleAddPhoto}>
                {image ? (
                    <Image source={{ uri: image }} style={styles.photo} />
                ) : (
                    <>
                        <Ionicons name="image" size={48} color="#C7C2D1" />
                        <Text style={styles.addPhotoText}>Add photos</Text>
                        {uploading && (
                            <Text style={styles.uploadProgress}>{uploadProgress}%</Text>
                        )}
                    </>
                )}
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
                style={styles.input}
                placeholder="Input title"
                placeholderTextColor="#C7C2D1"
                value={title}
                onChangeText={setTitle}
            />

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.dropdown}>
                <Picker
                    selectedValue={category}
                    onValueChange={setCategory}
                    style={Platform.OS === 'android' ? { color: '#8a798fff' } : undefined}
                >
                    <Picker.Item label="Dropdown" value="" />
                    {categories.map((cat) => (
                        <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
                    ))}
                </Picker>
            </View>

            {type === 'renting' && (
                <>
                    <Text style={styles.inputLabel}>Rental Period</Text>
                    <View style={styles.dropdown}>
                        <Picker
                            selectedValue={rentalPeriod}
                            onValueChange={setRentalPeriod}
                            style={Platform.OS === 'android' ? { color: '#8a798fff' } : undefined}
                        >
                            {rentalPeriods.map((period) => (
                                <Picker.Item key={period.value} label={period.label} value={period.value} />
                            ))}
                        </Picker>
                    </View>
                </>
            )}

            {(type === 'selling' || type === 'renting') && (
                <>
                    <Text style={styles.inputLabel}>
                        {type === 'selling' ? 'Price (R)' : 'Rent (R)'}
                    </Text>
                    <TextInput
                        style={styles.input}
                        placeholder="R50"
                        placeholderTextColor="#C7C2D1"
                        value={price}
                        onChangeText={setPrice}
                        keyboardType="numeric"
                    />
                </>
            )}

            <Text style={styles.inputLabel}>FlatNumber</Text>
            <TextInput
                style={styles.input}
                placeholder="A1"
                placeholderTextColor="#C7C2D1"
                value={flatNumber}
                onChangeText={setFlatNumber}
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Input description"
                placeholderTextColor="#C7C2D1"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
            />

            <View style={styles.deliveryRow}>
                <Text style={styles.inputLabel}>Delivery</Text>
                <Switch
                    value={delivery}
                    onValueChange={setDelivery}
                    trackColor={{ false: '#C7C2D1', true: '#5a4b81' }}
                    thumbColor={delivery ? '#fff' : '#fff'}
                />
            </View>

            <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.draftButton}>
                    <Ionicons name="download-outline" size={20} color="#5a4b81" />
                    <Text style={styles.draftButtonText}>Save draft</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.postButton}
                    onPress={handlePost}
                    disabled={uploading || !title.trim() || !category || !image || !flatNumber.trim()}
                >
                    <Ionicons name="send" size={20} color="#fff" />
                    <Text style={styles.postButtonText}>Post</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingTop: 12,
        backgroundColor: '#fff',
        flexGrow: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
        marginTop: 1,
        justifyContent: 'space-between',
    },
    label: {
        fontSize: 14,
        color: '#575757ff',
        fontWeight: '500',
    },
    typePicker: {
        backgroundColor: '#5a4b81',
        borderRadius: 8,
        width: 120,
        height: 40,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    photoBox: {
        backgroundColor: '#f5f2ffff',
        borderRadius: 8,
        height: 140,
        width: 180,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginBottom: 8,
        marginTop: 8,
        alignSelf: 'center',
    },
    photo: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    addPhotoText: {
        color: '#A29EB6',
        marginTop: 8,
        fontSize: 14,
    },
    uploadProgress: {
        color: '#5a4b81',
        marginTop: 4,
        fontSize: 12,
        fontWeight: 'bold',
    },
    inputLabel: {
        fontSize: 13,
        color: '#575757ff',
        marginTop: 10,
        marginBottom: 4,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#F4F1FB',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: '#575757ff',
        marginBottom: 4,
    },
    dropdown: {
        backgroundColor: '#F4F1FB',
        borderRadius: 6,
        marginBottom: 4,
        overflow: 'hidden',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    deliveryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        marginBottom: 150,
    },
    draftButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#575757ff',
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 18,
        backgroundColor: '#fff',
        marginRight: 8,
        flex: 1,
        justifyContent: 'center',
    },
    draftButtonText: {
        color: '#5a4b81',
        fontWeight: '600',
        marginLeft: 6,
        fontSize: 15,
    },
    postButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#5a4b81',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 18,
        flex: 1,
        justifyContent: 'center',
    },
    postButtonText: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: 6,
        fontSize: 15,
    },
});