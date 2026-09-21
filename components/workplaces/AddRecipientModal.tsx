"use client";

import React, { useState, useEffect } from "react";
import { X, UserPlus, Search, Library, User, AlertCircle, Check, CheckSquare, Square } from "lucide-react";

interface AddRecipientModalProps {
  isOpen: boolean;
  onClose: () => void;
  workplaceId: string;
  existingEmails?: string[];
  onSuccess: () => void;
}

interface LibraryUserItem {
  id: string;
  name: string;
  email: string;
  assetId?: string | null;
  department?: string | null;
}

export function AddRecipientModal({
  isOpen,
  onClose,
  workplaceId,
  existingEmails = [],
  onSuccess,
}: AddRecipientModalProps) {
  const [activeTab, setActiveTab] = useState<"library" | "manual">("library");
  
  // Library tab state
  const [libraryUsers, setLibraryUsers] = useState<LibraryUserItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [loadingLib, setLoadingLib] = useState(false);

  // Manual tab state
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualAssetId, setManualAssetId] = useState("");

  // Options
  const [sendEmailNow, setSendEmailNow] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      fetchLibraryUsers();
    }
  }, [isOpen]);

  const fetchLibraryUsers = async () => {
    setLoadingLib(true);
    try {
      const res = await fetch("/api/library");
      if (res.ok) {
        const data = await res.json();
        setLibraryUsers(data);
      }
    } catch (e) {
      console.error("Failed to load library users:", e);
    } finally {
      setLoadingLib(false);
    }
  };

  if (!isOpen) return null;

  const existingEmailSet = new Set(existingEmails.map((e) => e.toLowerCase()));

  // Filter library users by Search Field: Name, Email, or Asset ID
  const filteredUsers = libraryUsers.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.assetId && u.assetId.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  });

  const toggleSelectUser = (email: string) => {
    const next = new Set(selectedEmails);
    if (next.has(email)) next.delete(email);
    else next.add(email);
    setSelectedEmails(next);
  };

  const selectAllFiltered = () => {
    const next = new Set(selectedEmails);
    filteredUsers.forEach((u) => {
      if (!existingEmailSet.has(u.email.toLowerCase())) {
        next.add(u.email);
      }
    });
    setSelectedEmails(next);
  };

  const clearSelection = () => {
    setSelectedEmails(new Set());
  };

  const handleAddRecipients = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      let recipientsToAdd: { name: string; email: string }[] = [];

      if (activeTab === "library") {
        if (selectedEmails.size === 0) {
          throw new Error("Please select at least one recipient from the library.");
        }
        recipientsToAdd = libraryUsers
          .filter((u) => selectedEmails.has(u.email))
          .map((u) => ({ name: u.name, email: u.email }));
      } else {
        if (!manualName || !manualEmail) {
          throw new Error("Please fill in both Name and Email.");
        }
        recipientsToAdd = [{ name: manualName, email: manualEmail }];

        // Optionally save manual entry to library as well for future reuse
        try {
          await fetch("/api/library", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: manualName,
              email: manualEmail,
              assetId: manualAssetId || null,
            }),
          });
        } catch (e) {
          // non-blocking if library save fails
        }
      }

      const res = await fetch(`/api/workplaces/${workplaceId}/recipient`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: recipientsToAdd,
          sendEmailNow,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add recipient(s)");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-slate-100">Add Recipient to Workplace</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection: Add from Lib vs Manual Add */}
        <div className="px-6 pt-4 flex space-x-2 border-b border-slate-800 bg-slate-950/40">
          <button
            type="button"
            onClick={() => setActiveTab("library")}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition flex items-center space-x-2 border-b-2 ${
              activeTab === "library"
                ? "bg-slate-900 text-indigo-400 border-indigo-500"
                : "text-slate-400 hover:text-slate-200 border-transparent"
            }`}
          >
            <Library className="w-4 h-4" />
            <span>Add from Library</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition flex items-center space-x-2 border-b-2 ${
              activeTab === "manual"
                ? "bg-slate-900 text-indigo-400 border-indigo-500"
                : "text-slate-400 hover:text-slate-200 border-transparent"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Manual Add</span>
          </button>
        </div>

        {/* Body Content */}
        <form onSubmit={handleAddRecipients} className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center space-x-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: ADD FROM LIBRARY */}
          {activeTab === "library" && (
            <div className="space-y-4">
              {/* Search Field */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Name, Email, or Asset ID..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              {/* Action bar for select all */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>
                  Selected: <strong className="text-indigo-400">{selectedEmails.size}</strong> user(s)
                </span>
                <div className="space-x-3">
                  <button
                    type="button"
                    onClick={selectAllFiltered}
                    className="text-indigo-400 hover:underline font-medium"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-slate-400 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* User List */}
              <div className="border border-slate-800 rounded-xl bg-slate-950/60 max-h-60 overflow-y-auto divide-y divide-slate-800/60">
                {loadingLib ? (
                  <div className="p-6 text-center text-xs text-slate-500">Loading library directory...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No library users found matching "{searchQuery}"
                  </div>
                ) : (
                  filteredUsers.map((user) => {
                    const isAlreadyAdded = existingEmailSet.has(user.email.toLowerCase());
                    const isSelected = selectedEmails.has(user.email);

                    return (
                      <div
                        key={user.id}
                        onClick={() => !isAlreadyAdded && toggleSelectUser(user.email)}
                        className={`p-3 flex items-center justify-between transition cursor-pointer ${
                          isAlreadyAdded
                            ? "opacity-50 cursor-not-allowed bg-slate-900/30"
                            : isSelected
                            ? "bg-indigo-600/10"
                            : "hover:bg-slate-800/40"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            disabled={isAlreadyAdded}
                            checked={isSelected || isAlreadyAdded}
                            onChange={() => !isAlreadyAdded && toggleSelectUser(user.email)}
                            className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                          />
                          <div>
                            <div className="font-semibold text-slate-200 text-xs flex items-center space-x-2">
                              <span>{user.name}</span>
                              {user.assetId && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
                                  {user.assetId}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">{user.email}</div>
                          </div>
                        </div>

                        {isAlreadyAdded ? (
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
                            Added
                          </span>
                        ) : isSelected ? (
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-medium">
                            Selected
                          </span>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL ADD */}
          {activeTab === "manual" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  required
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="e.g. john@company.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Asset ID / Computer Name (Optional)
                </label>
                <input
                  type="text"
                  value={manualAssetId}
                  onChange={(e) => setManualAssetId(e.target.value)}
                  placeholder="e.g. LAPTOP-INSO-892"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>
          )}

          {/* Option: Send Initial Email Now */}
          <div className="pt-2 border-t border-slate-800/80">
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmailNow}
                onChange={(e) => setSendEmailNow(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
              />
              <span>Send initial workplace email to recipient(s) immediately</span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/20 flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{submitting ? "Adding..." : "Add Recipient"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
