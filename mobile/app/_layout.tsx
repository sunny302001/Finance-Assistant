import "../global.css";
import { Stack } from "expo-router";
import { database } from "../src/database";
import { DatabaseProvider } from "@nozbe/watermelondb/DatabaseProvider";

export default function Layout() {
    return (
        <DatabaseProvider database={database}>
            <Stack
                screenOptions={{
                    headerStyle: {
                        backgroundColor: "#0f172a",
                    },
                    headerTintColor: "#f8fafc",
                    headerTitleStyle: {
                        fontWeight: "bold",
                    },
                    contentStyle: {
                        backgroundColor: "#0f172a",
                    },
                }}
            >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="importer" options={{ presentation: 'modal', title: 'Import Statement' }} />
            </Stack>
        </DatabaseProvider>
    );
}
