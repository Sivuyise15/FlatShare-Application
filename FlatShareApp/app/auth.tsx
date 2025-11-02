import { Ionicons } from "@expo/vector-icons"; // for user/lock/arrow icons
import { useNavigation } from "@react-navigation/native"; //navigation hook
import { useRouter } from "expo-router"; //router hook
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Alert } from "react-native";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdmin, setShowAdmin] = useState(true);

  const navigation = useNavigation(); //navigation instance
  const router = useRouter(); //router instance

  const signIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("https://flatshare-final.onrender.com/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log(data);
      const community = data.communityName;
      const approvalResponse = await fetch("https://flatshare-final.onrender.com/residents/check-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email,  community}),
      });

      const approvalData = await approvalResponse.json();
      console.log("Approval Data:", approvalData);
      if (response.ok) {
        // Check user status before proceeding
        console.log("User status:", data.status);
        if (approvalData.status !== 'active' && data.role !== 'admin') {
          let message;
          switch (approvalData.status) {
            case 'pending':
              message = "Your account is still pending admin approval. Please wait for confirmation.";
              break;
            case 'rejected':
              message = "Your account application was not approved. Please contact your building admin.";
              break;
            case 'suspended':
              message = "Your account has been suspended. Please contact your building admin.";
              break;
            default:
              message = "Your account is not active. Please contact your building admin.";
          }
          
          Alert.alert("Account Inactive", message);
          setLoading(false);
          return;
        }

        // Store token + role (only if status is active)
        await AsyncStorage.setItem("authToken", data.idToken);
        await AsyncStorage.setItem("userId", data.uid);
        await AsyncStorage.setItem("userRole", data.role);
        await AsyncStorage.setItem("userCommunity", data.communityName!);
        await AsyncStorage.setItem("userEmail", data.email);
        console.log("Stored userRole:", data.role);
        console.log("Stored userEmail:", data.email);
        console.log("Stored userId:", data.uid);
        console.log("Stored userToken:", data.idToken);
        console.log("Stored userCommunity:", data.communityName);

        Alert.alert("Success", "Login successful!");
        if (data.role === "admin") router.replace("/(tabs-admin)/home" as never);
        else { router.replace("/(tabs)/home" as never); }
      } else {
        Alert.alert("Login Failed", data.error || "Invalid credentials");
      }
    } catch (err) {
      console.error("Network error:", err);
      Alert.alert("Error", "Network request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior="padding" style={{ alignItems: "center" }}>
        {/* Logo */}
        <Image
          source={require("@/assets/images/apex_icon.png")}
          style={styles.logo}
        />

        {/* App Title */}
        <Text style={styles.title}>Apex</Text>
        <Text style={styles.subtitle}>Collective Flats</Text>
        <Text style={styles.loginType}>
          {showAdmin ? "Resident Login" : "Admin Login"}
        </Text>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email or Username"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Ionicons name="person-outline" size={18} color="#010102ff" style={styles.icon} />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Ionicons name="lock-closed-outline" size={18} color="#070708ff" style={styles.icon} />
        </View>

        {/* Forgot Password */}
        <TouchableOpacity>
          <Text style={styles.forgot}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Sign In Button */}
        <TouchableOpacity style={styles.signInButton} onPress={signIn} disabled={loading}>
          <Ionicons name="arrow-forward" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Create Account */}
        <Text style={styles.smallText}>Don't Have Account?</Text>

        <TouchableOpacity 
          onPress={() => {
            if (!showAdmin) {
              navigation.navigate("community-registration" as never);
            }
            else {
              navigation.navigate("resident-sign-up" as never);
            }
          }}>
          <Text style={styles.link}>Create Account</Text>
        </TouchableOpacity>

        {/* Admin Link */}
        <TouchableOpacity
          onPress={() => {
            if (showAdmin) {
              setShowAdmin(false); // hide admin, show resident
              navigation.navigate("auth" as never);
            } else {
              setShowAdmin(true); // switch back if resident is pressed
              navigation.navigate("auth" as never);
            }
          }}
        >
          {showAdmin ? (
            <Text style={styles.admin}>Admin?</Text>
          ) : (
            <Text style={styles.resident}>Resident?</Text>
          )}
        </TouchableOpacity>

        {/* Swipe Up (Clickable) */}
        <TouchableOpacity
          style={styles.swipeUpContainer}
          onPress={() => navigation.navigate("sign-up" as never)}
        >
          <Ionicons name="arrow-up-outline" size={20} color="#5a4b81" />
          <Text style={styles.swipeUp}>Swipe up</Text>
        </TouchableOpacity>
        
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    backgroundColor: "#fff",
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    marginBottom: 10,
  },
  loginType: {
    fontSize: 16,
    fontWeight: "500",
    color: "#5a4b81",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#322A5E",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#5a4b81",
    marginBottom: 30,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 8,
    marginBottom: 12,
    width: "100%",
    height: 45,
  },
  icon: {
    marginLeft: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  forgot: {
    alignSelf: "flex-end",
    color: "#5a4b81",
    fontSize: 13,
    marginBottom: 20,
  },
  signInButton: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: "#322A5E",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },
  smallText: {
    fontSize: 13,
    color: "#444",
  },
  link: {
    fontSize: 14,
    fontWeight: "600",
    color: "#322A5E",
    marginBottom: 20,
  },
  admin: {
    fontSize: 14,
    fontWeight: "600",
    color: "#322A5E",
    marginBottom: 30,
  },
  resident: {
    fontSize: 14,
    fontWeight: "600",
    color: "#322A5E",
    marginBottom: 30,
  },
  swipeUpContainer: {
    alignItems: "center",
  },
  swipeUp: {
    fontSize: 12,
    color: "#5a4b81",
  },
});
