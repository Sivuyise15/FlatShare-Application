{/* This is the layout file for the admin tab navigator */}

import { AntDesign, Entypo } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#4B0082", // purple when active
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          height: 105,
          backgroundColor: 'white',
        },
      }}
    >
      {/* Dashboard */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Entypo name="home" color={color} size={size} />
          ),
        }}
      />

      {/* Reports */}
      <Tabs.Screen
        name="report"
        options={{
          title: "Reports",
          tabBarIcon: ({ color, size }) => (
            <Entypo name="flag" color={color} size={size} />
          ),
        }}
      />

      {/* Users */}
      <Tabs.Screen
        name="users"
        options={{
          title: "Users",
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="team" color={color} size={size} />
          ),
        }}
      />

      {/* Settings */}
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="setting" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

export default Layout;
