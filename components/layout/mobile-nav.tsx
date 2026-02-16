"use client";

import Image from "next/image";
import { useState } from "react";

import SidebarNav from "@/components/layout/sidebar-nav";

type MobileNavProps = {
  profileLabel: string;
};

export default function MobileNav({ profileLabel }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="mobile-topbar">
        <div className="mobile-brand">
          <p className="mobile-brand-title">Attendee</p>
          <p className="mobile-brand-subtitle">Attendance Tracker</p>
        </div>

        <button
          aria-expanded={open}
          aria-label="Open navigation menu"
          className="mobile-menu-button"
          onClick={() => setOpen(true)}
          type="button"
        >
          ☰
        </button>
      </header>

      {open ? (
        <>
          <button
            aria-label="Close navigation menu"
            className="mobile-drawer-backdrop"
            onClick={() => setOpen(false)}
            type="button"
          />

          <aside className="mobile-drawer" role="dialog" aria-modal="true">
            <div className="mobile-drawer-header">
              <Image src="/demo-avatar.svg" alt="Profile" className="profile-avatar-image" width={34} height={34} />
              <div>
                <p className="mobile-drawer-user">{profileLabel}</p>
                <p className="mobile-drawer-subtitle">Student profile</p>
              </div>
            </div>

            <SidebarNav onNavigate={() => setOpen(false)} />
          </aside>
        </>
      ) : null}
    </>
  );
}
