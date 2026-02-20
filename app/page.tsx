import DashboardScreen from "@/app/pages/dashboard/DashboardScreen";
import LoginScreen from "@/app/pages/login/LoginScreen";
import { cookies } from "next/headers";

export default async function Page() {
  // const cookieStore = await cookies();  
  // const session = cookieStore.get("session");

  // if (!session) {
  //   return <LoginScreen />;
  // }

  return <DashboardScreen />;
}

