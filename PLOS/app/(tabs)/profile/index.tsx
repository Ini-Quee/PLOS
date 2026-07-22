import { Redirect } from 'expo-router';

// The real profile screen lives at /profile. Forward there so the old
// placeholder (just a logout button) is no longer used.
export default function ProfileTabRedirect() {
  return <Redirect href="/profile" />;
}
