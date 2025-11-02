"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface Participant {
  id: number;
  description: string;
  ageRange?: string;
  count: number;
}

interface StudyParticipantsProps {
  participants: Participant[];
}

export function StudyParticipants({ participants }: StudyParticipantsProps) {
  // Calculate total for percentage
  const totalCount = Math.max(...participants.map(p => p.count));
  
  // Separate demographics and characteristics
  const demographics = participants.filter(p => 
    p.description.includes('Male') || 
    p.description.includes('Female') || 
    p.description.includes('Adults') || 
    p.description.includes('Elderly') ||
    p.ageRange
  );
  
  const characteristics = participants.filter(p => 
    !demographics.includes(p)
  );

  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-cyan-500",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Participant Demographics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Demographics */}
        {demographics.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Demographics</p>
            {demographics.map((participant, index) => (
              <div key={participant.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{participant.description}</span>
                  <span className="text-muted-foreground">
                    {participant.count.toLocaleString()}
                    {participant.ageRange && (
                      <span className="ml-2 text-xs">({participant.ageRange})</span>
                    )}
                  </span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all ${colors[index % colors.length]}`}
                    style={{ width: `${(participant.count / totalCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Characteristics */}
        {characteristics.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Characteristics</p>
            {characteristics.map((participant, index) => (
              <div key={participant.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{participant.description}</span>
                  <span className="text-muted-foreground">
                    {participant.count.toLocaleString()}
                  </span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all ${colors[(demographics.length + index) % colors.length]}`}
                    style={{ width: `${(participant.count / totalCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Visual representation */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-3">Distribution Overview</p>
          <div className="flex h-8 w-full overflow-hidden rounded-md">
            {participants.map((participant, index) => (
              <div
                key={participant.id}
                className={`${colors[index % colors.length]} transition-all hover:opacity-80 cursor-pointer relative group`}
                style={{ width: `${(participant.count / totalCount) * 100}%` }}
                title={`${participant.description}: ${participant.count}`}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-white font-medium drop-shadow">
                    {Math.round((participant.count / totalCount) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

