"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Stethoscope, 
  Target, 
  Beaker,
  Info,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface StudyDetailsProps {
  interventions: Array<{
    id: number;
    name: string;
    type: string;
  }>;
  conditions: Array<{
    id: number;
    name: string;
    category: string;
  }>;
  outcomes: Array<{
    id: number;
    name: string;
    type: string;
    timeframe: string;
  }>;
  design: {
    type: string;
    phase: string;
    allocation: string;
    masking: string;
    assignment: string;
    enrollment: number;
    arms: number;
  };
}

export function StudyDetails({ interventions, conditions, outcomes, design }: StudyDetailsProps) {
  const primaryOutcomes = outcomes.filter(o => o.type === "Primary");
  const secondaryOutcomes = outcomes.filter(o => o.type === "Secondary");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Study Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={["interventions", "conditions", "outcomes", "design"]} className="w-full">
          {/* Interventions */}
          <AccordionItem value="interventions">
            <AccordionTrigger className="text-sm font-medium hover:no-underline">
              <div className="flex items-center gap-2">
                <Beaker className="h-4 w-4" />
                Interventions ({interventions.length})
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {interventions.map((intervention) => (
                  <div key={intervention.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{intervention.name}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {intervention.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Conditions */}
          <AccordionItem value="conditions">
            <AccordionTrigger className="text-sm font-medium hover:no-underline">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Conditions ({conditions.length})
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {conditions.map((condition) => (
                  <div key={condition.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{condition.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{condition.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Outcomes */}
          <AccordionItem value="outcomes">
            <AccordionTrigger className="text-sm font-medium hover:no-underline">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Outcomes ({outcomes.length})
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                {primaryOutcomes.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Primary Outcomes</p>
                    <div className="space-y-2">
                      {primaryOutcomes.map((outcome) => (
                        <div key={outcome.id} className="p-3 rounded-lg border bg-card">
                          <p className="text-sm font-medium">{outcome.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Timeframe: {outcome.timeframe}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {secondaryOutcomes.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Secondary Outcomes</p>
                    <div className="space-y-2">
                      {secondaryOutcomes.map((outcome) => (
                        <div key={outcome.id} className="p-3 rounded-lg bg-muted">
                          <p className="text-sm font-medium">{outcome.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Timeframe: {outcome.timeframe}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Study Design */}
          <AccordionItem value="design">
            <AccordionTrigger className="text-sm font-medium hover:no-underline">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Study Design
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm font-medium mt-1">{design.type}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Phase</p>
                  <p className="text-sm font-medium mt-1">{design.phase}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Allocation</p>
                  <p className="text-sm font-medium mt-1">{design.allocation}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Masking</p>
                  <p className="text-sm font-medium mt-1">{design.masking}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Assignment</p>
                  <p className="text-sm font-medium mt-1">{design.assignment}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Arms</p>
                  <p className="text-sm font-medium mt-1">{design.arms}</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

