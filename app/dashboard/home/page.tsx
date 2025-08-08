import { auth } from "@/app/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";

export default async function Practice() {
  const session = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  });

  if(!session) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Message */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Hi, {session.user.name || 'Doc'}! 👋
          </h1>
          <p className="text-muted-foreground text-lg">
            Ready to practice? Choose an option below to get started.
          </p>
        </div>

        {/* Practice Options Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create New Practice Set Card */}
          <Card className="hover:shadow-lg transition-shadow duration-200 border-2 hover:border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Create New Practice Set</CardTitle>
              <CardDescription className="text-muted-foreground">
                Start fresh with a new practice session tailored to your learning goals
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href="/dashboard/practice" className="block w-full">
                <Button className="w-full" size="lg">
                  Create New Set
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Continue Existing Practice Set Card */}
          <Card className="hover:shadow-lg transition-shadow duration-200 border-2 hover:border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-secondary/10 rounded-full w-fit">
                <BookOpen className="h-8 w-8 text-secondary-foreground" />
              </div>
              <CardTitle className="text-xl">Continue Practice Set</CardTitle>
              <CardDescription className="text-muted-foreground">
                Resume your existing practice sessions and track your progress
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href="/dashboard/practice-custom" className="block w-full">
                <Button variant="outline" className="w-full" size="lg">
                  Continue Practicing
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}