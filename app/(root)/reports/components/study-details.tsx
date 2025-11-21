"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    description: string;
  }>;
  conditions: Array<{
    id: number;
    description: string;
  }>;
  outcomes: Array<{
    id: number;
    description: string;
  }>;
  design?: string[] | null;
  loading?: boolean;
}

export function StudyDetails({ interventions, conditions, outcomes, design, loading = false }: StudyDetailsProps) {
  const designArray = design || [];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Study Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="font-medium">Loading study details...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Study Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
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
                {interventions.length > 0 ? (
                  interventions.map((intervention) => (
                    <div key={intervention.id} className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm">{intervention.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No interventions available
                  </p>
                )}
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
                {conditions.length > 0 ? (
                  conditions.map((condition) => (
                    <div key={condition.id} className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm">{condition.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No conditions available
                  </p>
                )}
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
              <div className="space-y-2 pt-2">
                {outcomes.length > 0 ? (
                  outcomes.map((outcome) => (
                    <div key={outcome.id} className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm">{outcome.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No outcomes available
                  </p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Study Design */}
          <AccordionItem value="design">
            <AccordionTrigger className="text-sm font-medium hover:no-underline">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Study Design {designArray.length > 0 && `(${designArray.length})`}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {designArray.length > 0 ? (
                  designArray.map((item, index) => (
                    <div key={index} className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm">{item}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No design information available
                  </p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

