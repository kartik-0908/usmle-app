import { getSubtopicData, getTopicNameFromSlug } from "@/app/actions/topics";
import { PracticeSubTopicsTable } from "@/components/practice-subtopics-table";

export default async function PracticePage({
  params,
}: {
  params: Promise<{ step: string; topic: string }>;
}) {
  const { step, topic } = await params;
  console.log("Step:", step);
  console.log("Topic:", topic);
  const topicName = await getTopicNameFromSlug(topic);

  // Get data for the current topic
  const topicData = await getSubtopicData(topic); // Replace with actual user ID

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

  console.log("Topic Data:", topicData[0]);

  return (
    <div className="container mx-auto py-8">
      <PracticeSubTopicsTable data={topicData} topicName={topicName} />
    </div>
  );
}
