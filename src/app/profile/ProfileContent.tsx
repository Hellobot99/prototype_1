"use client";

import { useState, useTransition } from "react";
import { deleteAccount } from "./actions";

interface ProfileContentProps {
  email: string;
  createdAt: string;
}

export default function ProfileContent({ email, createdAt }: ProfileContentProps) {
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAccount();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-xl p-6">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-400">Email</span>
            <span className="text-gray-900 font-medium">{email}</span>
          </div>
          <div className="flex justify-between pt-2">
            <span className="text-gray-400">Member since</span>
            <span className="text-gray-900 font-medium">
              {new Date(createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h2 className="text-sm font-bold text-red-600 mb-1">Danger Zone</h2>
        <p className="text-xs text-gray-500 mb-4">
          Deleting your account permanently removes your login, schedules, and completed
          course records. Reviews you&apos;ve written will remain, posted anonymously.
        </p>

        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="text-sm bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition"
          >
            Delete Account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Type <span className="font-mono font-bold">DELETE</span> to confirm.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-400 text-gray-900"
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => { setConfirming(false); setConfirmText(""); setError(""); }}
                disabled={isPending}
                className="flex-1 border rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmText !== "DELETE" || isPending}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-40"
              >
                {isPending ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
