"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        alert("Pendaftaran Berhasil! Silakan Login.");
        router.push("/login");
      } else {
        const data = await res.json();
        alert("Gagal: " + (data.detail || "Terjadi kesalahan"));
      }
    } catch (err) {
      alert("Error koneksi server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-gray-100">
        <h1 className="text-3xl font-bold mb-2 text-green-600 text-center">
          Buat Akun
        </h1>
        <p className="text-gray-500 text-center mb-6">
          Mulai perjalanan belajarmu dengan AI.
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              className="w-full text-black border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              placeholder="Pilih username unik"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              className="w-full text-black border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            disabled={loading}
            className="w-full bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700 transition disabled:bg-green-300"
          >
            {loading ? "Mendaftar..." : "Daftar Akun"}
          </button>
        </form>
        <p className="mt-6 text-sm text-center text-gray-600">
          Sudah punya akun?{" "}
          <a
            href="/login"
            className="text-green-600 font-semibold hover:underline"
          >
            Masuk disini
          </a>
        </p>
      </div>
    </div>
  );
}
