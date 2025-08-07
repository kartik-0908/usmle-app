import { redirect, RedirectType } from "next/navigation";
import { auth } from "./lib/auth";
import { headers } from "next/headers";

export default async function Page() {
  // Redirect to the dashboard home page
  const session = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  });
  if (!session) {
    redirect("/sign-in");
  }
  return redirect("/dashboard/home", RedirectType.replace);
}
