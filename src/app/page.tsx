import { redirect } from 'next/navigation';
import { isLoggedIn } from './actions';

export default async function Home() {
  const loggedIn = await isLoggedIn();

  if (loggedIn) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
