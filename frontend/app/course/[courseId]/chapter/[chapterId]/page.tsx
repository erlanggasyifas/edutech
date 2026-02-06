"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

interface Quiz {
  question: string;
  options: string[];
  correct_answer: string;
}

interface ChapterContent {
  content_markdown: string;
  quiz: Quiz;
}

export default function ChapterPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId;
  const chapterId = params.chapterId;

  const [content, setContent] = useState<ChapterContent | null>(null);
  const [loading, setLoading] = useState(true);
  // Tambah state error baru
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<"correct" | "wrong" | null>(
    null,
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchContent(token);
  };

  const fetchContent = async (token: string) => {
    setLoading(true);
    setErrorMsg(null); // Reset error

    try {
      const res = await fetch(
        `http://localhost:8000/chapters/${chapterId}/content`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Tangani Rate Limit (429)
      if (res.status === 429) {
        const errData = await res.json();
        setErrorMsg(errData.detail || "Server sibuk. Tunggu sebentar.");
        setLoading(false);
        return;
      }

      if (!res.ok) throw new Error("Gagal load materi");

      const data = await res.json();
      setContent(data);
    } catch (error) {
      setErrorMsg("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  // ... (Fungsi handleAnswerQuiz & handleCompleteChapter TETAP SAMA) ...
  const handleAnswerQuiz = (selectedOption: string) => {
    if (!content) return;
    if (selectedOption === content.quiz.correct_answer) {
      setQuizFeedback("correct");
    } else {
      setQuizFeedback("wrong");
    }
  };

  const handleCompleteChapter = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(`http://localhost:8000/chapters/${chapterId}/complete`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Bab Selesai! Kembali ke Dashboard.");
      router.push("/");
    } catch (error) {
      alert("Gagal menyimpan progres.");
    }
  };

  // --- RENDER VIEW ---

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500">Guru AI sedang menyiapkan materi...</p>
      </div>
    );
  }

  // TAMPILAN JIKA ERROR (RATE LIMIT)
  if (errorMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md border border-red-100">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Sabar ya!</h2>
          <p className="text-gray-600 mb-6">{errorMsg}</p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Ke Dashboard
            </button>
            <button
              onClick={loadData}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg"
            >
              Coba Lagi ↻
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!content) return null;

  // ... (Render Materi & Kuis TETAP SAMA seperti kode sebelumnya) ...
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar Sederhana */}
      <div className="bg-gray-900 text-white p-4 sticky top-0 z-10 shadow-md flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="text-gray-300 hover:text-white flex items-center gap-2 text-sm font-bold"
        >
          ← Kembali ke Dashboard
        </button>
        <span className="text-sm font-mono text-gray-400">
          Chapter ID: {chapterId}
        </span>
      </div>

      <div className="max-w-3xl mx-auto p-6 md:p-10">
        <article className="prose prose-lg prose-blue max-w-none text-gray-800 mb-12">
          <ReactMarkdown>{content.content_markdown}</ReactMarkdown>
        </article>

        <hr className="my-10 border-gray-200" />

        {content.quiz &&
        content.quiz.options &&
        content.quiz.options.length > 0 ? (
          <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100 shadow-sm">
            {/* ... Isi Kuis sama persis seperti kode sebelumnya ... */}
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full tracking-wide">
                KUIS
              </span>
              <h3 className="font-bold text-gray-900 text-lg">Uji Pemahaman</h3>
            </div>
            <p className="text-gray-800 mb-6 text-lg font-medium leading-relaxed">
              {content.quiz.question}
            </p>
            <div className="grid gap-3">
              {content.quiz.options?.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswerQuiz(opt)}
                  disabled={quizFeedback === "correct"}
                  className={`w-full text-left p-4 rounded-xl border-2 transition font-medium relative overflow-hidden
                  ${
                    quizFeedback === "correct" &&
                    opt === content.quiz.correct_answer
                      ? "bg-green-100 border-green-500 text-green-900"
                      : quizFeedback === "wrong" &&
                          opt !== content.quiz.correct_answer
                        ? "opacity-50 bg-gray-50 border-gray-200"
                        : "bg-white border-gray-200 hover:border-blue-400 hover:shadow-md"
                  }
                `}
                >
                  {opt}
                  {quizFeedback === "correct" &&
                    opt === content.quiz.correct_answer && (
                      <span className="absolute right-4 top-4 text-green-600">
                        ✓
                      </span>
                    )}
                </button>
              ))}
            </div>
            <div className="mt-8 flex items-center justify-between h-14">
              {quizFeedback === "wrong" && (
                <p className="text-red-600 font-bold flex items-center gap-2 animate-pulse">
                  <span>❌</span> Jawaban salah, coba lagi!
                </p>
              )}
              {quizFeedback === "correct" && (
                <div className="flex items-center justify-between w-full animate-fade-in-up">
                  <p className="text-green-700 font-bold text-lg flex items-center gap-2">
                    <span>🎉</span> Benar!
                  </p>
                  <button
                    onClick={handleCompleteChapter}
                    className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
                  >
                    Selesai & Lanjut →
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 text-center shadow-sm">
            <h3 className="text-yellow-800 font-bold mb-2">
              Kuis Tidak Tersedia
            </h3>
            <p className="text-yellow-700 mb-4 text-sm">
              Maaf, AI gagal membuat kuis. Kamu bisa melewati bab ini.
            </p>
            <button
              onClick={handleCompleteChapter}
              className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-yellow-700 transition"
            >
              Lewati Bab Ini →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
