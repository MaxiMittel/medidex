"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";

interface StudyTimelineProps {
  study: {
    DateEntered: string;
    DateToCENTRAL: string;
    DateEdited: string;
  };
}

export function StudyTimeline({ study }: StudyTimelineProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
  };

  const timelineEvents = [
    {
      label: "Study Entered",
      date: study.DateEntered,
      color: "bg-blue-500",
    },
    {
      label: "Submitted to CENTRAL",
      date: study.DateToCENTRAL,
      color: "bg-purple-500",
    },
    {
      label: "Last Edited",
      date: study.DateEdited,
      color: "bg-green-500",
    },
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />
          
          {timelineEvents.map((event, index) => (
            <div key={index} className="relative flex items-start gap-4">
              {/* Timeline dot */}
              <div className={`relative z-10 flex h-4 w-4 items-center justify-center rounded-full ${event.color} ring-4 ring-background`} />
              
              {/* Event content */}
              <div className="flex-1 pb-4">
                <p className="text-sm font-medium">{event.label}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(event.date)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Time span calculation */}
        <div className="mt-6 pt-4 border-t">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Total Duration</p>
            <p className="text-sm font-medium">
              {Math.ceil(
                (new Date(study.DateEdited).getTime() - new Date(study.DateEntered).getTime()) / 
                (1000 * 60 * 60 * 24)
              )} days
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

