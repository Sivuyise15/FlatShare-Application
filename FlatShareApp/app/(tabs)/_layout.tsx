import Entypo from '@expo/vector-icons/Entypo';
import { Tabs, useRouter } from "expo-router";
import { Alert, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TabsLayout() {
  const router = useRouter();

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.clear();
            router.replace("../auth");
          } catch (err) {
            console.error("Logout error:", err);
            Alert.alert("Error", "Failed to log out.");
          }
        },
      },
    ]);
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#4C1D95",
        tabBarInactiveTintColor: "#4C1D95",
        tabBarStyle: {
          height: 105,
          backgroundColor: 'white',
          position: 'absolute',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 20,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "FlatShare",
          tabBarIcon: ({ color }) => (
            <Entypo name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="announcement"
        options={{
          title: "Announcements",
          tabBarIcon: ({ color }) => (
            <Entypo name="megaphone" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-listing"
        options={{
          title: "Add",
          tabBarLabel: () => null,
          tabBarIcon: ({ color }) => (
            <View style={styles.centerButtonWrapper}>
              <View style={styles.centerButton}>
                <Entypo name="plus" size={28} color="#fff" />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => (
            <Entypo name="chat" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Entypo name="user" size={24} color={color} />
          ),
          headerRight: () => (
            <Text
              onPress={handleSignOut}
              style={{
                marginRight: 15,
                color: "#4C1D95",
                fontWeight: "600",
                fontSize: 14,
              }}
            >
              Logout
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 80,
  },
  centerButtonWrapper: {
    position: 'absolute',
    top: -30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4C1D95',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 10,
  },
});