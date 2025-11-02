import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from "@react-navigation/native"; //navigation hook
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

export default function AccountCreationConfirmation (){
    const navigation = useNavigation();

    return (
        <SafeAreaView>
            <View style={styles.header}>
                <TouchableOpacity>
                    <Ionicons 
                        name="arrow-back" size={22} color="#222"
                        onPress={() => navigation.goBack()} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Community Registration</Text>
            </View>

            <View style={styles.container}>
                <View style={styles.iconContainer}>
                    {/* Green Checkmark SVG */}
                    <Text style={{fontSize: 64}}>✅</Text>
                </View>
                <Text style={styles.title}>Account Created</Text>
                <View style={styles.spacer} />
                <TouchableOpacity
                    style={styles.button}>
                    <Text 
                        style={styles.buttonText}
                        >Continue</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
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
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 80,
    },
    iconContainer: {
        marginBottom: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '400',
        color: '#222',
        textAlign: 'center',
    },
    spacer: {
        flex: 1,
    },
    button: {
        backgroundColor: '#3D315B',
        borderRadius: 5,
        width: 240,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
    },
});
