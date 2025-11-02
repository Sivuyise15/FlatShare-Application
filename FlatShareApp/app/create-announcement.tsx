import { useNavigation } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CreateAnnouncementScreen = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [inputHeight, setInputHeight] = useState(40);
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    const handleSend = async () => {
        if (!title.trim() || !message.trim()) {
            Alert.alert("Missing Information", "Please fill in both the title and message fields.");
            return;
        }

        setLoading(true);

        try {
            // Get auth token and community
            const token = await AsyncStorage.getItem("authToken");
            const community = await AsyncStorage.getItem("userCommunity");

            console.log("Auth data:", { token: token ? "exists" : "missing", community });

            if (!token) {
                Alert.alert("Authentication Error", "Please log in again.");
                setLoading(false);
                return;
            }

            if (!community) {
                Alert.alert("Community Error", "User community not found. Please set your community before sending announcements.");
                setLoading(false);
                return;
            }

            console.log("Sending announcement:", { title: title.trim(), message: message.trim(), community });

            const response = await fetch(`https://flatshare-final.onrender.com/announcements?community=${community}`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` // Fix 2: Add auth header
                },
                body: JSON.stringify({ 
                    title: title.trim(), 
                    message: message.trim() 
                })
            });

            console.log("Response status:", response.status);

            const data = await response.json();
            console.log("Response data:", data);

            if (response.ok) {
                Alert.alert(
                    "Success", 
                    "Announcement sent successfully!",
                    [
                        {
                            text: "OK",
                            onPress: () => {
                                setTitle("");
                                setMessage("");
                                navigation.goBack();
                            }
                        }
                    ]
                );
            } else {
                console.error("Server error:", data);
                Alert.alert("Error", data.error || data.message || "Failed to send announcement");
            }
        } catch (err) {
            console.error("Network error:", err);
            Alert.alert("Network Error", "Network request failed. Please check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.header}>Send Announcement</Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Announcement Title</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter a concise title for your announcement"
                        value={title}
                        onChangeText={setTitle}
                        placeholderTextColor="#888"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Announcement Message</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { height: Math.max(100, inputHeight) }]}
                        placeholder="Type the full message of your announcement here. Be clear and informative."
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        onContentSizeChange={(event) =>
                        setInputHeight(event.nativeEvent.contentSize.height)
                        }
                        placeholderTextColor="#888"
                    />
                </View>

                <TouchableOpacity 
                    style={styles.button} 
                    onPress={handleSend}>
                    <Text style={styles.buttonText}>Send Announcement</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        padding: 16,
        flex: 1,
    },
    header: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginVertical: 16,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 6,
        color: '#222',
    },
    input: {
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 6,
        padding: 10,
        backgroundColor: '#fafafa',
        fontSize: 14,
        height: 40,
    },
    textArea: {
        height: 90,
        textAlignVertical: 'top',
    },
    button: {
    position: "absolute",
    bottom: 70,
    left: 20,
    right: 20,
    backgroundColor: "#4B3F72",
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: "center",
    },
    buttonText: {
        color: '#fff',
        fontWeight: '500',
        fontSize: 15,
    },
});

export default CreateAnnouncementScreen;