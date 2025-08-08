"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Play,
  Trash2,
  Calendar,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { PracticeSetStatus } from "@/app/generated/prisma";

// Types

interface CustomPracticeSet {
  id: string;
  name: string;
  description?: string | null;
  totalQuestions: number;
  createdAt: Date;
  lastAttempted: Date | null;
  bestScore: number | null;
  status: PracticeSetStatus;
}

interface StatusBadgeConfig {
  variant: "default" | "secondary" | "destructive" | "outline";
  text: string;
}

interface CreatePracticeSetForm {
  name: string;
  description: string;
  totalQuestions: number;
  selectedTopics: string[];
}

interface CustomPracticeSetsPageProps {
  initialPracticeSets: CustomPracticeSet[];
  userId: string;
}

const getStatusBadge = (status: PracticeSetStatus): React.ReactElement => {
  const variants: Record<PracticeSetStatus, StatusBadgeConfig> = {
    NOT_STARTED: { variant: "secondary", text: "Not Started" },
    IN_PROGRESS: { variant: "default", text: "In Progress" },
    COMPLETED: { variant: "outline", text: "Completed" },
    PAUSED: { variant: "outline", text: "Paused" },
  };

  const config = variants[status] || variants["NOT_STARTED"];
  return (
    <Badge variant={config.variant} className="capitalize">
      {config.text}
    </Badge>
  );
};

const formatDate = (date: Date | string | null): string => {
  if (!date) return "Never";

  // Handle both Date objects and ISO strings
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Check if the date is valid
  if (isNaN(dateObj.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(dateObj);
};

const getScorePercentage = (
  score: number | null,
  total: number
): number | null => {
  if (!score || !total) return null;
  return Math.round((score / total) * 100);
};

export default function CustomPracticeSetsPage({
  initialPracticeSets,
  userId,
}: CustomPracticeSetsPageProps): React.ReactElement {
  const [practiceSets, setPracticeSets] =
    useState<CustomPracticeSet[]>(initialPracticeSets);
  const [form, setForm] = useState<CreatePracticeSetForm>({
    name: "",
    description: "",
    totalQuestions: 10,
    selectedTopics: [],
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [practiceSetToDelete, setPracticeSetToDelete] =
    useState<CustomPracticeSet | null>(null);

  const handleInputChange = (
    field: keyof CreatePracticeSetForm,
    value: string | number
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleTopicToggle = (topicId: string, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      selectedTopics: checked
        ? [...prev.selectedTopics, topicId]
        : prev.selectedTopics.filter((id) => id !== topicId),
    }));
  };

  const handleStartPractice = async (practiceSetId: string) => {
    // Navigate to practice session or handle start logic
    window.location.href = `/dashboard/question/${practiceSetId}`;
  };

  const handleDeleteClick = (practiceSet: CustomPracticeSet) => {
    setPracticeSetToDelete(practiceSet);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!practiceSetToDelete) return;

    try {
      const response = await fetch(
        `/api/custom-practice-sets/${practiceSetToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setPracticeSets((prev) =>
          prev.filter((set) => set.id !== practiceSetToDelete.id)
        );
      }
    } catch (error) {
      console.error("Error deleting practice set:", error);
    } finally {
      setDeleteDialogOpen(false);
      setPracticeSetToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPracticeSetToDelete(null);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Custom Practice Sets
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your personalized practice sessions
          </p>
        </div>
      </div>

      {practiceSets.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="pt-6">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No practice sets yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first custom practice set to get started
            </p>
            <Link href={"/dashboard/practice"}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Set
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Name
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Questions
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Status
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Best Score
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Last Attempted
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Created
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[50px]"></th>
              </tr>
            </thead>
            <tbody>
              {practiceSets.map((practiceSet) => {
                const scorePercentage = getScorePercentage(
                  practiceSet.bestScore,
                  practiceSet.totalQuestions
                );

                return (
                  <tr
                    key={practiceSet.id}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-4 align-middle">
                      <div>
                        <div className="font-medium">{practiceSet.name}</div>
                        {practiceSet.description && (
                          <div className="text-sm text-muted-foreground">
                            {practiceSet.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 align-middle font-medium">
                      {practiceSet.totalQuestions}
                    </td>
                    <td className="p-4 align-middle">
                      {getStatusBadge(practiceSet.status)}
                    </td>
                    <td className="p-4 align-middle">
                      {scorePercentage ? (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {scorePercentage}%
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({practiceSet.bestScore}/
                            {practiceSet.totalQuestions})
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-4 align-middle text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(practiceSet.lastAttempted)}
                      </div>
                    </td>
                    <td className="p-4 align-middle text-sm text-muted-foreground">
                      {formatDate(practiceSet.createdAt)}
                    </td>
                    <td className="p-4 align-middle">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleStartPractice(practiceSet.id)}
                            className="flex items-center gap-2"
                          >
                            <Play className="h-4 w-4" />
                            Start Practice
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(practiceSet)}
                            className="flex items-center gap-2 text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Set
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Practice Set</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{practiceSetToDelete?.name}"?
              This action cannot be undone and will permanently remove the
              practice set and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
