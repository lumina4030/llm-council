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
  idle: { bg: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300", icon: Clock },
  running: { bg: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400", icon: Play },
  completed: { bg: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400", icon: CheckCircle },
  failed: { bg: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400", icon: XCircle },
};

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const config = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.idle;
  const StatusIcon = config.icon;

  return (
    <Card className="w-full card-hover bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden group">
      <Card.Header className="flex justify-between items-center p-5">
        <h3 className="text-lg font-semibold group-hover:text-warning transition-colors">{project.title}</h3>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${config.bg}`}>
          <StatusIcon size={12} />
          {project.status}
        </span>
      </Card.Header>
      <Card.Content className="px-5 pb-5">
        <p className="text-sm text-default-500 line-clamp-2 mb-4">{project.idea}</p>
        <div className="flex items-center gap-3">
          <span className="inline-block px-2.5 py-1 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/50">
            {project.docType.toUpperCase()}
          </span>
          <span className="text-xs text-default-400">
            {project.agents?.length || 0} agents
          </span>
        </div>
      </Card.Content>
      <Card.Footer className="px-5 pb-5 pt-0 gap-2">
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-warning-500 to-warning-600 text-white hover:from-warning-600 hover:to-warning-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
        >
          <Play size={16} />
          Open
        </Link>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(project.id)}
            className="px-4 py-2 text-sm font-medium rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Delete
          </button>
        )}
      </Card.Footer>
    </Card>
  );
}