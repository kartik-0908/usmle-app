"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Plus,
  MoreHorizontal,
  Play,
  Edit,
  Trash2,
  Calendar,
  Target,
  BookOpen,
  Loader2,
} from "lucide-react";

// Types
type PracticeSetStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "PAUSED";

interface Topic {
  id: string;
  name: string;
  slug: string;
  stepId: string;
  isActive: boolean;
}

interface Step {
  id: string;
  name: string;
  slug: string;
  stepNumber: number;
  isActive: boolean;
  topics: Topic[];
}

interface CustomPracticeSet {
  id: string;
  name: string;
  description?: string | null;
  totalQuestions: number;
  topicCount: number;
  topics: string[];
  status: PracticeSetStatus;
  createdAt: Date;
  lastAttempted: Date | null;
  bestScore: number | null;
  attempts: number;
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
  steps: Step[];
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
  steps,
  userId,
}: CustomPracticeSetsPageProps): React.ReactElement {
  const [practiceSets, setPracticeSets] =
    useState<CustomPracticeSet[]>(initialPracticeSets);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<CreatePracticeSetForm>({
    name: "",
    description: "",
    totalQuestions: 10,
    selectedTopics: [],
  });

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

  const handleCreatePracticeSet = async () => {
    if (!form.name || form.selectedTopics.length === 0) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/custom-practice-sets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          userId,
        }),
      });

      if (response.ok) {
        const newPracticeSet = await response.json();
        console.log("New practice set created:", newPracticeSet);
        setPracticeSets((prev) => [newPracticeSet, ...prev]);
        setIsDialogOpen(false);
        setForm({
          name: "",
          description: "",
          totalQuestions: 10,
          selectedTopics: [],
        });
      }
    } catch (error) {
      console.error("Error creating practice set:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartPractice = async (practiceSetId: string) => {
    // Navigate to practice session or handle start logic
    window.location.href = `/dashboard/question/${practiceSetId}`;
  };

  const handleEditSet = (practiceSetId: string) => {
    // Navigate to edit page or open edit dialog
    console.log("Edit set:", practiceSetId);
  };

  const handleDeleteSet = async (practiceSetId: string) => {
    if (!confirm("Are you sure you want to delete this practice set?")) return;

    try {
      const response = await fetch(
        `/api/custom-practice-sets/${practiceSetId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setPracticeSets((prev) =>
          prev.filter((set) => set.id !== practiceSetId)
        );
      }
    } catch (error) {
      console.error("Error deleting practice set:", error);
    }
  };

  const selectedTopicNames = steps
    .flatMap((step) => step.topics)
    .filter((topic) => form.selectedTopics.includes(topic.id))
    .map((topic) => topic.name);

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
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create New Set
        </Button>
      </div>

      {practiceSets.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="pt-6">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No practice sets yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first custom practice set to get started
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Set
            </Button>
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
                  Topics
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
                    <td className="p-4 align-middle">
                      <div className="flex flex-wrap gap-1">
                        {practiceSet.topics.slice(0, 2).map((topic, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {topic}
                          </Badge>
                        ))}
                        {practiceSet.topics.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{practiceSet.topics.length - 2} more
                          </Badge>
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
                            onClick={() => handleDeleteSet(practiceSet.id)}
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

      {/* Create Practice Set Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Practice Set</DialogTitle>
            <DialogDescription>
              Choose topics and set the number of questions for your custom
              practice session.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Practice Set Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter a name for your practice set"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={form.description || ""}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Describe what this practice set covers"
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="totalQuestions">Total Questions</Label>
                <Input
                  id="totalQuestions"
                  type="number"
                  min="1"
                  max="100"
                  value={form.totalQuestions}
                  onChange={(e) =>
                    handleInputChange(
                      "totalQuestions",
                      parseInt(e.target.value) || 1
                    )
                  }
                  className="mt-1"
                />
              </div>
            </div>

            {/* Topic Selection */}
            <div>
              <Label className="text-base font-medium">Select Topics</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Choose the topics you want to practice. Questions will be
                randomly selected from these topics.
              </p>

              {form.selectedTopics.length > 0 && (
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">
                    Selected Topics ({form.selectedTopics.length}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedTopicNames.map((topicName, index) => (
                      <Badge key={index} variant="default" className="text-xs">
                        {topicName}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Accordion type="multiple" className="w-full">
                {steps
                  .filter((step) => step.isActive)
                  .map((step) => (
                    <AccordionItem key={step.id} value={step.id}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center justify-between w-full mr-4">
                          <span>{step.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {
                              step.topics.filter((topic) => topic.isActive)
                                .length
                            }{" "}
                            topics
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          {step.topics
                            .filter((topic) => topic.isActive)
                            .map((topic) => (
                              <div
                                key={topic.id}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={topic.id}
                                  checked={form.selectedTopics.includes(
                                    topic.id
                                  )}
                                  onCheckedChange={(checked) =>
                                    handleTopicToggle(
                                      topic.id,
                                      checked as boolean
                                    )
                                  }
                                />
                                <Label
                                  htmlFor={topic.id}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {topic.name}
                                </Label>
                              </div>
                            ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
              </Accordion>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePracticeSet}
              disabled={
                !form.name || form.selectedTopics.length === 0 || isCreating
              }
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Practice Set
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
