"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, ChevronLeft } from "lucide-react";

// Tipe Data
interface QuizItem {
  question: string;
  options: string[];
  correct_answer: string;
}

interface ChapterContent {
  content_markdown: string;
  quizzes: QuizItem[];
}

export default function ChapterPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId;
  const chapterId = params.chapterId;

  const [content, setContent] = useState<ChapterContent | null>(null);
  const [loading, setLoading] = useState(true);

  // --- STATE KUIS ---
  // Menyimpan status jawaban per soal: 'unanswered', 'correct'
  const [quizStatus, setQuizStatus] = useState<
    Record<number, "unanswered" | "correct">
  >({});

  // Menyimpan opsi yang SALAH (dikunci) per soal: { [questionIndex]: [optionIndex1, optionIndex2] }
  const [lockedOptions, setLockedOptions] = useState<Record<number, number[]>>(
    {},
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchContent(token);
  }, []);

  const fetchContent = async (token: string) => {
    try {
      const res = await fetch(
        `http://localhost:8000/chapters/${chapterId}/content`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error("Gagal load materi");

      const data = await res.json();
      setContent(data);

      // Reset state kuis saat load baru
      setQuizStatus({});
      setLockedOptions({});
    } catch (error) {
      alert("Terjadi kesalahan saat memuat materi.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (
    qIndex: number,
    selectedOption: string,
    optionIndex: number,
  ) => {
    if (!content) return;
    const currentQuiz = content.quizzes[qIndex];

    // Jika jawaban benar
    if (selectedOption === currentQuiz.correct_answer) {
      setQuizStatus((prev) => ({ ...prev, [qIndex]: "correct" }));
    } else {
      // Jika salah, kunci opsi tersebut (disable)
      setLockedOptions((prev) => {
        const currentLocks = prev[qIndex] || [];
        if (!currentLocks.includes(optionIndex)) {
          return { ...prev, [qIndex]: [...currentLocks, optionIndex] };
        }
        return prev;
      });
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

      // Redirect kembali ke dashboard atau bisa juga next chapter logic
      router.push("/");
    } catch (error) {
      alert("Gagal menyimpan progres.");
    }
  };

  // Cek apakah semua kuis sudah terjawab benar
  const allCorrect =
    content && content.quizzes
      ? content.quizzes.length > 0 &&
        content.quizzes.every((_, idx) => quizStatus[idx] === "correct")
      : true; // Jika tidak ada kuis, anggap selesai

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      {/* Sidebar tanpa setView (Mode Navigasi) */}
      <AppSidebar variant="inset" />

      <SidebarInset>
        <SiteHeader />

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 max-w-4xl mx-auto w-full">
          {/* Tombol Kembali */}
          <div className="mb-2">
            <Button
              variant="ghost"
              className="gap-2 pl-0 hover:bg-transparent hover:underline"
              onClick={() => router.push("/")}
            >
              <ChevronLeft size={16} /> Kembali ke Materi
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : content ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 pb-20">
              {/* --- MATERI UTAMA --- */}
              <Card className="shadow-sm border-none bg-background">
                <CardContent className="pt-6 prose prose-blue max-w-none dark:prose-invert">
                  <ReactMarkdown>{content.content_markdown}</ReactMarkdown>
                </CardContent>
              </Card>

              {/* --- AREA KUIS --- */}
              {content.quizzes && content.quizzes.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      Kuis Interaktif
                    </Badge>
                    <span className="text-muted-foreground text-sm">
                      Selesaikan semua soal untuk lanjut.
                    </span>
                  </div>

                  {content.quizzes.map((quiz, qIndex) => {
                    const isCorrect = quizStatus[qIndex] === "correct";

                    return (
                      <Card
                        key={qIndex}
                        className={`overflow-hidden transition-all duration-300 ${isCorrect ? "border-green-200 bg-green-50/30" : "border-border"}`}
                      >
                        <CardHeader className="bg-muted/30 pb-4">
                          <CardTitle className="text-base font-medium flex gap-3 items-start">
                            <span className="bg-primary/10 text-primary w-6 h-6 rounded flex items-center justify-center text-xs shrink-0 mt-0.5">
                              {qIndex + 1}
                            </span>
                            {quiz.question}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 grid gap-3">
                          {quiz.options.map((opt, optIndex) => {
                            const isLocked =
                              lockedOptions[qIndex]?.includes(optIndex);
                            const isSelectedCorrect =
                              isCorrect && opt === quiz.correct_answer;

                            return (
                              <button
                                key={optIndex}
                                onClick={() =>
                                  handleAnswer(qIndex, opt, optIndex)
                                }
                                disabled={isCorrect || isLocked}
                                className={`
                                  relative w-full text-left p-4 rounded-lg border-2 text-sm font-medium transition-all duration-200
                                  flex items-center justify-between group
                                  ${
                                    isSelectedCorrect
                                      ? "bg-green-100 border-green-500 text-green-900 shadow-sm" // Jawaban Benar
                                      : isLocked
                                        ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60" // Jawaban Salah (Kekunci)
                                        : "bg-background border-muted hover:border-primary/50 hover:shadow-md" // Normal
                                  }
                                `}
                              >
                                <span>{opt}</span>
                                {isSelectedCorrect && (
                                  <CheckCircle2 className="text-green-600 w-5 h-5 animate-in zoom-in" />
                                )}
                                {isLocked && (
                                  <XCircle className="text-gray-400 w-5 h-5" />
                                )}
                              </button>
                            );
                          })}
                        </CardContent>
                        {isCorrect && (
                          <CardFooter className="bg-green-100/50 py-3 px-6 text-green-700 text-sm font-semibold flex items-center gap-2">
                            <CheckCircle2 size={16} /> Jawaban Benar!
                          </CardFooter>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* --- FOOTER ACTION --- */}
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t flex justify-center z-10 md:pl-[--sidebar-width]">
                <div className="w-full max-w-4xl flex justify-end">
                  <Button
                    size="lg"
                    onClick={handleCompleteChapter}
                    disabled={!allCorrect} // Disable jika belum semua benar
                    className={`transition-all duration-300 ${allCorrect ? "bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-green-500/20" : ""}`}
                  >
                    {allCorrect
                      ? "Selesai & Lanjut 🚀"
                      : "Selesaikan Kuis Dulu 🔒"}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
