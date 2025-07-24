import { PracticeQuestionsTable } from "@/components/question-table";
import { notFound } from "next/navigation";
import {
  getQuestionsForSubtopic,
  getSubTopicNameFromSlug,
  getTopicNameFromSlug,
} from "@/app/actions/topics";
import prisma from "@/lib/db";

export default async function SubtopicQuestionsPage({
  params,
}: {
  params: Promise<{ step: string; topic: string; subtopic: string }>;
}) {
  const { step, topic, subtopic } = await params;
  const topicName = await getTopicNameFromSlug(topic);
  const subtopicName = await getSubTopicNameFromSlug(subtopic);

  // Find the subtopic by slug
  const subtopicData = await prisma.subtopic.findUnique({
    where: {
      slug: subtopic,
      isActive: true,
    },
    include: {
      topic: true,
    },
  });

  if (!subtopicData) {
    notFound();
  }

  // Verify that the subtopic belongs to the correct topic
  if (subtopicData.topic.slug !== topic) {
    notFound();
  }

  // Get questions for the subtopic with user progress
  const questionsData = await getQuestionsForSubtopic(subtopicData.id);

  if (questionsData.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">No Questions Found</h1>
          <p className="text-muted-foreground">
            No questions are available for "{subtopicName}" yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <PracticeQuestionsTable
        data={questionsData}
        topicName={topicName}
        subtopicName={subtopicName}
      />
    </div>
  );
}
