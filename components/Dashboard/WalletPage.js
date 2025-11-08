"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { motion } from "framer-motion";
import { Wallet, Loader2, ArrowLeft, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function WalletPage() {
  const [user, setUser] = useState(null);
  const [accountBalance, setAccountBalance] = useState(0);
  const [currencyRates, setCurrencyRates] = useState({});
  const [rateLoading, setRateLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const displayCurrencies = [
    { code: "EUR", flag: "🇪🇺", name: "Euro" },
    { code: "USD", flag: "🇺🇸", name: "US Dollar" },
    { code: "GBP", flag: "🇬🇧", name: "British Pound" },
    { code: "CAD", flag: "🇨🇦", name: "Canadian Dollar" },
    { code: "CNY", flag: "🇨🇳", name: "Chinese Yuan" },
  ];

  // ✅ Fetch User and Transactions
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (loggedUser) => {
      if (!loggedUser) return;

      const userRef = doc(db, "users", loggedUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setUser({ id: loggedUser.uid, ...data });
        setAccountBalance(data.accountBalance ?? 0);

        const q = query(
          collection(db, "transactions"),
          where("userId", "==", loggedUser.uid),
          orderBy("timestamp", "desc")
        );
        const txSnap = await getDocs(q);
        const txData = txSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTransactions(txData);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ✅ Fetch Live Exchange Rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        setRateLoading(true);
        const res = await fetch("https://api.exchangerate.host/latest?base=USD");
        const data = await res.json();
        setCurrencyRates(data.rates || {});
      } catch (err) {
        console.error("Exchange API Error:", err);
      } finally {
        setRateLoading(false);
      }
    };
    fetchRates();
  }, []);

  // ✅ Simulate percentage change colors
  const randomChange = () =>
    (Math.random() * 1 - 0.5).toFixed(2); // -0.50 to +0.50%

  return (
    <main className="min-h-screen bg-gray-50 px-4 sm:px-8 md:px-16 py-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl mx-auto bg-white border border-gray-100 rounded-2xl shadow-md p-6 sm:p-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/dashboard"
            className="flex items-center text-green-600 hover:text-green-700 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Link>
          <h1 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
            <Wallet className="w-5 h-5 text-green-600 mr-2" /> Wallet Overview
          </h1>
        </div>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-linear-to-r from-green-600 to-emerald-500 text-white rounded-xl p-6 mb-6 shadow-md"
        >
          <p className="text-sm opacity-90">Available Account Balance</p>
          <p className="text-3xl font-bold mt-2">
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin inline-block" />
            ) : (
              `USD ${Number(accountBalance).toLocaleString()}`
            )}
          </p>
        </motion.div>

        {/* Trading Indices */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
            <TrendingUp className="w-5 h-5 text-green-600 mr-2" /> Current Trading Indices
          </h2>

          {rateLoading ? (
            <div className="flex items-center justify-center py-6 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading rates...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-gray-100 rounded-xl">
                <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
                  <tr>
                    <th className="py-3 px-4 text-left">Currency</th>
                    {displayCurrencies.map((cur) => (
                      <th key={cur.code} className="py-3 px-4 text-center">
                        {cur.code}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayCurrencies.map((row) => (
                    <tr key={row.code} className="border-b border-gray-100">
                      <td className="py-3 px-4 flex items-center space-x-2">
                        <span className="text-lg">{row.flag}</span>
                        <span className="font-semibold text-gray-800">
                          {row.code}
                        </span>
                      </td>
                      {displayCurrencies.map((col) => {
                        const change = randomChange();
                        const isPositive = change > 0;
                        return (
                          <td
                            key={col.code}
                            className={`py-3 px-4 text-center font-medium ${
                              isPositive ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {row.code === col.code
                              ? "-"
                              : `${(currencyRates[col.code] / currencyRates[row.code]).toFixed(
                                  2
                                )} (${change}%)`}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Recent Transactions
          </h2>
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">
              No transactions available.
            </p>
          ) : (
            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="min-w-full text-sm">
                <thead className="bg-green-600 text-white text-xs uppercase">
                  <tr>
                    <th className="py-3 px-4 text-left">Account</th>
                    <th className="py-3 px-4 text-left">Amount</th>
                    <th className="py-3 px-4 text-center">Type</th>
                    <th className="py-3 px-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 5).map((t) => (
                    <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{t.accountNumber || "—"}</td>
                      <td className="py-3 px-4">
                        ${t.amount?.toLocaleString() || "0.00"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            t.type?.includes("Incoming") || t.type?.includes("Deposit")
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {t.type?.includes("Incoming") ||
                          t.type?.includes("Deposit")
                            ? "credit"
                            : "debit"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {t.timestamp?.toDate
                          ? t.timestamp.toDate().toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </main>
  );
}
