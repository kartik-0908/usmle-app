import { auth } from "@/app/lib/auth";
import { StepCards } from "@/components/step-cards";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  });
  if (!session) {
    redirect("/sign-in");
  }

  const data = [
    {
      id: "0b40bcf0-fd3e-4002-9979-9d3063653223",
      name: "Step-1",
      slug: "step1",
      description: "Foundational medical sciences and organ systems",
    },
    // {
    //   id: "a12bc377-b97c-4a62-9f74-a86cc82fdcf7",
    //   name: "Step-2",
    //   slug: "step2",
    //   description: "Clinical medicine and physician skills",
    // },
  ];

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
