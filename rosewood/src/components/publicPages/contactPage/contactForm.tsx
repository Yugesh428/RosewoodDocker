/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useCallback } from "react";

// Types based on the ContactMessage model
type ContactMessage = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};

// API response shape
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

const API_BASE = "/api/ui/contact";

export default function ContactMessagesSection() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and search state
  const [filterRead, setFilterRead] = useState<boolean | undefined>(undefined);
  const [search, setSearch] = useState("");

  // Modal for viewing details
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);

  // ─── Fetch messages ──────────────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterRead !== undefined) params.set("read", String(filterRead));

      const res = await fetch(`${API_BASE}?${params.toString()}`);
      const json: ApiResponse<ContactMessage[]> = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to fetch messages");
      }
      setMessages(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [filterRead]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // ─── Toggle read status ──────────────────────────────────────────────────
  const handleToggleRead = async (id: string, currentRead: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/${id}/read`, { method: "PATCH" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Toggle failed");
      }
      // Update local state optimistically
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isRead: !currentRead } : m)),
      );
      // Also update modal if it's the same message
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage({ ...selectedMessage, isRead: !currentRead });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Toggle error");
    }
  };

  // ─── Delete message ──────────────────────────────────────────────────────
  const handleDelete = async (id: string, fullName: string) => {
    if (!confirm(`Delete message from "${fullName}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Delete failed");
      }
      // Remove from local list
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedMessage && selectedMessage.id === id) {
        setModalOpen(false);
        setSelectedMessage(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete error");
    }
  };

  // ─── View message details ───────────────────────────────────────────────
  const handleView = (msg: ContactMessage) => {
    setSelectedMessage(msg);
    setModalOpen(true);
  };

  // ─── Client‑side search ──────────────────────────────────────────────────
  const filteredMessages = messages.filter((msg) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      msg.fullName.toLowerCase().includes(q) ||
      msg.email.toLowerCase().includes(q) ||
      msg.message.toLowerCase().includes(q) ||
      (msg.phone && msg.phone.includes(q))
    );
  });

  // ─── Format date ─────────────────────────────────────────────────────────
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="p-6 bg-[#F9F9F9] min-h-screen text-[#1A1A1A]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-heading text-[#1A1A1A]">
            Contact Messages
          </h1>
          <button
            onClick={fetchMessages}
            className="px-4 py-2 rounded-md bg-[#D4AF37] text-white text-sm font-medium hover:bg-[#b8972e] transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Filters and search */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name, email, or message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
            />
          </div>
          <select
            value={filterRead === undefined ? "" : String(filterRead)}
            onChange={(e) => {
              const val = e.target.value;
              setFilterRead(val === "" ? undefined : val === "true");
            }}
            className="rounded-md border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value="">All status</option>
            <option value="true">Read</option>
            <option value="false">Unread</option>
          </select>
          <button
            onClick={() => {
              setSearch("");
              setFilterRead(undefined);
            }}
            className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A]"
          >
            Clear filters
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md border border-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E5] overflow-hidden">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-8 text-[#6B6B6B]">
                No messages found.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-[#F9F9F9] border-b border-[#E5E5E5]">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A]">
                      From
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] hidden md:table-cell">
                      Message
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A] hidden lg:table-cell">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[#1A1A1A]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-[#1A1A1A]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMessages.map((msg) => (
                    <tr
                      key={msg.id}
                      className="border-b border-[#E5E5E5] hover:bg-[#F9F9F9]/50"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{msg.fullName}</div>
                        <div className="text-xs text-[#6B6B6B]">
                          {msg.email}
                        </div>
                        {msg.phone && (
                          <div className="text-xs text-[#6B6B6B]">
                            {msg.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="truncate max-w-xs">{msg.message}</div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-[#6B6B6B]">
                        {formatDate(msg.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full ${
                            msg.isRead
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {msg.isRead ? "Read" : "Unread"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => handleView(msg)}
                            className="p-1 rounded hover:bg-[#F9F9F9] text-[#1A1A1A]"
                            title="View details"
                          >
                            👁
                          </button>
                          <button
                            onClick={() => handleToggleRead(msg.id, msg.isRead)}
                            className={`p-1 rounded hover:bg-[#F9F9F9] text-sm ${
                              msg.isRead ? "text-[#D4AF37]" : "text-[#6B6B6B]"
                            }`}
                            title={
                              msg.isRead ? "Mark as unread" : "Mark as read"
                            }
                          >
                            {msg.isRead ? "✓" : "✕"}
                          </button>
                          <button
                            onClick={() => handleDelete(msg.id, msg.fullName)}
                            className="p-1 rounded hover:bg-red-50 text-red-500"
                            title="Delete"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ─── View Message Modal ────────────────────────────────────────────── */}
      {modalOpen && selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-heading text-[#1A1A1A]">
                Message Details
              </h2>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setSelectedMessage(null);
                }}
                className="text-[#6B6B6B] hover:text-[#1A1A1A] text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-[#1A1A1A]">From:</span>{" "}
                <span className="text-[#1A1A1A]">
                  {selectedMessage.fullName}
                </span>
              </div>
              <div>
                <span className="font-medium text-[#1A1A1A]">Email:</span>{" "}
                <a
                  href={`mailto:${selectedMessage.email}`}
                  className="text-[#D4AF37] hover:underline"
                >
                  {selectedMessage.email}
                </a>
              </div>
              {selectedMessage.phone && (
                <div>
                  <span className="font-medium text-[#1A1A1A]">Phone:</span>{" "}
                  <a
                    href={`tel:${selectedMessage.phone}`}
                    className="text-[#D4AF37] hover:underline"
                  >
                    {selectedMessage.phone}
                  </a>
                </div>
              )}
              <div>
                <span className="font-medium text-[#1A1A1A]">Date:</span>{" "}
                <span className="text-[#6B6B6B]">
                  {formatDate(selectedMessage.createdAt)}
                </span>
              </div>
              <div>
                <span className="font-medium text-[#1A1A1A]">Status:</span>{" "}
                <span
                  className={`inline-block px-2 py-1 text-xs rounded-full ${
                    selectedMessage.isRead
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {selectedMessage.isRead ? "Read" : "Unread"}
                </span>
              </div>
              <div>
                <span className="font-medium text-[#1A1A1A]">Message:</span>
                <div className="mt-1 p-3 bg-[#F9F9F9] rounded-md border border-[#E5E5E5] whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() =>
                  handleToggleRead(selectedMessage.id, selectedMessage.isRead)
                }
                className="px-4 py-2 rounded-md border border-[#D4AF37] text-[#D4AF37] text-sm font-medium hover:bg-[#D4AF37]/10 transition-colors"
              >
                {selectedMessage.isRead ? "Mark as Unread" : "Mark as Read"}
              </button>
              <button
                onClick={() =>
                  handleDelete(selectedMessage.id, selectedMessage.fullName)
                }
                className="px-4 py-2 rounded-md bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setSelectedMessage(null);
                }}
                className="px-4 py-2 rounded-md border border-[#E5E5E5] text-sm font-medium text-[#1A1A1A] hover:bg-[#F9F9F9]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
