// path to your Better Auth server instance
import { auth } from "@/app/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
export default async function Practice() {
  const session = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  });
  if(!session) {
    redirect("/sign-in");
  }
  return <div>home</div>;
}
