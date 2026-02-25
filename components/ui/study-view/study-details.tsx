"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Stethoscope, 
  Target, 
  Beaker,
  Info,
  UserRound,
  CircleDashed,
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
  persons?: string[] | null;
  loading?: boolean;
}

const categoryConfig = {
  interventions: {
    icon: Beaker,
    label: "Interventions",
    accentClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-950/30",
    borderClass: "border-l-blue-500",
  },
  conditions: {
    icon: Stethoscope,
    label: "Conditions",
    accentClass: "text-rose-600 dark:text-rose-400",
    bgClass: "bg-rose-50 dark:bg-rose-950/30",
    borderClass: "border-l-rose-500",
  },
  outcomes: {
    icon: Target,
    label: "Outcomes",
    accentClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/30",
    borderClass: "border-l-emerald-500",
  },
  design: {
    icon: Activity,
    label: "Study Design",
    accentClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-950/30",
    borderClass: "border-l-amber-500",
  },
  persons: {
    icon: UserRound,
    label: "Persons",
    accentClass: "text-violet-600 dark:text-violet-400",
    bgClass: "bg-violet-50 dark:bg-violet-950/30",
    borderClass: "border-l-violet-500",
  },
};

export function StudyDetails({ interventions, conditions, outcomes, design, persons, loading = false }: StudyDetailsProps) {
  const designArray = design || [];
  const personsArray = persons || [];

  if (loading) {
    return (
      <Card className="border-none shadow-none py-0"> 
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2.5 text-base">
            <div className="p-1.5 rounded-md bg-muted">
              <Info className="h-4 w-4" />
            </div>
            Study Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mb-4"></div>
            <p className="text-sm font-medium">Loading study details...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderCategoryItems = (
    items: Array<{ id?: number; description?: string }> | string[],
    category: keyof typeof categoryConfig,
    emptyMessage: string
  ) => {
    const config = categoryConfig[category];
    
    if (items.length === 0) {
      return (
        <div className="flex items-center gap-3 py-6 px-4 text-muted-foreground">
          <CircleDashed className="h-4 w-4 opacity-50" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-2 py-3">
        {items.map((item, index) => {
          const text = typeof item === "string" ? item : item.description;
          const key = typeof item === "string" ? index : item.id ?? index;
          
          return (
            <div 
              key={key} 
              className={`p-3.5 rounded-md border-l-2 ${config.borderClass} ${config.bgClass} transition-colors`}
            >
              <p className="text-sm leading-relaxed">{text}</p>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAccordionItem = (
    value: string,
    category: keyof typeof categoryConfig,
    count: number,
    children: React.ReactNode
  ) => {
    const config = categoryConfig[category];
    const Icon = config.icon;

    return (
      <AccordionItem value={value} className="border-b border-border/50 last:border-b-0">
        <AccordionTrigger className="py-4 hover:no-underline hover:bg-muted/30 px-1 rounded-md transition-colors">
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-md ${config.bgClass}`}>
              <Icon className={`h-4 w-4 ${config.accentClass}`} />
            </div>
            <span className="text-sm font-medium">{config.label}</span>
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs font-normal">
              {count}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-2 pt-0 px-1">
          {children}
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <Card className="border-none shadow-none py-0">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2.5 text-base">
          <div className="p-1.5 rounded-md bg-muted">
            <Info className="h-4 w-4" />
          </div>
          Study Details
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4">
        <Accordion type="multiple" className="w-full">
          {renderAccordionItem(
            "interventions",
            "interventions",
            interventions.length,
            renderCategoryItems(interventions, "interventions", "No interventions available")
          )}

          {renderAccordionItem(
            "conditions",
            "conditions",
            conditions.length,
            renderCategoryItems(conditions, "conditions", "No conditions available")
          )}

          {renderAccordionItem(
            "outcomes",
            "outcomes",
            outcomes.length,
            renderCategoryItems(outcomes, "outcomes", "No outcomes available")
          )}

          {renderAccordionItem(
            "design",
            "design",
            designArray.length,
            renderCategoryItems(designArray, "design", "No design information available")
          )}

          {renderAccordionItem(
            "persons",
            "persons",
            personsArray.length,
            renderCategoryItems(personsArray, "persons", "No persons information available")
          )}
        </Accordion>
      </CardContent>
    </Card>
  );
}

