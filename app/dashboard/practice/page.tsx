import { getSteps } from "@/app/actions/topics";
import { StepCards } from "@/components/step-cards";

export default async function Page() {
  const data = await getSteps();
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
