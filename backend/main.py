import json
import os
from typing import List, Optional

import google.generativeai as genai
import uvicorn
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

# --- IMPORT BARU UNTUK HANDLE ERROR KUOTA ---
from google.api_core.exceptions import ResourceExhausted
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, create_engine
from sqlalchemy.orm import Session, declarative_base, relationship, sessionmaker

# --- KONFIGURASI ---
GOOGLE_API_KEY = (
    "AIzaSyAhYtyu1S-Z1N1bcXDXdbLLU3HC6P17Ae0"  # Pastikan API KEY Anda ada di sini
)
SECRET_KEY = "4aeb5dfce0a4bc62c327fb326de5427c69c8f3f42febea52701fb220f5b71091"
ALGORITHM = "HS256"

genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel("gemini-flash-latest")

# --- DATABASE SETUP (MySQL) ---
# Sesuaikan password jika perlu (format: root:password@localhost)
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:@localhost:3306/edutech_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# --- MODELS ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(50), unique=True, index=True)
    password_hash = Column(String(255))
    courses = relationship("Course", back_populates="owner")


class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255))
    description = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="courses")
    chapters = relationship("Chapter", back_populates="course")


class Chapter(Base):
    __tablename__ = "chapters"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    chapter_number = Column(Integer)
    title = Column(String(255))
    summary = Column(Text)
    is_locked = Column(Boolean, default=True)
    is_completed = Column(Boolean, default=False)
    content_json = Column(Text, nullable=True)
    course = relationship("Course", back_populates="chapters")


Base.metadata.create_all(bind=engine)

# --- SECURITY ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401)
    except JWTError:
        raise HTTPException(status_code=401, detail="Credential invalid")

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401)
    return user


# --- SCHEMAS ---
class UserCreate(BaseModel):
    username: str
    password: str


class ChapterBase(BaseModel):
    chapter_number: int
    title: str
    summary: str
    is_locked: bool = True
    is_completed: bool = False


class CourseCreate(BaseModel):
    topic: str


class CourseSave(BaseModel):
    title: str
    description: str
    chapters: List[ChapterBase]


class CourseResponse(BaseModel):
    id: int
    title: str
    description: str
    chapters: List[ChapterBase]


# --- APP ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ENDPOINTS ---


@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    hashed_pw = pwd_context.hash(user.password)
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    db_user = User(username=user.username, password_hash=hashed_pw)
    db.add(db_user)
    db.commit()
    return {"msg": "User created"}


@app.post("/token")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    token = jwt.encode({"sub": user.username}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}


@app.post("/generate-preview")
async def generate_preview(request: CourseCreate):
    # Prompt kita pertajam agar outputnya lebih bersih
    prompt = f"""
    Bertindaklah sebagai ahli kurikulum.
    Buat silabus kursus untuk topik: "{request.topic}".
    Bahasa: Indonesia.

    Output WAJIB HANYA JSON VALID (tanpa markdown ```json atau teks pembuka).
    Struktur JSON:
    {{
        "title": "Judul Menarik",
        "description": "Deskripsi singkat 1 kalimat",
        "chapters": [
            {{
                "chapter_number": 1,
                "title": "Judul Bab",
                "summary": "Ringkasan materi"
            }}
        ]
    }}
    Syarat: Buat 3-5 Bab.
    """

    try:
        response = model.generate_content(prompt)
        raw_text = response.text

        # --- LOGIC PEMBERSIH JSON (ANTI-CRASH) ---
        # Cari kurung kurawal '{' pertama dan '}' terakhir
        start_index = raw_text.find("{")
        end_index = raw_text.rfind("}")

        if start_index != -1 and end_index != -1:
            json_str = raw_text[start_index : end_index + 1]
            return json.loads(json_str)
        else:
            print(f"AI Output Error (Raw): {raw_text}")
            raise ValueError("AI tidak memberikan format JSON yang valid.")

    except ResourceExhausted:
        raise HTTPException(status_code=429, detail="Kuota AI habis. Tunggu 1 menit.")
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=429, detail="Format AI rusak. Silakan coba lagi."
        )
    except Exception as e:
        print(f"Error Generate Preview: {e}")
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")


