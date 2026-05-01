"use client";

import { Card } from "@heroui/react";
import { ProjectCard } from "./ProjectCard";

interface ProjectListProps {
  projects: Array<{
    id: string;
    title: string;
    idea: string;
    docType: string;
    status: string;
    agents?: { id: string }[];
  }>;
  onDelete?: (id: string) => void;
}

export function ProjectList({ projects, onDelete }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <Card className="w-full">
        <Card.Content className="text-center py-12">
          <p className="text-default-500">No projects yet. Create your first project!</p>
        </Card.Content>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project as any}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}