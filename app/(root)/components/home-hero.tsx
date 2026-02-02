"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileSearch } from "lucide-react";
import Link from "next/link";

interface HomeHeroProps {
    userName: string;
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

function getMotivationalMessage(): string {
    const messages = [
        "Ready to discover new connections?",
        "Let's make some progress today.",
        "Your research journey continues.",
        "Time to uncover insights.",
        "Every report brings new knowledge.",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

export function HomeHero({ userName }: HomeHeroProps) {
    const [greeting, setGreeting] = useState("Welcome");
    const [message, setMessage] = useState("");

    useEffect(() => {
        setGreeting(getGreeting());
        setMessage(getMotivationalMessage());
    }, []);

    const firstName = userName.split(" ")[0];

    return (
        <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-primary mb-1 tracking-wide uppercase">
                        {greeting}
                    </p>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                        {firstName}
                    </h1>
                    {message && (
                        <p className="text-muted-foreground mt-2 text-lg">
                            {message}
                        </p>
                    )}
                </div>

                <div className="flex gap-2">
                    <Button asChild>
                        <Link href="/upload">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Batch
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
