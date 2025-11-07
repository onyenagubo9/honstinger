"use client";
import { Home, CreditCard,  Clock, Wallet, Settings, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
   const pathname = usePathname();

  const navItems = [
    { name: "Overview", icon: Home, href: "/dashboard" },
    { name: "Cards", icon: CreditCard, href: "/cards" },
    { name: "History", icon: Clock, href: "/history" },
    { name: "Wallet", icon: Wallet, href: "/wallet" },
    { name: "Settings", icon: Settings, href: "/settings" },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-5 flex flex-col justify-between shadow-sm">
      <div>
        <div className="flex items-center space-x-3 mb-10">
          <img src="/honstinger-logo.png" alt="Logo" className="w-10 h-10 rounded-full" />
          <h1 className="text-xl font-bold text-green-700">Honstinger</h1>
        </div>

       {/* Navigation Links */}
        <nav className="space-y-2">
          {navItems.map((item, i) => {
            const isActive = pathname === item.href;

            return (
              <motion.div key={i} whileHover={{ scale: 1.02 }}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all w-full ${
                    isActive
                      ? "bg-green-100 text-green-700 font-semibold"
                      : "text-gray-700 hover:bg-green-50 hover:text-green-700"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm">{item.name}</span>
                </Link>
              </motion.div>
            );
          })}
        </nav>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition"
      >
        <LogOut className="w-4 h-4" />
        <span>Logout</span>
      </motion.button>
    </div>
  );
}
