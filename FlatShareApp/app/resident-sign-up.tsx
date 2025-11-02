import { app, firestore } from '@/lib/firebaseConfig';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from "@react-navigation/native";
import { collection, doc, getDocs, getFirestore, setDoc } from "firebase/firestore";
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Resident from './Entities/Resident';
import { router } from 'expo-router';


interface ResidentContextType {
  resident: Resident | null;
  setResident: (resident: Resident | null) => void;
}

const ResidentContext = createContext<ResidentContextType | undefined>(undefined);

export const ResidentProvider = ({ children }: { children: ReactNode }) => {
  const [resident, setResident] = useState<Resident | null>(null);

  return (
    <ResidentContext.Provider value={{ resident, setResident }}>
      {children}
    </ResidentContext.Provider>
  );
};

export const useResident = () => {
  const context = useContext(ResidentContext);
  if (!context) {
    throw new Error("useResident must be used within a ResidentProvider");
  }
  return context;
};

export default function SignUpScreen() {
    const navigation = useNavigation<any>();
    const [email, setEmail] = useState('');
    const [flatNumber, setFlatNumber] = useState('');
    const [password, setPassword] = useState('');
    const [community, setCommunity] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const { setResident } = useResident();


    const [communities, setCommunities] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    

    useEffect(() => {
        const fetchCommunities = async () => {
        try {
            const querySnapshot = await getDocs(collection(firestore, "communities"));

            // Collect the document IDs (community names)
            const communityNames = querySnapshot.docs.map(doc => doc.id);
            console.log("Fetched communities:", communityNames);

            setCommunities(communityNames);
        } catch (error) {
            console.error("Error fetching communities:", error);
        } finally {
            setLoading(false);
        }
        };

        fetchCommunities();
    }, []);

    if (loading) {
        return <Text>Loading communities...</Text>;
    }

    
    // we need to create handle sign up function here to handle the sign up logic and store the data in firebase auth and firestore

    const handleSignUp = async () => {
        if (!name || !email || !password || !community || !flatNumber) {
        Alert.alert("Error", "Please fill in all fields");
        return;
        }

        setLoading(true);
        try {
        const response = await fetch("https://flatshare-final.onrender.com/residents/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            name,
            surname,
            email,
            password,
            community,
            flatNumber,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            Alert.alert("Success", "Account created successfully. Your admin will verify your account shortly and you will be notified of your status.");
            router.push('/auth');
        } else {
            Alert.alert("Signup Failed", data.error || "Something went wrong");
        }
        } catch (err) {
        console.error("Network error:", err);
        Alert.alert("Error", "Could not reach server. Check your network or backend.");
        } finally {
        setLoading(false);
        }
    };
    

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F7FB' }}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
                <KeyboardAvoidingView
                    style={{ flex: 1, marginBottom: 60 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={styles.container}>
                        {/* Top bar */}
                        <View style={styles.topBar}>
                            <Text style={styles.topBarText}>Sign Up</Text>
                        </View>

                        {/* Already a member */}
                        <View style={{ alignItems: 'center', marginTop: 16 }}>
                            <Text style={styles.memberText}>Already a member?</Text>
                            <TouchableOpacity style={styles.downArrow} onPress={() => { navigation.navigate('auth' as never) }}>
                                <Ionicons name="chevron-down" size={28} color="#6B6B6B" />
                            </TouchableOpacity>
                            <Text style={styles.swipeText}>Swipe down to log in</Text>
                        </View>

                        {/* Create Account */}
                        <Text style={styles.createAccount}>Create Account</Text>

                        {/* Form */}
                        <View style={styles.form}>
                            {/* Email */}
                            <Text style={styles.label}>Email</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="MasterCreations@gmail.com"
                                    placeholderTextColor="#BDBDBD"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                                <MaterialIcons name="person-outline" size={22} color="#BDBDBD" />
                            </View>
                            {/* Name */}
                            <Text style={styles.label}>Name</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="John Doe"
                                    placeholderTextColor="#BDBDBD"
                                    value={name}
                                    onChangeText={setName}
                                />
                                <MaterialIcons name="person-outline" size={22} color="#BDBDBD" />
                            </View>
                            {/* Surname */}
                            <Text style={styles.label}>Surname</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Smith"
                                    placeholderTextColor="#BDBDBD"
                                    value={surname}
                                    onChangeText={setSurname}
                                />
                                <MaterialIcons name="person-outline" size={22} color="#BDBDBD" />
                            </View>

                            {/* Select community name */}
                            <Text style={styles.label}>Community Name</Text>
                            <View style={styles.dropdown}>
                                <Picker selectedValue={community} onValueChange={(itemValue) => setCommunity(itemValue)}>
                                    <Picker.Item label="Select Community" value="" />
                                    {communities.map((community) => (
                                        <Picker.Item key={community} label={community} value={community} />
                                    ))}
                                </Picker>
                            </View>

                            {/* Flatnumber */}
                            <Text style={styles.label}>Flatnumber</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="B605A"
                                    placeholderTextColor="#BDBDBD"
                                    value={flatNumber}
                                    onChangeText={setFlatNumber}
                                    autoCapitalize="characters"
                                />
                                <Feather name="key" size={22} color="#BDBDBD" />
                            </View>

                            {/* Password */}
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="********"
                                    placeholderTextColor="#BDBDBD"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Feather name={showPassword ? "eye" : "eye-off"} size={22} color="#BDBDBD" />
                                </TouchableOpacity>
                            </View>

                            {/* Confirm Password */}
                            <Text style={styles.label}>Confirm Password</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="********"
                                    placeholderTextColor="#BDBDBD"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={22} color="#BDBDBD" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Submit Button */}
                        <View style={{ alignItems: 'center', marginTop: 24 }}>
                            <TouchableOpacity style={styles.submitButton}>
                                <Ionicons name="arrow-forward" size={28} color="#fff" 
                                    onPress={() => handleSignUp()
                                    }/>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 0,
    },
    topBar: {
        height: 32,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    topBarText: {
        color: '#BDBDBD',
        fontSize: 14,
    },
    memberText: {
        fontSize: 16,
        color: '#222',
        fontWeight: '500',
        marginBottom: 8,
    },
    downArrow: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        marginBottom: 4,
    },
    swipeText: {
        color: '#6B6B6B',
        fontSize: 14,
        marginBottom: 16,
    },
    createAccount: {
        fontSize: 24,
        fontWeight: 'bold',
        alignSelf: 'center',
        marginVertical: 12,
        color: '#222',
    },
    form: {
        marginTop: 8,
    },
    label: {
        fontWeight: '600',
        fontSize: 15,
        color: '#222',
        marginBottom: 6,
        marginTop: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingHorizontal: 12,
        marginBottom: 2,
        height: 48,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#222',
        paddingVertical: 10,
    },
    submitButton: {
        backgroundColor: '#4B366F',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
    dropdown: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingHorizontal: 12,
        marginBottom: 2,
        height: 48,
    },
});