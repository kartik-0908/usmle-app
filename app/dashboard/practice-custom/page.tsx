// app/practice-sets/page.tsx (Server Component)

import { getUserCustomPracticeSets } from '@/app/actions/custom-practice-sets';
import { getStepsWithTopics } from '@/app/actions/step-topics';
import { auth } from '@/app/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import CustomPracticeSetsPage from './comp';


export default async function PracticeSetsPage() {
  const session = await auth.api.getSession({
     headers: await headers(), // you need to pass the headers object.
   });
   if (!session) {
     redirect("/sign-in");
   }
  const [practiceSets, steps] = await Promise.all([
    getUserCustomPracticeSets(session.user.id),
    getStepsWithTopics(),
  ]);

  return (
    <CustomPracticeSetsPage
      initialPracticeSets={practiceSets}
      steps={steps}
      userId={session.user.id}
    />
  );
}