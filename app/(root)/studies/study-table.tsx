"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface StudyTableProps {
  studies: {
    id: string;
    title: string;
    description: string | null;
    status: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
    createdAt: Date;
    updatedAt: Date;
    createdById: string;
  }[];
}

const statusColors = {
  DRAFT: "bg-gray-500",
  ACTIVE: "bg-green-500",
  COMPLETED: "bg-blue-500",
  ARCHIVED: "bg-orange-500",
} as const;

export function StudyTable({ studies }: StudyTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredStudies = studies.filter((study) =>
    study.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (study.description && study.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRowClick = (studyId: string) => {
    router.push(`/studies/${studyId}`);
  };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search studies by title or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No studies found
                </TableCell>
              </TableRow>
            ) : (
              filteredStudies.map((study) => (
                <TableRow 
                  key={study.id}
                  onClick={() => handleRowClick(study.id)}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium">{study.title}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {study.description || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[study.status]}>
                      {study.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(study.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(study.updatedAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredStudies.length} of {studies.length} studies
      </p>
    </div>
  );
}

