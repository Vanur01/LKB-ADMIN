"use client";

import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import React, { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden">
      {/* LEFT */}
      <div
        className={`relative transition-all duration-300 bg-zinc-50 border-r border-zinc-300 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div
          className="flex items-center px-4 py-4 justify-center lg:justify-start gap-2 border-b border-zinc-300"
          onClick={() => (window.location.href = "/home")}
        >
          <Image
            src="/images/lkb_Logo.png"
            alt="logo"
            width={42}
            height={42}
            onClick={() => (window.location.href = "/home")}
            className="cursor-pointer"
          />

          {!collapsed && (
            <span className="block font-bold text-zinc-900 cursor-pointer">
              LKB Admin
            </span>
          )}
        </div>

        <Menu collapsed={collapsed} />

        <div
          className="absolute  p-3 border-t border-zinc-300 bottom-0 left-0 w-full flex justify-center cursor-pointer"
          onClick={() => setCollapsed(!collapsed)}
        >
          <button className="text-zinc-900 ">
            {collapsed ? (
              <ChevronRightIcon className="w-5 h-5" />
            ) : (
              <ChevronLeftIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex-1 bg-[#F7F8FA] overflow-scroll flex flex-col">
        <Navbar />
        {children}
      </div>
    </div>
  );
}
