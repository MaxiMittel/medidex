"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  MapPin, 
  FileText,
  Calendar,
  Beaker,
  TrendingUp,
} from "lucide-react";

interface StudySummaryProps {
  study: {
    ShortName: string;
    NumberParticipants: string;
    Countries: string;
    Duration: string;
    Comparison: string;
    UDef4: string;
  };
  reportCount: number;
}

export function StudySummary({ study, reportCount }: StudySummaryProps) {
  const countries = study.Countries.split("//").filter(Boolean);

  const highlights = [
    {
      icon: Users,
      label: "Participants",
      value: study.NumberParticipants,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      icon: MapPin,
      label: "Countries",
      value: `${countries.length} countries`,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      icon: Calendar,
      label: "Duration",
      value: study.Duration,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
    {
      icon: FileText,
      label: "Reports",
      value: `${reportCount} reports`,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
    },
    {
      icon: Beaker,
      label: "Phase",
      value: study.UDef4,
      color: "text-pink-600",
      bgColor: "bg-pink-50 dark:bg-pink-950/20",
    },
  ];

  return (
    <Card className="border-2 shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Title section */}
          <div>
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Key Highlights
            </h2>
            <p className="text-sm text-muted-foreground">
              Essential information to help identify and match this study
            </p>
          </div>

          {/* Highlights grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {highlights.map((highlight, index) => {
              const Icon = highlight.icon;
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${highlight.bgColor} border border-transparent hover:border-current transition-all cursor-default`}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <Icon className={`h-5 w-5 ${highlight.color}`} />
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {highlight.label}
                      </p>
                      <p className="text-sm font-semibold">{highlight.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comparison - most important for matching */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-900">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Study Comparison
            </p>
            <p className="text-sm font-semibold">{study.Comparison}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

