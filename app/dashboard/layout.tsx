'use client';

import React from "react";
import { useState } from "react";
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import Header from "@/components/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50" style={{ backgroundColor: 'rgba(245, 243, 240, 1)' }}>
      <DashboardSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex min-h-screen flex-col md:ml-72">
        <Header onMenuClick={() => setIsSidebarOpen((prev) => !prev)} />
        <main className="p-3 sm:p-4 md:p-6 lg:p-8">
          <div>{children}</div>
        </main>
      </div>
    </div>
  );
}
