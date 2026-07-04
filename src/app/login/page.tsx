"use client";

import { useState } from "react";
import { login, signup } from "./actions";

export default function LoginPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    const formData = new FormData(e.currentTarget);
    const result = isLogin ? await login(formData) : await signup(formData);
    if (result?.error) setError(result.error);
    if (result && "message" in result) setMessage(result.message);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#134e3b]">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="inline-block bg-[#bef2dc] text-[#134e3b] text-xs font-semibold px-3 py-1 rounded-full mb-3">SIT</span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Course Planner</h1>
          <p className="text-gray-400 text-sm mt-1">Course Planning for SIT Students</p>
        </div>

        <div className="flex mb-6 border dark:border-gray-600 rounded-lg overflow-hidden">
          <button
            className={`flex-1 py-2 text-sm font-medium transition ${isLogin ? "bg-[#008482] text-white" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
            onClick={() => setIsLogin(true)}
            type="button"
          >
            Login
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium transition ${!isLogin ? "bg-[#008482] text-white" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
            onClick={() => setIsLogin(false)}
            type="button"
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#008482] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#008482] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          {message && <p className="text-green-600 text-xs">{message}</p>}
          <button
            type="submit"
            className="w-full bg-[#008482] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#006e6c] transition"
          >
            {isLogin ? "Login" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
