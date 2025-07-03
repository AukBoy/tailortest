import { LoginForm } from '@/components/login-form'
import { Card } from '@/components/ui/card'
import { redirect } from 'next/navigation'
import { isLoggedIn } from '@/app/actions'

export default async function LoginPage() {
  const loggedIn = await isLoggedIn()

  if (loggedIn) {
    return redirect('/dashboard')
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-5xl font-headline font-bold text-primary">Style Gallery</h1>
            <p className="text-muted-foreground mt-2 font-body">Your Personal Style Companion</p>
        </div>
        <Card className="shadow-lg">
            <LoginForm />
        </Card>
      </div>
    </main>
  );
}
