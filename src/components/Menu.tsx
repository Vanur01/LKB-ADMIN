"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { HomeIcon, ClipboardDocumentCheckIcon, ListBulletIcon, ChartBarIcon, UserGroupIcon } from "@heroicons/react/24/outline";

type MenuProps = {
  collapsed: boolean;
};

type UserData = {
  _id: string;
  email: string;
  name: string;
  role: "admin" | "user";
};

const adminMenuItems = [
  {
    label: "Dashboard",
    href: "/home",
    icon: <HomeIcon className="w-5 h-5" />,
    color: "from-orange-500 to-orange-600",
  },
  {
    label: "Menu Management",
    href: "/menu",
    icon: <ListBulletIcon className="w-5 h-5" />,
    color: "from-orange-500 to-orange-600",
  },
  {
    label: "Order Management",
    href: "/orders",
    icon: <ClipboardDocumentCheckIcon className="w-5 h-5" />,
    color: "from-orange-500 to-orange-600",
  },
  {
    label: "Reports",
    href: "/reports",
    icon: <ChartBarIcon className="w-5 h-5" />,
    color: "from-orange-500 to-orange-600",
  },
  {
    label: "Category",
    href: "/category",
    icon: <ChartBarIcon className="w-5 h-5" />,
    color: "from-orange-500 to-orange-600",
  },
  {
    label: "User Management",
    href: "/users",
    icon: <UserGroupIcon className="w-5 h-5" />,
    color: "from-orange-500 to-orange-600",
  },
];

const userMenuItems = [
  {
    label: "My Orders",
    href: "/user/orders",
    icon: <ClipboardDocumentCheckIcon className="w-5 h-5" />,
    color: "from-orange-500 to-orange-600",
  },
];

const Menu = ({ collapsed }: MenuProps) => {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<"admin" | "user">("user"); // Default to 'user'
  
  useEffect(() => {
    // Get user data from localStorage
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const parsedUser: UserData = JSON.parse(userData);
          setUserRole(parsedUser.role);
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }
    }
  }, []);

  const isActive = (href: string) => pathname.startsWith(href);
  const menuItems = userRole === "admin" ? adminMenuItems : userMenuItems;

  return (
    <div className={`mt-4 ${collapsed ? "px-2" : "px-4"}`}>
      <div className="flex flex-col gap-1">
        {menuItems.map((item) => (
          <Link
            href={item.href}
            key={item.label}
            className={`group relative flex items-center ${
              collapsed ? "justify-center" : "justify-start"
            } gap-4 font-medium py-3 px-4 rounded-xl transition-all duration-300 ${
              isActive(item.href)
                ? `text-white bg-gradient-to-r ${item.color} shadow-lg`
                : "text-gray-600 hover:text-gray-900 hover:bg-zinc-200"
            }`}
          >
            {/* Animated highlight bar */}
            {!collapsed && isActive(item.href) && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-full bg-white shadow-sm"></div>
            )}

            {/* Icon with hover effect */}
            <div
              className={`transition-all duration-300 ${
                isActive(item.href)
                  ? "scale-110 text-white"
                  : "group-hover:scale-110 text-current"
              } ${collapsed ? "mx-auto" : ""}`}
            >
              {item.icon}
            </div>

            {/* Label with slide-in effect */}
            {!collapsed && (
              <span
                className={`block transition-all duration-300 ${
                  isActive(item.href)
                    ? "translate-x-0 font-semibold"
                    : "group-hover:translate-x-1"
                }`}
              >
                {item.label}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Menu;