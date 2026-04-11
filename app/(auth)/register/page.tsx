import { redirect } from 'next/navigation';

/** Reference HTML used a single screen with toggle; deep-link registration here. */
export default function RegisterPage() {
  redirect('/login?mode=register');
}
