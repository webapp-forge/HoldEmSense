"use client";

import { useState } from "react";
import { login } from "@/lib/actions/auth";
import Link from "next/link";

export default function LoginPage() {
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setError("");
    const result = await login(formData);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="bg-gray-900 p-8 rounded-lg w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-6">Login</h1>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:outline-none focus:border-lime-500"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:outline-none focus:border-lime-500"
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            className="bg-lime-600 hover:bg-lime-500 text-white font-semibold py-2 rounded"
          >
            Login
          </button>
        </form>

        <p className="text-gray-400 text-sm mt-4">
          No account?{" "}
          <Link href="/register" className="text-lime-400 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
