import { getSteps } from "@/app/actions/topics";
import { auth } from "@/app/lib/auth";
import { StepCards } from "@/components/step-cards";
import { unstable_cache } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  });
  if (!session) {
    redirect("/sign-in");
  }
  const userId = session.user.id;

  const getCachedSteps = unstable_cache(
    async () => {
      return getSteps(userId);
    },
    [],
    {
      revalidate: 3600,
    }
  );

  const data = await getCachedSteps();

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">
          No steps available. Please check back later.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <StepCards data={data} />
        </div>
      </div>
    </div>
  );
}
