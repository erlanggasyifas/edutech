"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  // State View
  const [view, setView] = useState<"dashboard" | "create">("dashboard");

  // State Data Course
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [previewCourse, setPreviewCourse] = useState<any>(null);

  // State User untuk Sidebar (BARU)
  const [user, setUser] = useState({
    name: "Loading...",
    email: "loading@example.com",
    avatar: "",
  });

  // State Input
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  // --- HELPER: Decode JWT Token ---
  const parseJwt = (token: string) => {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
      return null;
    }
  };

  // 1. Cek Login & Load User Data saat load
  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      router.push("/login");
    } else {
      setToken(t);

      // Ambil Info User dari Token
      const decoded = parseJwt(t);
      if (decoded && decoded.sub) {
        setUser({
          name: decoded.sub, // Username dari token
          email: `${decoded.sub}@student.com`, // Dummy email
          avatar: "", // Kosongkan biar jadi inisial
        });
      }

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
    router.push(`/course/${course.id}/chapter/${chapter.id}`);
  };

  if (!token) return null;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      {/* UPDATE: Pass 'user' ke Sidebar */}
      <AppSidebar variant="inset" user={user} setView={setView} />
      <SidebarInset>
        <SiteHeader />

        {/* AREA KONTEN UTAMA */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* VIEW: DASHBOARD */}
          {view === "dashboard" && (
            <div className="animate-in fade-in duration-200">
              {myCourses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-muted/30 border border-dashed rounded-xl">
                  <p className="text-muted-foreground mb-4 text-lg">
                    Anda belum mengambil kursus apapun.
                  </p>
                  <Button onClick={() => setView("create")}>
                    Mulai Belajar Sesuatu
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {myCourses.map((course) => (
                    <Card
                      key={course.id}
                      className="flex flex-col hover:shadow-lg mt-4 transition-shadow"
                    >
                      <div className="h-2 w-full bg-muted flex">
                        {/* Visual Progress Bar di Top Card */}
                        {course.chapters.map((ch) => (
                          <div
                            key={ch.chapter_number}
                            className={`flex-1 ${ch.is_completed ? "bg-green-500" : "bg-transparent"}`}
                          />
                        ))}
                      </div>
                      <CardHeader className="bg-muted/20 pb-4">
                        <CardTitle className="text-lg">
                          {course.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {course.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 flex-1 space-y-2">
                        {course.chapters.map((ch) => (
                          <div
                            key={ch.chapter_number}
                            onClick={() => handleOpenChapter(course, ch)}
                            className={`
                              flex items-center justify-between p-3 rounded-md border text-sm cursor-pointer transition-colors
                              ${
                                ch.is_locked
                                  ? "bg-muted text-muted-foreground opacity-70 cursor-not-allowed"
                                  : ch.is_completed
                                    ? "bg-green-50 border-green-200 text-green-900"
                                    : "bg-background hover:bg-accent hover:text-accent-foreground"
                              }
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`
                                flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                                ${ch.is_completed ? "bg-green-500 text-white" : ch.is_locked ? "bg-muted-foreground text-white" : "bg-primary text-primary-foreground"}
                              `}
                              >
                                {ch.is_completed ? "✓" : ch.chapter_number}
                              </span>
                              <span className="font-medium truncate max-w-[150px]">
                                {ch.title}
                              </span>
                            </div>
                            {ch.is_locked && <span>🔒</span>}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW: CREATE */}
          {view === "create" && (
            <div className="max-w-3xl mx-auto w-full py-10 animate-in fade-in duration-200">
              {/* Input Section */}
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold mb-2">
                  Apa yang ingin kamu pelajari?
                </h2>
                <p className="text-muted-foreground mb-8">
                  Kamu dapat mempelajari materi yang sesuai dengan kebutuhanmu.
                </p>
                <div className="flex gap-2 max-w-xl mx-auto">
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Contoh: Digital Marketing, Bahasa Jepang Dasar..."
                    className="h-10 text-lg"
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleGeneratePreview()
                    }
                  />
                  <Button
                    size="lg"
                    onClick={handleGeneratePreview}
                    disabled={loading || !prompt}
                  >
                    {loading ? "Menyusun..." : "Generate"}
                  </Button>
                </div>
              </div>

              {/* Preview Card Section */}
              {previewCourse && (
                <Card className="overflow-hidden border-2 border-primary/20 shadow-xl">
                  <CardHeader className="bg-primary/5 border-b">
                    <CardTitle className="text-2xl text-primary">
                      {previewCourse.title}
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                      {previewCourse.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-6 space-y-4">
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Kurikulum
                    </div>
                    <div className="grid gap-3">
                      {previewCourse.chapters?.length > 0 ? (
                        previewCourse.chapters.map((ch: any) => (
                          <div
                            key={ch.chapter_number}
                            className="flex gap-4 p-3 rounded-lg bg-muted/50 items-start"
                          >
                            <Badge
                              variant="outline"
                              className="mt-0.5 shrink-0"
                            >
                              BAB {ch.chapter_number}
                            </Badge>
                            <div>
                              <div className="font-semibold">{ch.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {ch.summary}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-muted-foreground text-sm italic">
                          Tidak ada detail bab yang tersedia.
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="bg-muted/20 p-6 flex gap-4 justify-end border-t">
                    <Button
                      variant="ghost"
                      onClick={() => setPreviewCourse(null)}
                    >
                      Batal
                    </Button>
                    <Button onClick={handleSaveCourse} disabled={loading}>
                      {loading ? "Menyimpan..." : "Ambil Kelas Ini"}
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
