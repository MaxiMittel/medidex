import { StudyTable } from "./study-table";

export default async function StudiesPage() {
  // Placeholder studies data for design evaluation
  const studies = [
    {
      id: "1",
      title: "COVID-19 Vaccine Efficacy Study",
      description: "A comprehensive study analyzing the long-term efficacy of COVID-19 vaccines across different age groups and demographics.",
      status: "ACTIVE" as const,
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-10-20"),
      createdById: "user1",
    },
    {
      id: "2",
      title: "Diabetes Prevention Trial",
      description: "Evaluating lifestyle interventions for preventing type 2 diabetes in high-risk populations.",
      status: "ACTIVE" as const,
      createdAt: new Date("2024-02-01"),
      updatedAt: new Date("2024-10-25"),
      createdById: "user2",
    },
    {
      id: "3",
      title: "Cardiovascular Health Research",
      description: "Multi-year study on cardiovascular disease prevention through diet and exercise.",
      status: "COMPLETED" as const,
      createdAt: new Date("2023-06-10"),
      updatedAt: new Date("2024-09-30"),
      createdById: "user1",
    },
    {
      id: "4",
      title: "Mental Health Assessment",
      description: null,
      status: "DRAFT" as const,
      createdAt: new Date("2024-10-01"),
      updatedAt: new Date("2024-10-15"),
      createdById: "user3",
    },
    {
      id: "5",
      title: "Cancer Treatment Protocol",
      description: "Investigating novel immunotherapy approaches for various cancer types.",
      status: "ACTIVE" as const,
      createdAt: new Date("2024-03-20"),
      updatedAt: new Date("2024-10-28"),
      createdById: "user2",
    },
    {
      id: "6",
      title: "Neurological Disorder Study",
      description: "Research into early detection and treatment of neurodegenerative diseases.",
      status: "ARCHIVED" as const,
      createdAt: new Date("2022-11-05"),
      updatedAt: new Date("2023-12-31"),
      createdById: "user1",
    },
    {
      id: "7",
      title: "Pediatric Nutrition Research",
      description: "Examining the impact of nutrition on childhood development and health outcomes.",
      status: "ACTIVE" as const,
      createdAt: new Date("2024-04-12"),
      updatedAt: new Date("2024-10-22"),
      createdById: "user3",
    },
    {
      id: "8",
      title: "Sleep Pattern Analysis",
      description: "Analyzing the relationship between sleep patterns and overall health in adults.",
      status: "COMPLETED" as const,
      createdAt: new Date("2023-08-15"),
      updatedAt: new Date("2024-08-15"),
      createdById: "user2",
    },
  ];

  return (
    <div className="p-4 md:px-8 md:py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Studies</h1>
        <p className="text-sm text-gray-500">
          View and manage all studies in the system
        </p>
      </div>
      
      <StudyTable studies={studies} />
    </div>
  );
}

