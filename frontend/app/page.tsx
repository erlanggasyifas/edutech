"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// --- Tipe Data Typescript ---
interface Chapter {
  id?: number;
  chapter_number: number;
  title: string;
  summary: string;
  is_locked: boolean;
  is_completed: boolean;
}

interface Course {
  id: number;
  title: string;
  description: string;
  chapters: Chapter[];
}

export default function Dashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  // State View: Hanya Dashboard & Create (Learning sudah dipisah)
  const [view, setView] = useState<"dashboard" | "create">("dashboard");

  // State Data
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [previewCourse, setPreviewCourse] = useState<any>(null);

  // State Input
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Cek Login saat load
  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      router.push("/login");
    } else {
      setToken(t);
      fetchMyCourses(t);
    }
  }, []);

  // 2. Fetch Data Course Milik User
  const fetchMyCourses = async (authToken: string) => {
    try {
      const res = await fetch("http://localhost:8000/my-courses", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyCourses(data);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (error) {
      console.error("Gagal fetch course", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  // --- LOGIC: CREATE COURSE ---
  const handleGeneratePreview = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/generate-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ topic: prompt }),
      });
      const data = await res.json();
      setPreviewCourse(data);
    } catch (error) {
      alert("Gagal generate. Coba topik lain.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCourse = async () => {
    if (!previewCourse || !token) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: previewCourse.title,
          description: previewCourse.description,
          chapters: previewCourse.chapters,
        }),
      });

      if (res.ok) {
        alert("Course berhasil disimpan!");
        setPreviewCourse(null);
        setPrompt("");
        await fetchMyCourses(token);
        setView("dashboard");
      }
    } catch (error) {
      alert("Gagal menyimpan course.");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC BARU: BUKA CHAPTER (REDIRECT) ---
  const handleOpenChapter = (course: Course, chapter: Chapter) => {
    if (chapter.is_locked) {
      alert("Ups! Selesaikan bab sebelumnya dulu ya.");
      return;
    }
    // Redirect ke halaman detail baru
    router.push(`/course/${course.id}/chapter/${chapter.id}`);
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-2xl font-extrabold text-blue-600 tracking-tight">
          MimoAI 🚀
        </h1>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => setView("dashboard")}
            className={`px-4 py-2 rounded-lg font-medium transition ${view === "dashboard" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-100"}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setView("create")}
            className={`px-4 py-2 rounded-lg font-medium transition ${view === "create" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-100"}`}
          >
            + Buat Baru
          </button>
          <button
            onClick={handleLogout}
            className="text-red-500 font-medium text-sm hover:underline ml-2"
          >
            Keluar
          </button>
        </div>
      </nav>

      {/* --- CONTENT AREA --- */}
      <main className="max-w-5xl mx-auto p-6">
        {/* 1. VIEW DASHBOARD */}
        {view === "dashboard" && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Pembelajaran Saya
            </h2>

            {myCourses.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500 mb-4 text-lg">
                  Anda belum mengambil kursus apapun.
                </p>
                <button
                  onClick={() => setView("create")}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
                >
                  Mulai Belajar Sesuatu
                </button>
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2">
                {myCourses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col"
                  >
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-white border-b border-gray-100">
                      <h3 className="font-bold text-xl mb-1 text-gray-900">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {course.description}
                      </p>
                    </div>

                    {/* Progress Bar Visual */}
                    <div className="flex w-full h-2 bg-gray-100">
                      {course.chapters.map((ch) => (
                        <div
                          key={ch.chapter_number}
                          className={`flex-1 ${ch.is_completed ? "bg-green-500" : "bg-transparent"}`}
                        ></div>
                      ))}
                    </div>

                    <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-80">
                      {course.chapters.map((ch) => (
                        <button
                          key={ch.chapter_number}
                          onClick={() => handleOpenChapter(course, ch)}
                          disabled={ch.is_locked}
                          className={`w-full flex items-center p-3 rounded-lg border transition text-left group
                            ${
                              ch.is_completed
                                ? "bg-green-50 border-green-200 hover:bg-green-100"
                                : ch.is_locked
                                  ? "bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed"
                                  : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer"
                            }
                          `}
                        >
                          <div
                            className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 shrink-0
                            ${ch.is_completed ? "bg-green-500 text-white" : ch.is_locked ? "bg-gray-300 text-gray-500" : "bg-blue-600 text-white"}
                          `}
                          >
                            {ch.is_completed ? "✓" : ch.chapter_number}
                          </div>

                          <div className="flex-1">
                            <h4
                              className={`font-semibold text-sm ${ch.is_locked ? "text-gray-400" : "text-gray-800"}`}
                            >
                              {ch.title}
                            </h4>
                            <p className="text-xs text-gray-500 line-clamp-1">
                              {ch.summary}
                            </p>
                          </div>

                          {ch.is_locked && (
                            <span className="text-lg ml-2">🔒</span>
                          )}
                          {!ch.is_locked && !ch.is_completed && (
                            <span className="text-lg ml-2 text-blue-500 group-hover:translate-x-1 transition">
                              →
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. VIEW CREATE (GENERATE) */}
        {view === "create" && (
          <div className="max-w-2xl mx-auto py-10">
            {!previewCourse ? (
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4 text-gray-800">
                  Apa yang ingin kamu pelajari?
                </h2>
                <p className="text-gray-500 mb-8">
                  AI akan menyusun kurikulum terstruktur khusus untukmu.
                </p>

                <div className="relative">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Contoh: Digital Marketing, Bahasa Jepang Dasar, React Native..."
                    className="w-full p-5 rounded-2xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-lg"
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleGeneratePreview()
                    }
                  />
                  <button
                    onClick={handleGeneratePreview}
                    disabled={loading || !prompt}
                    className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-6 rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 transition"
                  >
                    {loading ? "Menyusun..." : "Generate"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-fade-in-up">
                <div className="p-8 border-b border-gray-100 bg-blue-50">
                  <h2 className="text-2xl font-bold text-blue-900">
                    {previewCourse.title}
                  </h2>
                  <p className="text-gray-600 mt-2">
                    {previewCourse.description}
                  </p>
                </div>

                <div className="p-8 space-y-4">
                  <h3 className="font-semibold text-gray-500 uppercase tracking-wider text-xs">
                    Kurikulum
                  </h3>
                  {previewCourse.chapters.map((ch: any) => (
                    <div
                      key={ch.chapter_number}
                      className="flex gap-4 items-start"
                    >
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold mt-1">
                        BAB {ch.chapter_number}
                      </span>
                      <div>
                        <h4 className="font-bold text-gray-800">{ch.title}</h4>
                        <p className="text-sm text-gray-500">{ch.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-gray-50 flex gap-4 border-t border-gray-100">
                  <button
                    onClick={() => setPreviewCourse(null)}
                    className="flex-1 py-3 text-gray-600 font-semibold hover:bg-gray-200 rounded-lg transition"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveCourse}
                    disabled={loading}
                    className="flex-1 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg transition"
                  >
                    {loading ? "Menyimpan..." : "Ambil Kelas Ini"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW LEARNING SUDAH DIHAPUS DARI SINI */}
      </main>
    </div>
  );
}
