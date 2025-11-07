"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import {
  FileText,
  Download,
  ArrowLeft,
  Filter,
  Loader2,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function StatementsPage() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [balance, setBalance] = useState(0);

  const pdfRef = useRef();

  // ✅ Fetch user info and transactions
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (loggedUser) => {
      if (!loggedUser) return;

      const userRef = doc(db, "users", loggedUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        setUser({ id: loggedUser.uid, ...userData });
        setBalance(userData.balance ?? userData.accountBalance ?? 0);
      }

      // Fetch transactions
      const q = query(
        collection(db, "transactions"),
        where("userId", "==", loggedUser.uid),
        orderBy("timestamp", "desc")
      );

      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTransactions(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // ✅ Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesType = filterType === "All" || t.type?.includes(filterType);
    const matchesDate =
      (!startDate || new Date(t.timestamp?.toDate()) >= new Date(startDate)) &&
      (!endDate || new Date(t.timestamp?.toDate()) <= new Date(endDate));
    return matchesType && matchesDate;
  });

  // ✅ Generate PDF Statement
  const downloadStatement = () => {
    const docPDF = new jsPDF();
    docPDF.setFont("helvetica", "bold");
    docPDF.text("Account Statement", 14, 20);
    docPDF.setFontSize(11);
    docPDF.setFont("helvetica", "normal");
    docPDF.text(`Account Holder: ${user?.name || "—"}`, 14, 30);
    docPDF.text(`Account Number: ${user?.accountNumber || "—"}`, 14, 37);
    docPDF.text(`Currency: ${user?.currency || "USD"}`, 14, 44);
    docPDF.text(`Generated: ${new Date().toLocaleString()}`, 14, 51);

    const tableData = filteredTransactions.map((t) => [
      new Date(t.timestamp?.toDate()).toLocaleDateString(),
      t.type,
      t.note || "-",
      `${user?.currency || "USD"} ${t.amount.toLocaleString()}`,
      t.status || "Pending",
    ]);

    docPDF.autoTable({
      startY: 60,
      head: [["Date", "Type", "Description", "Amount", "Status"]],
      body: tableData,
    });

    docPDF.save(`Statement_${user?.accountNumber || "Account"}.pdf`);
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 sm:px-8 md:px-16 py-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-5xl mx-auto bg-white border border-gray-100 rounded-2xl shadow-md p-6 sm:p-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/dashboard"
            className="flex items-center text-green-600 hover:text-green-700 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Link>

          <div className="flex items-center space-x-2">
            <button
              onClick={downloadStatement}
              className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition"
            >
              <Download className="w-4 h-4 mr-1" /> Download PDF
            </button>
          </div>
        </div>

        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-green-50 border border-green-100 rounded-xl p-5 mb-6"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Account Holder</p>
              <p className="text-lg font-bold text-gray-800">
                {user?.name || "N/A"}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Account No: {user?.accountNumber || "—"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-sm">Available Balance</p>
              <p className="text-2xl font-bold text-gray-800">
                {user?.currency || "USD"} {balance.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 outline-none"
            >
              <option value="All">All Transactions</option>
              <option value="Transfer">Transfers</option>
              <option value="Bill">Bill Payments</option>
              <option value="Deposit">Deposits</option>
              <option value="Withdraw">Withdrawals</option>
            </select>
          </div>

          <div className="flex space-x-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 outline-none"
            />
            <span className="text-gray-400 mt-2">–</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 outline-none"
            />
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto" ref={pdfRef}>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading
              Transactions...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <p className="text-center text-gray-500 py-10 text-sm">
              No transactions found.
            </p>
          ) : (
            <table className="w-full text-sm border-t border-gray-100">
              <thead className="bg-gray-50 text-gray-700 text-xs uppercase">
                <tr>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Type</th>
                  <th className="py-3 px-4 text-left">Description</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition"
                  >
                    <td className="py-3 px-4 text-gray-700">
                      {new Date(t.timestamp?.toDate()).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-gray-700">{t.type}</td>
                    <td className="py-3 px-4 text-gray-600">{t.note || "—"}</td>
                    <td
                      className={`py-3 px-4 text-right font-semibold ${
                        t.type?.includes("Outgoing") ||
                        t.type?.includes("Bill") ||
                        t.type?.includes("Withdraw")
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {user?.currency || "USD"} {t.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          t.status === "Successful"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </main>
  );
}
