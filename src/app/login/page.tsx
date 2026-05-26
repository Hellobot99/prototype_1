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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2 text-center">Smart Scheduler</h1>
        <p className="text-gray-500 text-sm text-center mb-6">SIT Course Planning</p>

        <div className="flex mb-6 border rounded-lg overflow-hidden">
          <button
            className={`flex-1 py-2 text-sm font-medium ${isLogin ? "bg-black text-white" : "text-gray-500"}`}
            onClick={() => setIsLogin(true)}
            type="button"
          >
            Login
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium ${!isLogin ? "bg-black text-white" : "text-gray-500"}`}
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
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          {message && <p className="text-green-600 text-xs">{message}</p>}
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
          >
            {isLogin ? "Login" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