@app.post("/courses", response_model=CourseResponse)
def save_course(
    course_data: CourseSave,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_course = Course(
        title=course_data.title,
        description=course_data.description,
        user_id=current_user.id,
    )
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    for idx, ch in enumerate(course_data.chapters):
        is_locked = False if idx == 0 else True
        new_chapter = Chapter(
            course_id=new_course.id,
            chapter_number=ch.chapter_number,
            title=ch.title,
            summary=ch.summary,
            is_locked=is_locked,
        )
        db.add(new_chapter)
    db.commit()
    return new_course


@app.get("/my-courses")
def get_my_courses(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    courses = db.query(Course).filter(Course.user_id == current_user.id).all()
    result = []
    for c in courses:
        chapters = (
            db.query(Chapter)
            .filter(Chapter.course_id == c.id)
            .order_by(Chapter.chapter_number)
            .all()
        )
        result.append(
            {
                "id": c.id,
                "title": c.title,
                "description": c.description,
                "chapters": [
                    {
                        "id": ch.id,
                        "chapter_number": ch.chapter_number,
                        "title": ch.title,
                        "is_locked": ch.is_locked,
                        "is_completed": ch.is_completed,
                    }
                    for ch in chapters
                ],
            }
        )
    return result


@app.get("/chapters/{chapter_id}/content")
def get_chapter_content(
    chapter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404)

    if chapter.content_json:
        return json.loads(chapter.content_json)

    course = db.query(Course).filter(Course.id == chapter.course_id).first()

    # --- PROMPT DIPERBARUI UNTUK MULTI-KUIS ---
    prompt = f"""
    Bertindaklah sebagai instruktur coding.
    Topik Kursus: "{course.title}"
    Bab Saat Ini: "{chapter.title}".

    Tugas:
    1. Buat materi penjelasan lengkap (markdown).
    2. Buat 1 sampai 3 soal kuis pilihan ganda secara random.

    Output WAJIB JSON Valid dengan struktur persis seperti ini (tanpa markdown ```json):
    {{
        "content_markdown": "Materi...",
        "quizzes": [
            {{
                "question": "Pertanyaan 1?",
                "options": ["A", "B", "C", "D"],
                "correct_answer": "A"
            }},
            {{
                "question": "Pertanyaan 2 (Opsional)?",
                "options": ["A", "B", "C", "D"],
                "correct_answer": "B"
            }}
        ]
    }}
    """

    try:
        response = model.generate_content(prompt)
        raw_text = response.text

        start_index = raw_text.find("{")
        end_index = raw_text.rfind("}")

        if start_index != -1 and end_index != -1:
            json_str = raw_text[start_index : end_index + 1]
            data = json.loads(json_str)

            # Validasi Backward Compatibility (Jaga-jaga kalau AI cuma kasih 1 'quiz')
            if "quiz" in data and "quizzes" not in data:
                data["quizzes"] = [data["quiz"]]
                del data["quiz"]

            chapter.content_json = json.dumps(data)
            db.commit()
            return data
        else:
            raise ValueError("Format JSON AI tidak valid")

    except Exception as e:
        print(f"Error AI: {e}")
        # Return fallback error yang aman
        raise HTTPException(status_code=500, detail="Gagal generate konten.")


@app.put("/chapters/{chapter_id}/complete")
def complete_chapter(
    chapter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(404)
    chapter.is_completed = True
    next_chapter = (
        db.query(Chapter)
        .filter(
            Chapter.course_id == chapter.course_id,
            Chapter.chapter_number == chapter.chapter_number + 1,
        )
        .first()
    )
    if next_chapter:
        next_chapter.is_locked = False
    db.commit()
    return {"msg": "Chapter completed"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
