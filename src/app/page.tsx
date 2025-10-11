import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

export default async function Home() {
  const user = await currentUser();
  
  // Si está logueado, ir al dashboard
  if (user) {
    redirect("/dashboard");
  }
  
  // Si no está logueado, ir al sign-in
  redirect("/sign-in");
}
