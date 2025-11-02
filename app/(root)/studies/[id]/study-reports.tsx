"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  ExternalLink, 
  ChevronDown,
  ChevronRight,
  User,
  BookOpen,
  Calendar,
  Link as LinkIcon,
} from "lucide-react";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Report {
  CENTRALReportID: number;
  Title: string;
  Authors: string;
  Journal: string;
  Year: number;
  Volume: number;
  Issue: string;
  Pages: string;
  Language: string;
  Abstract: string;
  DOI: string;
  PMID: string;
  StudyDesign: string;
  UDef8: string;
  PDFLinks: string;
  Notes: string;
}

interface Person {
  id: number;
  name: string;
  role: string;
  affiliation: string;
  email: string;
}

interface StudyReportsProps {
  reports: Report[];
  persons: Person[];
}

export function StudyReports({ reports, persons }: StudyReportsProps) {
  const [expandedReports, setExpandedReports] = useState<Set<number>>(new Set([reports[0]?.CENTRALReportID]));

  const toggleReport = (reportId: number) => {
    setExpandedReports(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      {/* Reports Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Associated Reports ({reports.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reports.map((report, index) => {
            const isExpanded = expandedReports.has(report.CENTRALReportID);
            const reportTypeColor = report.UDef8 === "Primary" ? "bg-blue-500" : "bg-gray-500";

            return (
              <div key={report.CENTRALReportID} className="border rounded-lg overflow-hidden">
                {/* Report header - always visible */}
                <button
                  onClick={() => toggleReport(report.CENTRALReportID)}
                  className="w-full p-4 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium leading-tight">{report.Title}</h4>
                        <Badge className={reportTypeColor}>{report.UDef8}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {report.Authors}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {report.Journal}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {report.Year}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t bg-muted/20">
                    {/* Abstract */}
                    <div className="pt-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Abstract</p>
                      <p className="text-sm leading-relaxed">{report.Abstract}</p>
                    </div>

                    {/* Publication details */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Volume/Issue</p>
                        <p className="text-sm font-medium">{report.Volume}({report.Issue})</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pages</p>
                        <p className="text-sm font-medium">{report.Pages}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Study Design</p>
                        <p className="text-sm font-medium">{report.StudyDesign}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Language</p>
                        <p className="text-sm font-medium">{report.Language}</p>
                      </div>
                    </div>

                    {/* IDs and links */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-12">DOI:</span>
                        <code className="text-xs bg-background px-2 py-0.5 rounded flex-1 truncate">{report.DOI}</code>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 px-2"
                          onClick={() => window.open(`https://doi.org/${report.DOI}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-12">PMID:</span>
                        <code className="text-xs bg-background px-2 py-0.5 rounded flex-1">{report.PMID}</code>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 px-2"
                          onClick={() => window.open(`https://pubmed.ncbi.nlm.nih.gov/${report.PMID}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* PDF Link */}
                    {report.PDFLinks && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => window.open(report.PDFLinks, '_blank')}
                      >
                        <LinkIcon className="h-4 w-4 mr-2" />
                        View PDF
                      </Button>
                    )}

                    {/* Notes */}
                    {report.Notes && (
                      <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                        <p className="text-xs font-medium mb-1">Notes</p>
                        <p className="text-xs text-muted-foreground">{report.Notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Persons Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Associated Persons ({persons.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {persons.map((person) => (
              <div key={person.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">{person.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{person.affiliation}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {person.role}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{person.email}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

