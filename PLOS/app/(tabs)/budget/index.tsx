import { Redirect } from 'expo-router';

// The real budget screen lives at /budget (full Simple/Advanced version).
// This tab route just forwards there so links to /(tabs)/budget keep working
// and we don't ship the old placeholder.
export default function BudgetTabRedirect() {
  return <Redirect href="/budget" />;
}
