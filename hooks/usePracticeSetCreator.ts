// hooks/usePracticeSetCreator.ts
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  FilterCounts,
  CreatePracticeSetFilters,
  PracticeSetForm,
  AvailableFilters,
  FilterDataResponse,
  CreatePracticeSetResponse,
  INITIAL_FORM,
} from "@/lib/types/practice-set";

export const usePracticeSetCreator = () => {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updatingCounts, setUpdatingCounts] = useState(false);
  const [filterCounts, setFilterCounts] = useState<FilterCounts>({
    systems: {},
    disciplines: {},
    usedQuestions: 0,
    unusedQuestions: 0,
    correctQuestions: 0,
    incorrectQuestions: 0,
    markedQuestions: 0,
    easyQuestions: 0,
    mediumQuestions: 0,
    hardQuestions: 0,
    total: 0,
  });

  const [availableFilters, setAvailableFilters] = useState<AvailableFilters>({
    systems: [],
    disciplines: [],
  });

  const [form, setForm] = useState<PracticeSetForm>(INITIAL_FORM);
  const [estimatedCount, setEstimatedCount] = useState(0);

  // Fetch filter counts and available options
  const fetchFilterData = useCallback(
    async (
      selectedSystems: string[] = [],
      selectedDisciplines: string[] = []
    ) => {
      try {
        if (loading) {
          setLoading(true);
        } else {
          setUpdatingCounts(true);
        }

        // Build query parameters for dynamic filtering
        const params = new URLSearchParams();
        if (selectedSystems.length > 0) {
          params.append("systems", selectedSystems.join(","));
        }
        if (selectedDisciplines.length > 0) {
          params.append("disciplines", selectedDisciplines.join(","));
        }

        const response = await fetch(
          `/api/practice-sets/filter-counts?${params.toString()}`
        );
        if (!response.ok) throw new Error("Failed to fetch filter data");

        const data: FilterDataResponse = await response.json();
        setFilterCounts(data.counts);
        setAvailableFilters(data.availableFilters);
        setEstimatedCount(Math.min(data.counts.total, form.maxQuestions));
      } catch (error) {
        console.error("Error fetching filter data:", error);
        toast.error("Failed to load filter data");
      } finally {
        if (loading) {
          setLoading(false);
        } else {
          setUpdatingCounts(false);
        }
      }
    },
    [form.maxQuestions, loading]
  );

  // Get estimated count based on current filters
  const updateEstimatedCount = useCallback(
    async (filters: CreatePracticeSetFilters) => {
      try {
        const response = await fetch("/api/practice-sets/filtered-count", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filters),
        });

        if (!response.ok) throw new Error("Failed to get filtered count");
        const data = await response.json();
        setEstimatedCount(data.count);
        return data.count;
      } catch (error) {
        console.error("Error getting filtered count:", error);
        setEstimatedCount(0);
        return 0;
      }
    },
    []
  );

  // Update form and estimated count
  const updateForm = useCallback(
    (updates: Partial<PracticeSetForm>) => {
      setForm((prev) => {
        const newForm = { ...prev, ...updates };
        // Update estimated count when filters change
        if (updates.filters) {
          updateEstimatedCount(newForm.filters);
        }
        return newForm;
      });
    },
    [updateEstimatedCount]
  );

  // Toggle system filter
  const toggleSystem = useCallback(
    (system: string) => {
      const newSystems = form.filters.systems.includes(system)
        ? form.filters.systems.filter((s) => s !== system)
        : [...form.filters.systems, system];

      const newFilters = {
        ...form.filters,
        systems: newSystems,
      };

      updateForm({ filters: newFilters });

      // Refetch counts with new system selection
      fetchFilterData(newSystems, form.filters.disciplines);
    },
    [form.filters, updateForm, fetchFilterData]
  );

  // Toggle discipline filter
  const toggleDiscipline = useCallback(
    (discipline: string) => {
      const newDisciplines = form.filters.disciplines.includes(discipline)
        ? form.filters.disciplines.filter((d) => d !== discipline)
        : [...form.filters.disciplines, discipline];

      const newFilters = {
        ...form.filters,
        disciplines: newDisciplines,
      };

      updateForm({ filters: newFilters });

      // Refetch counts with new discipline selection
      fetchFilterData(form.filters.systems, newDisciplines);
    },
    [form.filters, updateForm, fetchFilterData]
  );

  // Toggle difficulty filter
  const toggleDifficulty = useCallback(
    (difficulty: "EASY" | "MEDIUM" | "HARD") => {
      updateForm({
        filters: {
          ...form.filters,
          difficulties: form.filters.difficulties.includes(difficulty)
            ? form.filters.difficulties.filter((d) => d !== difficulty)
            : [...form.filters.difficulties, difficulty],
        },
      });
    },
    [form.filters, updateForm]
  );

  // Toggle status filter
  const toggleStatusFilter = useCallback(
    (
      filterKey: keyof Pick<
        CreatePracticeSetFilters,
        | "includeUsed"
        | "includeUnused"
        | "includeCorrect"
        | "includeIncorrect"
        | "includeMarked"
      >
    ) => {
      updateForm({
        filters: {
          ...form.filters,
          [filterKey]: !form.filters[filterKey],
        },
      });
    },
    [form.filters, updateForm]
  );

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setForm(INITIAL_FORM);
    setEstimatedCount(filterCounts.total);
  }, [filterCounts.total]);

  // Create practice set
  const createPracticeSet = useCallback(async () => {
    if (!form.name.trim()) {
      toast.error("Please enter a practice set name");
      return null;
    }

    if (form.maxQuestions < 1) {
      toast.error("Please set a valid number of questions");
      return null;
    }

    try {
      setCreating(true);

      // Final check for available questions
      const availableCount = await updateEstimatedCount(form.filters);
      if (availableCount === 0) {
        toast.error("No questions match your selected filters");
        return null;
      }

      if (availableCount < form.maxQuestions) {
        toast.warning(
          `Only ${availableCount} questions available. Creating practice set with ${availableCount} questions.`
        );
        updateForm({ maxQuestions: availableCount });
      }

      const response = await fetch("/api/practice-sets/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create practice set");
      }

      const result: CreatePracticeSetResponse = await response.json();
      toast.success(result.message);
      resetForm();
      return result;
    } catch (error) {
      console.error("Error creating practice set:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create practice set"
      );
      return null;
    } finally {
      setCreating(false);
    }
  }, [form, updateEstimatedCount, updateForm, resetForm]);

  // Initialize data on mount
  useEffect(() => {
    fetchFilterData();
  }, [fetchFilterData]);

  // Update estimated count when filters change
  useEffect(() => {
    if (!loading) {
      updateEstimatedCount(form.filters);
    }
  }, [form.filters, loading, updateEstimatedCount]);

  return {
    // State
    loading,
    creating,
    updatingCounts,
    filterCounts,
    availableFilters,
    form,
    estimatedCount,

    // Actions
    updateForm,
    toggleSystem,
    toggleDiscipline,
    toggleDifficulty,
    toggleStatusFilter,
    resetForm,
    createPracticeSet,
    refetchData: fetchFilterData,
  };
};
