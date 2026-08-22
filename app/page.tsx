import DashboardScreen from "@/app/pages/dashboard/DashboardScreen";
import LoginScreen from "@/app/pages/login/LoginScreen";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <LoginScreen />;
  }

  return <DashboardScreen />;
}
