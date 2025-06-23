import React from "react";
import Sidebar from "@/components/Sidebar";
import MobileNavigation from "@/components/MobileNavigation";
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/auth";
import { User } from "next-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();
  if (!session) redirect("/sign-in");
  const currentUser: User = session.user;

  //fixme : read nextAuth doc and get customized user form auth session.
  return (
    <main className="flex h-screen">
      <Sidebar {...{ ...currentUser }} />

      <section className="flex h-full flex-1 flex-col">
        <MobileNavigation {...{ ...currentUser }} />
        <Header />
        <div className="main-content">{children}</div>
      </section>
      <Toaster />
    </main>
  );
};
export default Layout;
