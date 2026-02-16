import Image from "next/image";
import type { ReactNode } from "react";

import MobileNav from "@/components/layout/mobile-nav";
import SidebarNav from "@/components/layout/sidebar-nav";
import QueryToast from "@/components/ui/query-toast";

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <>
      <MobileNav profileLabel="User" />

      <main className="app-shell">
        <aside className="app-sidebar">
          <div className="sidebar-brand">
            <p className="sidebar-logo">Attendee</p>
            <p className="sidebar-tagline">Attendance Tracker</p>
          </div>

          <SidebarNav />

          <div className="sidebar-footer">
            <div className="profile-row">
              <Image src="/demo-avatar.svg" alt="Profile" className="profile-avatar-image" width={34} height={34} />
              <p className="sidebar-user">User</p>
            </div>
          </div>
        </aside>

        <section className="app-main">
          <QueryToast />
          <div className="page-content">{children}</div>
        </section>
      </main>
    </>
  );
}
