import { TopicCards } from "@/components/section-cards";

export default async function Page({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <TopicCards step={step} />
        </div>
      </div>
    </div>
  );
}
