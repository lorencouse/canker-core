"use client"

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export default function ModeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // After mounting, we have access to the theme
    useEffect(() => setMounted(true), []);

    if (!mounted) {
        // Render nothing on the server and until the theme is mounted
        return null;
    }

    return (
        <div>
            {theme === "dark" ? (
                <Button variant="ghost" className="hover:scale-105 border-foreground bg-background" size="icon" onClick={() => setTheme("light")}>
                    <Sun className="w-5 h-5" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            ) : (
                <Button variant="ghost" size="icon" className="hover:scale-105 border-foreground bg-background" onClick={() => setTheme("dark")}>
                    <Moon className="w-5 h-5" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            )}
        </div>
    );
}
