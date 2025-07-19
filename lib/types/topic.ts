export interface TopicWithProgress {
  id: string;
  name: string;
  slug: string;
  practiced: number;
  total: number;
  trend: "up" | "down" | "neutral";
  note: string;
  detail: string;
  accuracy: number;
  lastPracticedAt: Date | null;
  streak: number;
}
