import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { database } from "../src/database";
import { DatabaseProvider } from "@nozbe/watermelondb/DatabaseProvider";
import { seedCategories } from "../src/database/seed";
import { CategorizerService } from "../src/services/CategorizerService";

export default function Layout() {
    useEffect(() => {
        // Seed default categories on first launch, then warm the categorizer cache
        seedCategories().then(() => {
            CategorizerService.invalidateCache();
            console.log("[App] Category seed check complete.");
        });
    }, []);

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
