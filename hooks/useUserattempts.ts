// hooks/useUserAttempts.ts
import { useState, useEffect, useCallback } from 'react';

interface UserAttempt {
  id: string;
  selectedOptions: string[];
  isCorrect: boolean;
  timeSpent: number | null;
  attemptedAt: Date;
  userId: string;
  questionId: string;
  question: {
    id: string;
    title: string;
    difficulty: string;
    questionType: string;
  };
}

interface UseUserAttemptsOptions {
  userId: string;
  questionId?: string;
  limit?: number;
  offset?: number;
}

interface UseUserAttemptsReturn {
  attempts: UserAttempt[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useUserAttempts({
  userId,
  questionId,
  limit = 10,
  offset = 0,
}: UseUserAttemptsOptions): UseUserAttemptsReturn {
  const [attempts, setAttempts] = useState<UserAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(offset);

  const fetchAttempts = useCallback(async (resetData = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        userId,
        limit: limit.toString(),
        offset: (resetData ? 0 : currentOffset).toString(),
      });

      if (questionId) {
        params.append('questionId', questionId);
      }

      const response = await fetch(`/api/user-attempts?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch attempts');
      }

      const result = await response.json();

      if (result.success) {
        if (resetData) {
          setAttempts(result.data);
          setCurrentOffset(0);
        } else {
          setAttempts(prev => [...prev, ...result.data]);
        }
        setTotal(result.pagination.total);
        setHasMore(result.pagination.hasMore);
      } else {
        throw new Error(result.error || 'Failed to fetch attempts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId, questionId, limit, currentOffset]);

  const refetch = useCallback(async () => {
    await fetchAttempts(true);
  }, [fetchAttempts]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    setCurrentOffset(prev => prev + limit);
  }, [hasMore, loading, limit]);

  useEffect(() => {
    fetchAttempts(true);
  }, [userId, questionId, limit]);

  useEffect(() => {
    if (currentOffset > 0) {
      fetchAttempts(false);
    }
  }, [currentOffset, fetchAttempts]);

  return {
    attempts,
    loading,
    error,
    total,
    hasMore,
    refetch,
    loadMore,
  };
}

// Additional hook for question-specific attempt history
export function useQuestionAttempts(userId: string, questionId: string) {
  return useUserAttempts({ userId, questionId, limit: 20 });
}

// Hook for user's recent attempts across all questions
export function useRecentAttempts(userId: string, limit = 10) {
  return useUserAttempts({ userId, limit });
}