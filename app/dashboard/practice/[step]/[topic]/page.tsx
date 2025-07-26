import { getSubtopicData, getTopicNameFromSlug } from "@/app/actions/topics";
import { auth } from "@/app/lib/auth";
import { PracticeSubTopicsTable } from "@/components/practice-subtopics-table";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function PracticePage({
  params,
}: {
  params: Promise<{ step: string; topic: string }>;
}) {
  // Destructure params early
  const { step, topic } = await params;
  
  // Start auth check and headers retrieval in parallel
  const [session, headerData] = await Promise.all([
    auth.api.getSession({
      headers: await headers(),
    }),
    headers(), // If you need headers elsewhere, cache them
  ]);

  // Early return for unauthenticated users
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const userId = session.user.id;

  // Execute both data fetching operations in parallel
  const [topicData, topicName] = await Promise.all([
    getSubtopicData(topic, userId),
    getTopicNameFromSlug(topic),
  ]);

  // Early return for empty data
  if (topicData.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Topic Not Found</h1>
          <p className="text-muted-foreground">
            The topic "{topicName}" could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <PracticeSubTopicsTable data={topicData} topicName={topicName} />
    </div>
  );
}