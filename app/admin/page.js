"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseClient";
import { collection, getDocs } from "firebase/firestore";
import { Users, CreditCard, Wallet, Activity } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, cards: 0, tx: 0 });

  useEffect(() => {
    const loadStats = async () => {
      const usersSnap = await getDocs(collection(db, "users"));
      const cardsSnap = await getDocs(collection(db, "cards"));
      const txSnap = await getDocs(collection(db, "transactions"));

      setStats({
        users: usersSnap.size,
        cards: cardsSnap.size,
        tx: txSnap.size,
      });
    };
    loadStats();
  }, []);

  const items = [
    { label: "Total Users", value: stats.users, icon: Users },
    { label: "Cards Issued", value: stats.cards, icon: CreditCard },
    { label: "Transactions", value: stats.tx, icon: Activity },
  ];

  return (
    <main>
      <h1 className="text-2xl font-bold mb-6">Admin Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.label}
            className="bg-white border border-gray-100 rounded-xl p-5 flex items-center shadow-sm"
          >
            <item.icon className="w-8 h-8 text-green-600 mr-4" />
            <div>
              <p className="text-sm text-gray-500">{item.label}</p>
              <h2 className="text-2xl font-bold text-gray-800">{item.value}</h2>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
