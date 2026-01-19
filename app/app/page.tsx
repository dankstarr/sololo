import { redirect } from 'next/navigation'

export default function AppPage() {
  // Redirect directly to home page
  redirect('/app/home')
}
