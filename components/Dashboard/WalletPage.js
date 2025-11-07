"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { auth, db } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeft,
  DollarSign,
  Loader2,
  History,
} from "lucide-react";
import Link from "next/link";

export default function WalletPage() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Load user and wallet data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (loggedUser) => {
      if (loggedUser) {
        setUser(loggedUser);
        const userRef = doc(db, "users", loggedUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
          await fetchTransactions(loggedUser.uid);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchTransactions = async (uid) => {
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", uid),
      orderBy("timestamp", "desc")
    );
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setTransactions(data);
  };

  if (loading)
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
      </main>
    );

  return (
    <main className="min-h-screen bg-gray-50 px-4 sm:px-8 md:px-16 py-8">
      <div className="max-w-3xl mx-auto bg-white border border-gray-100 rounded-2xl shadow-sm p-6 sm:p-8">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="flex items-center text-green-600 hover:text-green-700 text-sm font-medium mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-center mb-6">
          <Wallet className="w-6 h-6 text-green-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-800">Your Wallet</h1>
        </div>

        {/* Wallet Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-linear-to-r from-green-600 to-emerald-500 rounded-2xl text-white p-6 shadow-md mb-6"
        >
          <div className="flex justify-between items-start">
            <p className="text-sm opacity-80">Wallet Balance</p>
            <DollarSign className="w-5 h-5 opacity-80" />
          </div>

          <h2 className="text-3xl font-bold mt-2">
            {userData?.currency || "USD"}{" "}
            {Number(userData?.accountBalance || 0).toLocaleString()}
          </h2>

          <div className="flex justify-between items-center mt-4 text-sm">
            <p className="opacity-80">Account Type</p>
            <p className="font-medium">{userData?.accountType || "Personal"}</p>
          </div>

          <div className="flex justify-between items-center mt-2 text-sm">
            <p className="opacity-80">Account Number</p>
            <p className="font-mono">{userData?.accountNumber || "N/A"}</p>
          </div>
        </motion.div>

        {/* Quick Wallet Actions */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { name: "Send", icon: ArrowUpRight, color: "bg-green-600" },
            { name: "Receive", icon: ArrowDownLeft, color: "bg-blue-600" },
            { name: "Withdraw", icon: History, color: "bg-yellow-500" },
          ].map((action, index) => (
            <motion.button
              key={index}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center justify-center py-3 rounded-xl text-white ${action.color} hover:opacity-90 transition shadow-sm`}
            >
              <action.icon className="w-5 h-5 mb-1" />
              <span className="text-sm font-medium">{action.name}</span>
            </motion.button>
          ))}
        </div>

        {/* Recent Transactions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Recent Wallet Activity
          </h2>
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              No wallet transactions found.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
              {transactions.slice(0, 6).map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-center justify-between p-3 text-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 flex items-center justify-center rounded-full ${
                        tx.type.includes("Deposit")
                          ? "bg-green-100 text-green-700"
                          : tx.type.includes("Transfer")
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {tx.type.includes("Deposit") ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{tx.type}</p>
                      <p className="text-xs text-gray-500">
                        {tx.note || "—"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-semibold ${
                      tx.type.includes("Deposit")
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {tx.type.includes("Deposit") ? "+" : "-"}$
                    {tx.amount?.toLocaleString() || 0}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
