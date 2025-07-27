import { getTopicsWithProgress } from "@/app/actions/topics";
import { auth } from "@/app/lib/auth";
import { TopicCards } from "@/components/section-cards";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const now = Date.now();
  console.log("started fetching steps slug and userId", now);
  const { step } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/sign-in");
  }
  const userId = session.user.id;
  console.log("userId fetched at", Date.now() - now);
  const data = await getTopicsWithProgress(step, userId);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <TopicCards step={step} topics={data} />
        </div>
      </div>
    </div>
  );
}
