"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  MapPin, 
  Users, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Mail,
  Hash,
} from "lucide-react";

interface StudyOverviewProps {
  study: {
    ShortName: string;
    StatusofStudy: string;
    CENTRALSubmissionStatus: string;
    TrialistContactDetails: string;
    NumberParticipants: string;
    Countries: string;
    Duration: string;
    Comparison: string;
    ISRCTN: string;
    Notes: string;
    UDef4: string;
  };
}

export function StudyOverview({ study }: StudyOverviewProps) {
  const countries = study.Countries.split("//").filter(Boolean);
  
  const statusColor = {
    "Completed": "bg-green-500",
    "Active": "bg-blue-500",
    "Ongoing": "bg-blue-500",
    "Recruiting": "bg-yellow-500",
    "Terminated": "bg-red-500",
    "Pending": "bg-gray-500",
  }[study.StatusofStudy] || "bg-gray-500";

  const submissionColor = {
    "Approved": "bg-green-500",
    "In Progress": "bg-yellow-500",
    "Pending": "bg-orange-500",
    "Rejected": "bg-red-500",
  }[study.CENTRALSubmissionStatus] || "bg-gray-500";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Study Overview
          </CardTitle>
          <div className="flex gap-2">
            <Badge className={statusColor}>{study.StatusofStudy}</Badge>
            <Badge className={submissionColor} variant="outline">
              {study.CENTRALSubmissionStatus}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key metrics grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <Users className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Participants</p>
              <p className="text-lg font-semibold">{study.NumberParticipants}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
            <Clock className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="text-lg font-semibold">{study.Duration}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
            <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Countries</p>
              <p className="text-lg font-semibold">{countries.length}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
            <Hash className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Phase</p>
              <p className="text-lg font-semibold">{study.UDef4}</p>
            </div>
          </div>
        </div>

        {/* Countries */}
        <div>
          <p className="text-sm font-medium mb-2 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Study Countries
          </p>
          <div className="flex flex-wrap gap-2">
            {countries.map((country) => (
              <Badge key={country} variant="secondary">
                {country}
              </Badge>
            ))}
          </div>
        </div>

        {/* Comparison */}
        <div>
          <p className="text-sm font-medium mb-1 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Comparison
          </p>
          <p className="text-sm text-muted-foreground">{study.Comparison}</p>
        </div>

        {/* ISRCTN */}
        <div>
          <p className="text-sm font-medium mb-1">ISRCTN Number</p>
          <code className="text-xs bg-muted px-2 py-1 rounded">{study.ISRCTN}</code>
        </div>

        {/* Contact */}
        <div>
          <p className="text-sm font-medium mb-1 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Trialist Contact
          </p>
          <p className="text-sm text-muted-foreground">{study.TrialistContactDetails}</p>
        </div>

        {/* Notes */}
        {study.Notes && (
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm font-medium mb-1 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Notes
            </p>
            <p className="text-sm text-muted-foreground">{study.Notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

