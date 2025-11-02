import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from "@react-navigation/native"; // navigation hook
import React, { useState } from 'react';
import { Alert } from 'react-native';

import {
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const states = ['Select province', 'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape'];
const cities = ['Select city', 'Johannesburg', 'Cape Town', 'Durban', 'Port Elizabeth'];
const countries = ['Select country/region', 'South Africa', 'Namibia', 'Botswana'];

export default function CommunityRegistration() {
    const navigation = useNavigation();

    const [state, setState] = useState(states[0]);
    const [city, setCity] = useState(cities[0]);
    const [country, setCountry] = useState(countries[0]);
    const [form, setForm] = useState({
        communityName: '',
        streetNumber: '',
        streetName: '',
        zip: '',
        flats: '',
        adminName: '',
        adminEmail: '',
        adminPhone: '',
        notes: '',
        adminPassword: '',
        adminConfirmPassword: '',
    });

    const handleChange = (key: string, value: string) => {
        setForm({ ...form, [key]: value });
    };

    const handleAdminSubmit = async () => {
        if (form.adminPassword !== form.adminConfirmPassword) {
            Alert.alert("Error", "Passwords do not match");
            return;
        }

        try {
            const response = await fetch("https://flatshare-final.onrender.com/communities", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    state,
                    city,
                    country,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to register");
            }

            Alert.alert("Success", data.message);
            navigation.goBack();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity>
                    <Ionicons 
                        name="arrow-back" size={22} color="#222"
                        onPress={() => navigation.goBack()} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Community Registration</Text>
            </View>
            {/* Form */}
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Community Details</Text>
                    <Text style={styles.label}>Community Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Grandview Residency"
                        value={form.communityName}
                        onChangeText={v => handleChange('communityName', v)}
                        placeholderTextColor="#bbb"
                    />

                    {/* Street Number */}
                    <Text style={styles.label}>Street Number</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 95"
                        value={form.streetNumber}
                        onChangeText={v => handleChange('streetNumber', v)}
                        placeholderTextColor="#bbb"
                    />
                    {/* Street Name */}
                    <Text style={styles.label}>Street Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Tero Mathebula"
                        value={form.streetName}
                        onChangeText={v => handleChange('streetName', v)}
                        placeholderTextColor="#bbb"
                    />
                    {/* State/Province */}
                    <Text style={styles.label}>State/Province</Text>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={state}
                            onValueChange={v => setState(v)}
                            style={styles.picker}
                            dropdownIconColor="#888"
                        >
                            {states.map(s => (
                                <Picker.Item key={s} label={s} value={s} />
                            ))}
                        </Picker>
                    </View>
                    
                    {/* Postal Code/Zip */}
                    <Text style={styles.label}>Zip/Postal code</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Input code"
                        value={form.zip}
                        onChangeText={v => handleChange('zip', v)}
                        placeholderTextColor="#bbb"
                        keyboardType="numeric"
                    />

                    {/* City */}
                    <Text style={styles.label}>City</Text>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={city}
                            onValueChange={v => setCity(v)}
                            style={styles.picker}
                            dropdownIconColor="#888"
                        >
                            {cities.map(c => (
                                <Picker.Item key={c} label={c} value={c} />
                            ))}
                        </Picker>
                    </View>
                    {/* Country/Region */}
                    <Text style={styles.label}>Country/Region</Text>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={country}
                            onValueChange={v => setCountry(v)}
                            style={styles.picker}
                            dropdownIconColor="#888"
                        >
                            {countries.map(c => (
                                <Picker.Item key={c} label={c} value={c} />
                            ))}
                        </Picker>
                    </View>
                </View>
           
                <View style={styles.card}>
                    {/** Total Flats */}
                    <Text style={styles.label}>Total Number of Flats</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 250"
                        value={form.flats}
                        onChangeText={v => handleChange('flats', v)}
                        placeholderTextColor="#bbb"
                        keyboardType="numeric"
                    />
                    {/** Admin Contact Info */}
                    <Text style={styles.sectionTitle}>Admin Contact Information</Text>
                    <Text style={styles.label}>Admin Full Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Jane Doe"
                        value={form.adminName}
                        onChangeText={v => handleChange('adminName', v)}
                        placeholderTextColor="#bbb"
                    />
                    {/** Admin Email */}
                    <Text style={styles.label}>Admin Email Address</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., admin@grandview.com"
                        value={form.adminEmail}
                        onChangeText={v => handleChange('adminEmail', v)}
                        placeholderTextColor="#bbb"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    {/** Admin Phone */}
                    <Text style={styles.label}>Admin Phone Number</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., +123 456 7890"
                        value={form.adminPhone}
                        onChangeText={v => handleChange('adminPhone', v)}
                        placeholderTextColor="#bbb"
                        keyboardType="phone-pad"
                    />
                    {/** Password */}
                    <Text style={styles.label}>Admin Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="********"
                        value={form.adminPassword}
                        onChangeText={v => handleChange('adminPassword', v)}
                        placeholderTextColor="#bbb"
                        secureTextEntry
                    />
                    {/** Confirm Password */}
                    <Text style={styles.label}>Confirm Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="********"
                        value={form.adminConfirmPassword}
                        onChangeText={v => handleChange('adminConfirmPassword', v)}
                        placeholderTextColor="#bbb"
                        secureTextEntry
                    />
                </View>

                <View style={styles.card}>
                    {/** Additional Notes */}
                    <Text style={styles.sectionTitle}>Additional Notes</Text>
                    <Text style={styles.label}>Any Special Instructions or Details</Text>
                    <TextInput
                        style={[styles.input, styles.textarea]}
                        placeholder="Provide any additional relevant information here (e.g., specific gate codes, emergency contacts, etc.)"
                        value={form.notes}
                        onChangeText={v => handleChange('notes', v)}
                        placeholderTextColor="#bbb"
                        multiline
                        numberOfLines={3}
                    />
                </View>

                <TouchableOpacity style={styles.button}
                    onPress={() => {
                        handleAdminSubmit();
                    }}
                >
                    <Text style={styles.buttonText}>
                            Register Complex
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
safe: {
    flex: 1,
    backgroundColor: '#fff',
},
header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 40 : 0,
    paddingHorizontal: 16,
    height: 80,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
},
headerTitle: {
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 16,
    color: '#222',
},
container: {
    padding: 16,
    paddingBottom: 32,
},
card: {
    backgroundColor: '#faf9fd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
},
sectionTitle: {
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 10,
    color: '#222',
},
label: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 4,
    color: '#444',
},
input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e3e1e9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#222',
},
pickerWrapper: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e3e1e9',
    borderRadius: 8,
    marginBottom: 0,
    overflow: 'hidden',
},
picker: {
    height: 52,
    width: '100%',
    color: '#222',
},
textarea: {
    minHeight: 60,
    textAlignVertical: 'top',
},
button: {
    backgroundColor: '#5c4387',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
},
buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
},
});