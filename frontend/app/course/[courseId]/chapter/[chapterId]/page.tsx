"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChevronLeft,
  CheckCircle2,
  XCircle,
  BookOpen,
  Trophy,
} from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Progress } from "@/components/ui/progress";

// --- Tipe Data ---
interface QuizItem {
  question: string;
  options: string[];
  correct_answer: string;
}

interface ChapterContent {
  content_markdown: string;
  quizzes: QuizItem[];
}

interface CourseStructure {
  id: number;
  title: string;
  chapters: {
    id: number;
    chapter_number: number;
    title: string;
  }[];
}

export default function ChapterPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.courseId);
  const chapterId = Number(params.chapterId);

  const [content, setContent] = useState<ChapterContent | null>(null);
  const [courseData, setCourseData] = useState<CourseStructure | null>(null); // State baru untuk Sidebar
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState({
    name: "Loading...",
    email: "loading@example.com",
    avatar: "",
  });

  const [quizStatus, setQuizStatus] = useState<
    Record<number, "unanswered" | "correct">
  >({});
  const [lockedOptions, setLockedOptions] = useState<Record<number, number[]>>(
    {},
  );

  const parseJwt = (token: string) => {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const decoded = parseJwt(token);
    if (decoded && decoded.sub) {
      setUser({
        name: decoded.sub,
        email: `${decoded.sub}@student.com`,
        avatar: "",
      });
    }

    fetchData(token);
  }, [chapterId]); // Re-fetch jika pindah bab

  const fetchData = async (token: string) => {
    setLoading(true);
    try {
      // 1. Fetch Konten Chapter
      const contentRes = await fetch(
        `http://localhost:8000/chapters/${chapterId}/content`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (contentRes.ok) setContent(await contentRes.json());

      // 2. Fetch Struktur Course (Untuk Sidebar & Breadcrumb)
      // Kita ambil dari /my-courses dan filter (karena endpoint specific course belum tentu ada)
      const coursesRes = await fetch(`http://localhost:8000/my-courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (coursesRes.ok) {
        const courses = await coursesRes.json();
        const currentCourse = courses.find((c: any) => c.id === courseId);
        if (currentCourse) setCourseData(currentCourse);
      }

      setQuizStatus({});
      setLockedOptions({});
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const checkIsCorrect = (selected: string, correct: string) => {
    const s = selected.trim().toLowerCase();
    const c = correct.trim().toLowerCase();
    if (s === c) return true;
    const cleanS = s.replace(/^[a-z0-9][\.\)\-]\s*/, "");
    if (cleanS === c) return true;
    if (
      c.length <= 2 &&
      (s.startsWith(`${c}.`) || s.startsWith(`${c})`) || s.startsWith(`${c} `))
    )
      return true;
    return false;
  };

  const handleAnswer = (
    qIndex: number,
    selectedOption: string,
    optionIndex: number,
  ) => {
    if (!content) return;
    const isCorrect = checkIsCorrect(
      selectedOption,
      content.quizzes[qIndex].correct_answer,
    );
    if (isCorrect) {
      setQuizStatus((prev) => ({ ...prev, [qIndex]: "correct" }));
    } else {
      setLockedOptions((prev) => {
        const current = prev[qIndex] || [];
        return !current.includes(optionIndex)
          ? { ...prev, [qIndex]: [...current, optionIndex] }
          : prev;
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
      router.push("/");
    } catch (error) {
      alert("Gagal menyimpan.");
    }
  };

  const totalQuizzes = content?.quizzes?.length || 0;
  const correctAnswers = Object.values(quizStatus).filter(
    (s) => s === "correct",
  ).length;
  const progressPercent =
    totalQuizzes > 0 ? (correctAnswers / totalQuizzes) * 100 : 100;
  const allCorrect = progressPercent === 100;

  // --- LOGIC BREADCRUMB ---
  // Cari data chapter sekarang dari list courseData
  const currentChapterInfo = courseData?.chapters.find(
    (c) => c.id === chapterId,
  );
  // Jika ketemu, gunakan chapter_number, jika tidak fallback ke ID (tapi ini jarang terjadi)
  const breadcrumbLabel = currentChapterInfo
    ? `Chapter ${currentChapterInfo.chapter_number}`
    : `Chapter ${chapterId}`;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      {/* SIDEBAR DINAMIS: Kirim courseData dan chapterId */}
      <AppSidebar
        variant="inset"
        user={user}
        courseData={courseData || undefined} // Kirim struktur course
        currentChapterId={chapterId} // Untuk highlight aktif
      />

      <SidebarInset className="overflow-hidden">
        <SiteHeader />
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          {/* HEADER */}
          <div className="px-6 py-4 border-b flex items-center justify-between bg-background z-20 shadow-sm">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="flex items-center gap-1">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {/* Breadcrumb Course Title */}
                  <BreadcrumbLink
                    href="#"
                    className="font-medium text-muted-foreground hidden md:block"
                  >
                    {courseData?.title || "Loading..."}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  {/* BREADCRUMB FIXED: Menampilkan Chapter Number yang Benar */}
                  <BreadcrumbPage className="font-semibold text-primary">
                    {breadcrumbLabel}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {!loading && content && totalQuizzes > 0 && (
              <div className="flex items-center gap-3 w-48 animate-in fade-in">
                <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                  {correctAnswers} / {totalQuizzes} Soal
                </span>
                <Progress value={progressPercent} className="h-2" />
              </div>
            )}
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto px-6 py-8 scroll-smooth">
            <div className="mx-auto pb-24 p-8">
              {loading ? (
                <div className="space-y-6">
                  <Skeleton className="h-10 w-3/4" />
                  <Skeleton className="h-64 w-full rounded-xl" />
                </div>
              ) : content ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                  {/* ... (BAGIAN MATERI & KUIS TETAP SAMA SEPERTI SEBELUMNYA) ... */}
                  <section>
                    <div className="flex items-center ps-8 gap-2 text-primary">
                      <h2 className="text-2xl font-bold tracking-tight">
                        Materi Pembelajaran
                      </h2>
                    </div>
                    <Card className="border-none shadow-sm bg-slate-50/50 dark:bg-slate-900/50">
                      <CardContent className="px-8">
                        <article className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary hover:prose-a:underline prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:rounded prose-img:rounded-xl">
                          <Card className="border-none shadow-sm bg-slate-50/50 dark:bg-slate-900/50">
                            <CardContent className="pt-8 px-8 pb-8">
                              <article
                                className="
                                                    prose prose-slate max-w-none dark:prose-invert
                                                    prose-headings:font-bold prose-headings:tracking-tight
                                                    prose-a:text-primary hover:prose-a:underline
                                                    prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:rounded
                                                    prose-img:rounded-xl

                                                    /* TAMBAHAN CSS KHUSUS TABEL AGAR CANTIK */
                                                    prose-table:border-collapse prose-table:border prose-table:border-border prose-table:w-full prose-table:my-6
                                                    prose-th:bg-muted prose-th:p-4 prose-th:text-left prose-th:font-bold prose-th:border prose-th:border-border
                                                    prose-td:p-4 prose-td:border prose-td:border-border
                                                  "
                              >
                                {/* Tambahkan remarkPlugins={[remarkGfm]} */}
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {content.content_markdown}
                                </ReactMarkdown>
                              </article>
                            </CardContent>
                          </Card>
                        </article>
                      </CardContent>
                    </Card>
                  </section>

                  <Separator />

                  {content.quizzes?.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-6 text-black">
                        <h2 className="text-2xl font-bold tracking-tight">
                          Tantangan Kuis
                        </h2>
                      </div>
                      <div className="grid gap-6">
                        {content.quizzes.map((quiz, qIndex) => {
                          const isCorrect = quizStatus[qIndex] === "correct";
                          return (
                            <Card
                              key={qIndex}
                              className={`relative overflow-hidden border-2 transition-all duration-300 ${isCorrect ? "border-green-500 bg-green-50/20 dark:bg-green-900/10" : "border-border hover:border-primary/30"}`}
                            >
                              {isCorrect && (
                                <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 rounded-bl-xl text-xs font-bold flex items-center gap-1 z-10">
                                  <CheckCircle2 size={12} /> Selesai
                                </div>
                              )}
                              <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-medium flex gap-4">
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-muted text-sm font-bold text-muted-foreground">
                                    {qIndex + 1}
                                  </span>
                                  <span>{quiz.question}</span>
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {quiz.options.map((opt, optIndex) => {
                                    const isLocked =
                                      lockedOptions[qIndex]?.includes(optIndex);
                                    const isThisCorrect =
                                      isCorrect &&
                                      checkIsCorrect(opt, quiz.correct_answer);
                                    return (
                                      <button
                                        key={optIndex}
                                        onClick={() =>
                                          handleAnswer(qIndex, opt, optIndex)
                                        }
                                        disabled={isCorrect || isLocked}
                                        className={`group relative flex items-center justify-between p-4 rounded-xl border text-sm font-medium transition-all duration-200 text-left ${isThisCorrect ? "bg-green-600 text-white border-green-600 shadow-lg scale-[1.02]" : isLocked ? "bg-muted text-muted-foreground border-transparent opacity-50 cursor-not-allowed" : "bg-background hover:bg-accent hover:border-primary/50"}`}
                                      >
                                        <span className="pr-6">{opt}</span>
                                        {isThisCorrect && (
                                          <CheckCircle2 className="h-5 w-5 animate-in zoom-in spin-in-12" />
                                        )}
                                        {isLocked && (
                                          <XCircle className="h-5 w-5" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </section>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {!loading && content && (
            <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-6 md:pl-[var(--sidebar-width)]">
              <div className="bg-background/80 backdrop-blur-lg border shadow-2xl rounded-2xl p-2 flex items-center gap-4 pointer-events-auto animate-in slide-in-from-bottom-6 duration-500">
                <div className="px-4 hidden md:block">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Status Pengerjaan
                  </p>
                  <p
                    className={`font-bold ${allCorrect ? "text-green-600" : "text-black"}`}
                  >
                    {allCorrect
                      ? "Siap Lanjut!"
                      : `${correctAnswers} dari ${totalQuizzes} Selesai`}
                  </p>
                </div>
                <Separator
                  orientation="vertical"
                  className="h-8 hidden md:block"
                />
                <Button
                  size="lg"
                  onClick={() => router.push("/")}
                  variant="secondary"
                  className="rounded-xl hover:bg-muted"
                >
                  <ChevronLeft size={16} className="mr-2" /> Kembali
                </Button>
                <Button
                  size="lg"
                  onClick={handleCompleteChapter}
                  disabled={!allCorrect}
                  className={`rounded-xl px-8 font-bold transition-all duration-300 ${allCorrect ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg" : "bg-gray-200 text-gray-400 dark:bg-gray-800"}`}
                >
                  {allCorrect
                    ? "Selesaikan Bab Ini 🎉"
                    : "Kunci Jawaban Dulu 🔒"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
