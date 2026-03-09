import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarStyle: {
                    backgroundColor: "#1e293b",
                    borderTopColor: "#334155",
                },
                tabBarActiveTintColor: "#6366f1",
                tabBarInactiveTintColor: "#94a3b8",
                headerStyle: {
                    backgroundColor: "#0f172a",
                },
                headerTintColor: "#f8fafc",
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Dashboard",
                    tabBarIcon: ({ color }) => <Ionicons name="pie-chart" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="analyzer"
                options={{
                    title: "AI Insights",
                    tabBarIcon: ({ color }) => <Ionicons name="analytics" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="goals"
                options={{
                    title: "Goals",
                    tabBarIcon: ({ color }) => <Ionicons name="flag" size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
