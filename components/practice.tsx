"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Settings } from "lucide-react";
import { usePracticeSetCreator } from "@/hooks/usePracticeSetCreator";
import { STATUS_LABELS, DIFFICULTY_LABELS } from "@/lib/types/practice-set";

const CustomPracticeSetCreator: React.FC = () => {
  const {
    loading,
    creating,
    filterCounts,
    availableFilters,
    form,
    estimatedCount,
    updateForm,
    toggleSystem,
    toggleDiscipline,
    toggleDifficulty,
    toggleStatusFilter,
    resetForm,
    createPracticeSet,
  } = usePracticeSetCreator();

  const handleCreateAndNavigate = async () => {
    const result = await createPracticeSet();
    if (result) {
      // Navigate to the created practice set
      window.location.href = `/practice/${result.id}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading filters...</span>
      </div>
    );
  }

  return (
    <div className=" p-6 space-y-6">
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Custom Practice Set
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="flex flex-col-2 space-y-4 gap-2">
            <div className="flex-1">
              <Label htmlFor="name">Practice Set Name *</Label>
              <Input
                id="name"
                placeholder="Enter practice set name"
                value={form.name}
                onChange={(e) => updateForm({ name: e.target.value })}
              />
            </div>


            <div className="flex-1">
              <Label htmlFor="maxQuestions">Maximum Questions *</Label>
              <Input
                id="maxQuestions"
                type="number"
                min="1"
                max="100"
                value={form.maxQuestions}
                onChange={(e) =>
                  updateForm({ maxQuestions: parseInt(e.target.value) || 1 })
                }
              />
            </div>
          </div>

          <Separator />

          {/* Filters Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Question Filters</h3>
              <Badge variant="outline">
                ~{Math.min(estimatedCount, form.maxQuestions)} questions will be
                selected
              </Badge>
            </div>

            {/* Systems Filter */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Body Systems</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableFilters.systems.map((system) => (
                  <div key={system} className="flex items-center space-x-2">
                    <Checkbox
                      id={`system-${system}`}
                      checked={form.filters.systems.includes(system)}
                      onCheckedChange={() => toggleSystem(system)}
                    />
                    <Label htmlFor={`system-${system}`} className="text-sm">
                      {system} ({filterCounts.systems[system] || 0})
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Disciplines Filter */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Medical Disciplines
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableFilters.disciplines.map((discipline) => (
                  <div key={discipline} className="flex items-center space-x-2">
                    <Checkbox
                      id={`discipline-${discipline}`}
                      checked={form.filters.disciplines.includes(discipline)}
                      onCheckedChange={() => toggleDiscipline(discipline)}
                    />
                    <Label
                      htmlFor={`discipline-${discipline}`}
                      className="text-sm"
                    >
                      {discipline} ({filterCounts.disciplines[discipline] || 0})
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Question Status Filters */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Question Status</Label>
                {(form.filters.systems.length > 0 ||
                  form.filters.disciplines.length > 0) && (
                  <Badge variant="secondary" className="text-xs">
                    Filtered by selection
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-used"
                    checked={form.filters.includeUsed}
                    onCheckedChange={() => toggleStatusFilter("includeUsed")}
                  />
                  <Label htmlFor="include-used" className="text-sm">
                    {STATUS_LABELS.includeUsed} ({filterCounts.usedQuestions})
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-unused"
                    checked={form.filters.includeUnused}
                    onCheckedChange={() => toggleStatusFilter("includeUnused")}
                  />
                  <Label htmlFor="include-unused" className="text-sm">
                    {STATUS_LABELS.includeUnused} (
                    {filterCounts.unusedQuestions})
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-correct"
                    checked={form.filters.includeCorrect}
                    onCheckedChange={() => toggleStatusFilter("includeCorrect")}
                  />
                  <Label htmlFor="include-correct" className="text-sm">
                    {STATUS_LABELS.includeCorrect} (
                    {filterCounts.correctQuestions})
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-incorrect"
                    checked={form.filters.includeIncorrect}
                    onCheckedChange={() =>
                      toggleStatusFilter("includeIncorrect")
                    }
                  />
                  <Label htmlFor="include-incorrect" className="text-sm">
                    {STATUS_LABELS.includeIncorrect} (
                    {filterCounts.incorrectQuestions})
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-marked"
                    checked={form.filters.includeMarked}
                    onCheckedChange={() => toggleStatusFilter("includeMarked")}
                  />
                  <Label htmlFor="include-marked" className="text-sm">
                    {STATUS_LABELS.includeMarked} (
                    {filterCounts.markedQuestions})
                  </Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Difficulty Filters */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">
                  Difficulty Level
                </Label>
                {(form.filters.systems.length > 0 ||
                  form.filters.disciplines.length > 0) && (
                  <Badge variant="secondary" className="text-xs">
                    Filtered by selection
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(["EASY", "MEDIUM", "HARD"] as const).map((difficulty) => (
                  <div key={difficulty} className="flex items-center space-x-2">
                    <Checkbox
                      id={`difficulty-${difficulty.toLowerCase()}`}
                      checked={form.filters.difficulties.includes(difficulty)}
                      onCheckedChange={() => toggleDifficulty(difficulty)}
                    />
                    <Label
                      htmlFor={`difficulty-${difficulty.toLowerCase()}`}
                      className="text-sm"
                    >
                      ⚖️ {DIFFICULTY_LABELS[difficulty]} (
                      {difficulty === "EASY"
                        ? filterCounts.easyQuestions
                        : difficulty === "MEDIUM"
                          ? filterCounts.mediumQuestions
                          : filterCounts.hardQuestions}
                      )
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={resetForm}>
              Reset
            </Button>
            <Button
              onClick={handleCreateAndNavigate}
              disabled={creating || !form.name.trim() || estimatedCount === 0}
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Practice Set
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomPracticeSetCreator;
