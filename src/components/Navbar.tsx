"use client";

import React, { useMemo, useEffect, useState } from "react";
import {
  BellIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutUser } from "@/api/Users/page";

interface UserData {
  _id: string;
  email: string;
  name: string;
  role: string;
}

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      if (!user?._id) return;

      const response = await logoutUser(user._id);
      if (response.success) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        router.push("/");
      }
    } catch (error) {
      console.error("Error logging out:", error);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      router.push("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const routeNames = {
    home: "Dashboard",
    menu: "Menu Management",
    orders: "Orders Management",
    reports: "Reports",
    users: "User Management",
    category: "Category Management",
  };

  const breadcrumbs = useMemo(() => {
    if (!pathname) return [];

    const pathSegments = pathname
      .split("/")
      .filter((segment) => segment !== "");

    if (pathSegments.length === 0) {
      return [{ name: "Dashboard", href: "/home" }];
    }

    if (pathSegments.includes("sign-in")) {
      return [{ name: "Sign In", href: pathname }];
    }

    const crumbs = [];
    let currentPath = "";

    pathSegments.forEach((segment) => {
      if (segment === "dashboard") return;
      currentPath += `/${segment}`;
      const displayName =
        routeNames[segment as keyof typeof routeNames] ||
        segment.charAt(0).toUpperCase() + segment.slice(1);
      crumbs.push({ name: displayName, href: currentPath });
    });

    if (crumbs.length === 0) {
      crumbs.push({ name: "Dashboard", href: "/home" });
    }

    return crumbs;
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 bg-white border-b-1 border-gray-300 py-[5px] backdrop-blur-md">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left side - Breadcrumbs */}
        <div className="flex items-center">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm sm:text-base">
              {breadcrumbs.map((crumb, index) => (
                <li key={index}>
                  <div className="flex items-center">
                    {index > 0 && (
                      <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />
                    )}
                    <span
                      className={`font-semibold ${
                        index === breadcrumbs.length - 1
                          ? "text-zinc-900"
                          : "text-gray-500"
                      }`}
                    >
                      {crumb.name}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Right side - Navigation */}
        <div className="flex items-center space-x-5">
          {/* User profile dropdown */}
          <div className="relative">
            <div className="flex items-center gap-2">
              {user && (
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-700">
                    {user.name}
                    {user.role === "admin" ? (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                        Admin
                      </span>
                    ) : user.role === "user" ? (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                        User
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
              )}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
              >
                <UserCircleIcon className="h-7 w-7" />
              </button>
            </div>

            {isDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-52 bg-white rounded-md shadow-xl ring-1 ring-gray-100 z-20 animate-fadeIn"
                onMouseLeave={() => setIsDropdownOpen(false)}
              >
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={`flex w-full items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition cursor-pointer ${
                    isLoggingOut ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <ArrowRightOnRectangleIcon
                    className={`h-5 w-5 mr-2 text-gray-500 ${
                      isLoggingOut ? "animate-spin" : ""
                    }`}
                  />
                  {isLoggingOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        .animate-pulse-slow {
          animation: pulse 2.5s infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 200ms ease-in-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
