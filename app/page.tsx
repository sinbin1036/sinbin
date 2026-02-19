import DashboardWrapper from "@/app/pages/dashboard/DashboardWrapper";
import LoginScreen from "@/app/pages/login/LoginScreen";
import { cookies } from "next/headers";

export default async function Page() {
  // const cookieStore = await cookies();  
  // const session = cookieStore.get("session");

  // if (!session) {
  //   return <LoginScreen />;
  // }

  return <DashboardWrapper />;
}

