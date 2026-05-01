"use client";

import { Card } from "@heroui/react";
import { Play, CheckCircle, XCircle, Clock } from "lucide-react";
import Link from "next/link";
import type { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
  onDelete?: (id: string) => void;
}

const statusConfig = {
  idle: { bg: "bg-gray-100 text-gray-700", icon: Clock },
  running: { bg: "bg-yellow-100 text-yellow-700", icon: Play },
  completed: { bg: "bg-green-100 text-green-700", icon: CheckCircle },
  failed: { bg: "bg-red-100 text-red-700", icon: XCircle },
};

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const config = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.idle;
  const StatusIcon = config.icon;

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <Card.Header className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{project.title}</h3>
        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config.bg}`}>
          <StatusIcon size={12} />
          {project.status}
        </span>
      </Card.Header>
      <Card.Content>
        <p className="text-sm text-gray-500 line-clamp-2">{project.idea}</p>
        <div className="mt-2">
          <span className="inline-block px-2 py-0.5 text-xs font-medium border border-gray-300 rounded">
            {project.docType.toUpperCase()}
          </span>
          <span className="ml-2 text-xs text-gray-400">
            {project.agents?.length || 0} agents
          </span>
        </div>
      </Card.Content>
      <Card.Footer className="gap-2">
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-warning-500 text-white hover:bg-warning-600 transition-colors"
        >
          <Play size={16} />
          Open
        </Link>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(project.id)}
            className="px-3 py-1.5 text-sm font-medium rounded-lg text-red-600 hover:bg-red-100 transition-colors"
          >
            Delete
          </button>
        )}
      </Card.Footer>
    </Card>
  );
}