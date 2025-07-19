import { redirect, RedirectType } from 'next/navigation'

export default function Page() {
  // Redirect to the dashboard home page
  return redirect('/dashboard/home', RedirectType.replace)
}
 