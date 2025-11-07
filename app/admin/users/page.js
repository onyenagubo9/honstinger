"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseClient";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { motion } from "framer-motion";
import { Trash, Edit, Loader2, Save, X } from "lucide-react";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    accountStatus: "",
    accountBalance: "",
  });
  const [saving, setSaving] = useState(false);

  // Fetch users from Firestore
  const fetchUsers = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, "users"));
    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    await deleteDoc(doc(db, "users", id));
    setUsers(users.filter((u) => u.id !== id));
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      accountStatus: user.accountStatus || "Active",
      accountBalance: user.accountBalance || 0,
    });
  };

  const handleSave = async () => {
    if (!editingUser) return;
    try {
      setSaving(true);
      await updateDoc(doc(db, "users", editingUser.id), {
        accountStatus: formData.accountStatus,
        accountBalance: Number(formData.accountBalance),
      });
      setEditingUser(null);
      setSaving(false);
      fetchUsers();
      alert("✅ User updated successfully!");
    } catch (err) {
      console.error("Error updating user:", err);
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
      </div>
    );

  return (
    <main className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-12 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Manage Users
      </h1>

      {/* Responsive Table Container */}
      <div className="overflow-x-auto bg-white border border-gray-100 rounded-xl shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-green-600 text-white text-xs uppercase">
            <tr>
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left hidden sm:table-cell">
                Email
              </th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left hidden md:table-cell">
                Balance
              </th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-b border-gray-100 hover:bg-gray-50 text-gray-700"
              >
                <td className="py-3 px-4">
                  <div className="flex flex-col">
                    <span className="font-medium">{u.name || "—"}</span>
                    <span className="text-xs text-gray-500 block sm:hidden">
                      {u.email}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 hidden sm:table-cell">{u.email}</td>
                <td
                  className={`py-3 px-4 font-medium ${
                    u.accountStatus === "Active"
                      ? "text-green-600"
                      : u.accountStatus === "Suspended"
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {u.accountStatus || "Active"}
                </td>
                <td className="py-3 px-4 hidden md:table-cell font-semibold">
                  ${u.accountBalance?.toLocaleString() || 0}
                </td>
                <td className="py-3 px-4 flex justify-center space-x-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openEditModal(u)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs"
                  >
                    <Edit className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(u.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                  >
                    <Trash className="w-4 h-4" />
                  </motion.button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Edit Account
              </h2>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Account Status
                </label>
                <select
                  value={formData.accountStatus}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      accountStatus: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg p-2"
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Account Balance (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.accountBalance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      accountBalance: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg p-2"
                />
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-2">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                disabled={saving}
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}
