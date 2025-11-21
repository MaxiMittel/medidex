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
  Calendar,
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
    DateEntered?: string;
    DateEdited?: string;
    TrialRegistrationID?: string;
    CENTRALStudyID?: number;
    CRGStudyID?: number;
  };
}

export function StudyOverview({ study }: StudyOverviewProps) {
  const countries = study.Countries.split("//").filter(Boolean);
  
  const statusVariant = {
    "Completed": "default" as const,
    "Active": "default" as const,
    "Ongoing": "default" as const,
    "Recruiting": "secondary" as const,
    "Terminated": "destructive" as const,
    "Pending": "secondary" as const,
  }[study.StatusofStudy] || "secondary" as const;

  const submissionVariant = {
    "Approved": "default" as const,
    "In Progress": "secondary" as const,
    "Pending": "secondary" as const,
    "Rejected": "destructive" as const,
  }[study.CENTRALSubmissionStatus] || "secondary" as const;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Study Overview
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant={statusVariant}>{study.StatusofStudy}</Badge>
            <Badge variant={submissionVariant}>
              {study.CENTRALSubmissionStatus}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key metrics grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
            <Users className="h-5 w-5 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Participants</p>
              <p className="text-lg font-semibold">{study.NumberParticipants}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
            <Clock className="h-5 w-5 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="text-lg font-semibold">{study.Duration}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
            <MapPin className="h-5 w-5 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Countries</p>
              <p className="text-lg font-semibold">{countries.length}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
            <Hash className="h-5 w-5 mt-0.5" />
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

        {/* Trial IDs */}
        <div className="grid grid-cols-2 gap-4">
          {study.ISRCTN && (
            <div>
              <p className="text-sm font-medium mb-1">ISRCTN Number</p>
              <code className="text-xs bg-muted px-2 py-1 rounded block">{study.ISRCTN}</code>
            </div>
          )}
          {study.TrialRegistrationID && (
            <div>
              <p className="text-sm font-medium mb-1">Trial Registration ID</p>
              <code className="text-xs bg-muted px-2 py-1 rounded block">{study.TrialRegistrationID}</code>
            </div>
          )}
          {study.CRGStudyID && (
            <div>
              <p className="text-sm font-medium mb-1">CRG Study ID</p>
              <code className="text-xs bg-muted px-2 py-1 rounded block">{study.CRGStudyID}</code>
            </div>
          )}
          {study.CENTRALStudyID && (
            <div>
              <p className="text-sm font-medium mb-1">CENTRAL Study ID</p>
              <code className="text-xs bg-muted px-2 py-1 rounded block">{study.CENTRALStudyID}</code>
            </div>
          )}
        </div>

        {/* Contact */}
        <div>
          <p className="text-sm font-medium mb-1 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Trialist Contact
          </p>
          <p className="text-sm text-muted-foreground">{study.TrialistContactDetails}</p>
        </div>

        {/* Dates */}
        {(study.DateEntered || study.DateEdited) && (
          <div className="grid grid-cols-2 gap-4">
            {study.DateEntered && (
              <div>
                <p className="text-sm font-medium mb-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date Entered
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(study.DateEntered).toLocaleDateString()}
                </p>
              </div>
            )}
            {study.DateEdited && (
              <div>
                <p className="text-sm font-medium mb-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date Edited
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(study.DateEdited).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {study.Notes && (
          <div className="p-3 rounded-lg border">
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

