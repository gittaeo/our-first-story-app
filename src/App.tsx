import { useEffect, useMemo, useRef, useState } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useParams,
  NavLink,
} from "react-router-dom";
import {
  Baby,
  BookHeart,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Heart,
  Home,
  ImagePlus,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  calculateAge,
  calculateProgress,
  calculateWeek,
  analyzePhoto,
  compressPhoto,
  emotions,
  filterRecords,
  validateRecord,
} from "./domain";
import { useStore } from "./store";
import {
  createInviteRemote,
  createWorkspaceRemote,
  firebaseEnabled,
  joinWorkspaceRemote,
  loginWithEmail,
  observeAuth,
  registerWithEmail,
} from "./firebase";
import type { User } from "firebase/auth";
import type {
  Emotion,
  Profile,
  RecordType,
  StickerInstance,
  StoryPhoto,
} from "./types";
const labels: Record<RecordType, string> = {
  daily: "일상",
  checkup: "검진",
  movement: "태동",
  letter: "편지",
};
const icons: Record<RecordType, string> = {
  daily: "☀️",
  checkup: "🫧",
  movement: "〰️",
  letter: "💌",
};
function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!firebaseEnabled);
  useEffect(
    () =>
      observeAuth((nextUser) => {
        setUser(nextUser);
        setReady(true);
      }),
    [],
  );
  return { user, ready };
}

function AuthPanel({ onDone }: { onDone?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setError("");
    if (!email || password.length < 6) {
      setError("이메일과 6자리 이상의 비밀번호를 입력해주세요.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") await loginWithEmail(email, password);
      else await registerWithEmail(email, password);
      onDone?.();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "로그인하지 못했습니다.";
      setError(message.includes("auth/") ? "이메일 또는 비밀번호를 확인해주세요." : message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="auth-panel">
      <div className="auth-tabs">
        <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>로그인</button>
        <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>새 계정 만들기</button>
      </div>
      <label>이메일<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
      <label>비밀번호<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
      {error && <small className="auth-error">{error}</small>}
      <button className="primary" disabled={busy} onClick={submit}>{busy ? "확인 중…" : mode === "login" ? "로그인하기" : "계정 만들기"}</button>
    </div>
  );
}
function Shell({
  children,
  title = "콩콩이의 시간",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div className="app">
      <header>
        <NavLink className="mockup-home" to="/" aria-label="목업 홈으로">
          <Home />
        </NavLink>
        <div>
          <small>우리의 첫 이야기</small>
          <h1>{title}</h1>
        </div>
        <div className="header-side">
          <time dateTime={now.toISOString()}>
            {now.toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
          <div className="presence">
            <span className="avatar mom">엄</span>
            <span className="avatar partner">배</span>
            <i />
            함께 쓰는 중
          </div>
        </div>
      </header>
      <main>{children}</main>
      <nav>
        <NavLink to="/timeline">
          <Home />
          타임라인
        </NavLink>
        <NavLink className="new" to="/new">
          <Plus />새 기록
        </NavLink>
        <NavLink to="/stories">
          <BookHeart />
          이야기
        </NavLink>
        <NavLink to="/settings">
          <Settings />
          설정
        </NavLink>
      </nav>
    </div>
  );
}
function Intro() {
  const nav = useNavigate();
  return (
    <div className="intro">
      <div className="scribble">♡</div>
      <p className="eyebrow">OUR FIRST STORY</p>
      <h1>우리의 첫 이야기</h1>
      <h2>
        사진과 마음을 모아
        <br />
        아이에게 전할 이야기로
      </h2>
      <p>
        엄마와 배우자가 함께 쓰는
        <br />
        비공개 감성 성장 앨범
      </p>
      <button onClick={() => nav("/setup")}>
        시작하기 <ChevronRight />
      </button>
      <div className="doodle">☁︎　✦　☾</div>
    </div>
  );
}
function Setup() {
  const { profile, setProfile } = useStore();
  const nav = useNavigate();
  const [p, setP] = useState<Profile>(
    profile || {
      babyName: "",
      stage: "pregnant",
      date: "",
      momName: "엄마",
      partnerName: "배우자",
    },
  );
  const [step, setStep] = useState(0);
  const next = () =>
    step < 2 ? setStep(step + 1) : (setProfile(p), nav("/ready"));
  return (
    <div className="setup">
      <div className="progress">
        <i style={{ width: `${(step + 1) * 33.3}%` }} />
      </div>
      <button
        className="back"
        onClick={() => (step ? setStep(step - 1) : nav("/welcome"))}
      >
        <ChevronLeft />
      </button>
      {step === 0 && (
        <>
          <p className="eyebrow">01 · 아기 정보</p>
          <h1>아기를 소개해주세요</h1>
          <label>
            태명 또는 이름
            <input
              value={p.babyName}
              onChange={(e) => setP({ ...p, babyName: e.target.value })}
              placeholder="예: 콩콩이"
            />
          </label>
          <label>현재 단계</label>
          <div className="choice">
            <button
              className={p.stage === "pregnant" ? "active" : ""}
              onClick={() => setP({ ...p, stage: "pregnant" })}
            >
              🤰 임신 중
            </button>
            <button
              className={p.stage === "born" ? "active" : ""}
              onClick={() => setP({ ...p, stage: "born" })}
            >
              🍼 출산 후
            </button>
          </div>
        </>
      )}
      {step === 1 && (
        <>
          <p className="eyebrow">02 · 우리의 시간</p>
          <h1>
            우리의 시간을
            <br />
            맞춰볼게요
          </h1>
          <label>
            {p.stage === "pregnant" ? "출산 예정일" : "아기 생년월일"}
            <input
              type="date"
              value={p.date}
              onChange={(e) => setP({ ...p, date: e.target.value })}
            />
          </label>
          {p.date && (
            <div className="calculated">
              ✦ 현재{" "}
              {p.stage === "pregnant"
                ? calculateWeek(p.date)
                : calculateAge(p.date)}
              로 계산돼요
            </div>
          )}
        </>
      )}
      {step === 2 && (
        <>
          <p className="eyebrow">03 · 함께 기록할 이름</p>
          <h1>
            서로를 어떻게
            <br />
            부를까요?
          </h1>
          <label>
            엄마 표시 이름
            <input
              value={p.momName}
              onChange={(e) => setP({ ...p, momName: e.target.value })}
            />
          </label>
          <label>
            배우자 표시 이름
            <input
              value={p.partnerName}
              onChange={(e) => setP({ ...p, partnerName: e.target.value })}
            />
          </label>
          <div className="members">
            <span>
              <b className="avatar mom">엄</b>
              {p.momName}
            </span>
            <span>
              <b className="avatar partner">배</b>
              {p.partnerName}
            </span>
          </div>
        </>
      )}
      <button
        className="primary"
        disabled={!p.babyName || !p.date}
        onClick={next}
      >
        {step === 2 ? "가족 앨범 만들기" : "다음"} <ChevronRight />
      </button>
    </div>
  );
}
function Ready() {
  const nav = useNavigate();
  const { profile } = useStore();
  return (
    <div className="success">
      <div className="seal">
        ♡<span>OUR STORY</span>
      </div>
      <p className="eyebrow">준비 완료</p>
      <h1>앨범이 준비됐어요</h1>
      <div className="ready-card">
        <Baby />
        <h2>{profile?.babyName || "콩콩이"}의 첫 이야기</h2>
        <p>
          오늘부터 함께 차곡차곡
          <br />
          소중한 순간을 모아보세요.
        </p>
      </div>
      <button onClick={() => nav("/invite")}>
        <Users /> 배우자 초대하기
      </button>
      <button className="ghost" onClick={() => nav("/new")}>
        <Plus /> 첫 기록 남기기
      </button>
    </div>
  );
}
function Timeline() {
  const { records, profile } = useStore();
  const [open, setOpen] = useState(false);
  const [types, setTypes] = useState<string[]>([]);
  const [ems, setEms] = useState<string[]>([]);
  const visible = useMemo(
    () => filterRecords(records, types, ems),
    [records, types, ems],
  );
  const progress = profile?.date
    ? calculateProgress(profile.stage, profile.date)
    : { chip: "날짜 미설정", days: 0, caption: "우리에게 온 지" };
  const toggle = (x: string, a: string[], s: (v: string[]) => void) =>
    s(a.includes(x) ? a.filter((v) => v !== x) : [...a, x]);
  return (
    <Shell title={`${profile?.babyName || "콩콩이"}의 시간`}>
      <section className="hero">
        <div>
          <span className="week">{progress.chip}</span>
          <h2>
            {progress.caption}
            <br />
            <em>
              {progress.days ? `${progress.days}일째` : "날짜를 설정해주세요"}
            </em>
          </h2>
        </div>
        <div className="sun">☀</div>
      </section>
      <div className="toolbar">
        <div>
          <button className="chip active">전체 기록</button>
          {[...types, ...ems].map((x) => (
            <button className="chip" key={x}>
              {x} ×
            </button>
          ))}
        </div>
        <button className="filter" onClick={() => setOpen(true)}>
          <Filter />
          필터
        </button>
      </div>
      <div className="timeline">
        {visible.map((r, i) => (
          <NavLink
            className={`record ${r.color || ""}`}
            to={`/record/${r.id}`}
            key={r.id}
          >
            <div className="date">
              <b>{new Date(r.date).getDate()}</b>
              <span>
                {new Date(r.date).toLocaleDateString("ko-KR", {
                  month: "short",
                })}
              </span>
            </div>
            <article>
                <div className="record-art">
                  {r.photos?.length ? (
                    <img src={r.photos[0].dataUrl} alt={`${r.title} 대표 사진`} />
                  ) : (
                    icons[r.type]
                  )}
                  <span className="record-sparkle">✦</span>
                  {Boolean(r.photos?.length) && (
                    <b className="record-photo-count">
                      사진 {r.photos!.length}장
                    </b>
                  )}
                </div>
              <p>
                  <span>{labels[r.type]}</span> · {r.weekOrAge}
                  {r.time ? ` · ${r.time}` : ""}
              </p>
              <h3>{r.title}</h3>
              <p className="excerpt">{r.body}</p>
              <footer>
                <b>{r.emotion}</b>
                <span>{r.author}</span>
                {r.milestone && <i>특별한 순간</i>}
              </footer>
            </article>
            {i < visible.length - 1 && <div className="line" />}
          </NavLink>
        ))}
      </div>
      {!visible.length && (
        <div className="empty">
          <Heart />
          <h3>조건에 맞는 기록이 없어요</h3>
          <button
            onClick={() => {
              setTypes([]);
              setEms([]);
            }}
          >
            필터 전체 초기화
          </button>
        </div>
      )}
      {open && (
        <div className="overlay" onClick={() => setOpen(false)}>
          <section className="sheet" onClick={(e) => e.stopPropagation()}>
            <header>
              <h2>기록을 찾아볼까요?</h2>
              <button onClick={() => setOpen(false)}>
                <X />
              </button>
            </header>
            <h3>기록 종류</h3>
            <div className="choice wrap">
              {Object.entries(labels).map(([k, v]) => (
                <button
                  className={types.includes(k) ? "active" : ""}
                  onClick={() => toggle(k, types, setTypes)}
                  key={k}
                >
                  {icons[k as RecordType]} {v}
                </button>
              ))}
            </div>
            <h3>감정</h3>
            <div className="choice wrap">
              {emotions.map((x) => (
                <button
                  className={ems.includes(x) ? "active" : ""}
                  onClick={() => toggle(x, ems, setEms)}
                  key={x}
                >
                  {x}
                </button>
              ))}
            </div>
            <button className="primary" onClick={() => setOpen(false)}>
              필터 적용하기 · {visible.length}개
            </button>
            <button
              className="text"
              onClick={() => {
                setTypes([]);
                setEms([]);
              }}
            >
              전체 초기화
            </button>
          </section>
        </div>
      )}
    </Shell>
  );
}
function NewRecord() {
  const nav = useNavigate();
  return (
    <Shell title="새 기록">
      <div className="page-title">
        <p className="eyebrow">NEW MOMENT</p>
        <h2>
          어떤 순간을
          <br />
          남길까요?
        </h2>
        <p>오늘의 마음과 가장 가까운 기록을 골라주세요.</p>
      </div>
      <div className="type-grid">
        {(Object.keys(labels) as RecordType[]).map((t) => (
          <button onClick={() => nav(`/write/${t}`)} key={t}>
            <b>{icons[t]}</b>
            <span>
              <strong>{labels[t]}</strong>
              <small>
                {t === "daily"
                  ? "오늘의 작은 순간"
                  : t === "checkup"
                    ? "아기의 소식"
                    : t === "movement"
                      ? "처음 느낀 움직임"
                      : "아이에게 전하는 마음"}
              </small>
            </span>
            <ChevronRight />
          </button>
        ))}
      </div>
    </Shell>
  );
}
function Write() {
  const { type = "daily", id: editId } = useParams();
  const { addRecord, updateRecord, records, profile } = useStore();
  const existing = editId ? records.find((record) => record.id === editId) : undefined;
  const t = (existing?.type || type) as RecordType;
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const initialNow = useMemo(() => new Date(), []);
  const [recordDate, setRecordDate] = useState(
    existing?.date || initialNow.toLocaleDateString("sv-SE"),
  );
  const [recordTime, setRecordTime] = useState(
    existing?.time || initialNow.toTimeString().slice(0, 5),
  );
  const [body, setBody] = useState(existing?.body || "");
  const [emotion, setEmotion] = useState<Emotion | undefined>(existing?.emotion);
  const [errors, setErrors] = useState({ body: "", emotion: "" });
  const [photos, setPhotos] = useState<StoryPhoto[]>(existing?.photos || []);
  const [photoConfigId, setPhotoConfigId] = useState<string | null>(
    existing?.photos?.[0]?.id || null,
  );
  const initialStickers = useMemo<StickerInstance[]>(
    () =>
      ((existing?.stickers || []) as unknown[]).map((sticker, index) =>
        typeof sticker === "string"
          ? {
              id: crypto.randomUUID(),
              stickerId: sticker,
              x: 20 + ((index * 19) % 60),
              y: 20 + ((index * 23) % 55),
              scale: 1,
              rotation: ((index % 3) - 1) * 9,
              zIndex: index + 1,
              createdBy: "엄마" as const,
            }
          : (sticker as StickerInstance),
      ),
    [existing],
  );
  const [stickers, setStickers] = useState<StickerInstance[]>(initialStickers);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(
    initialStickers[0]?.id || null,
  );
  const stickerCanvasRef = useRef<HTMLDivElement>(null);
  const stickerDragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [mediaOpen, setMediaOpen] = useState<"photo" | "sticker" | null>(null);
  const stickerOptions = [
    "♡",
    "✦",
    "☁",
    "☾",
    "🍼",
    "🧸",
    "🌿",
    "🌼",
    "🎀",
    "🫧",
    "🍀",
    "☀",
  ];
  const addSticker = (stickerId: string) => {
    const instance: StickerInstance = {
      id: crypto.randomUUID(),
      stickerId,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      zIndex: Math.max(0, ...stickers.map((sticker) => sticker.zIndex)) + 1,
      createdBy: "엄마",
    };
    setStickers((items) => [...items, instance]);
    setSelectedStickerId(instance.id);
  };
  const updateSticker = (id: string, changes: Partial<StickerInstance>) =>
    setStickers((items) =>
      items.map((sticker) =>
        sticker.id === id ? { ...sticker, ...changes } : sticker,
      ),
    );
  const startStickerDrag = (
    event: React.PointerEvent<HTMLButtonElement>,
    sticker: StickerInstance,
  ) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedStickerId(sticker.id);
    stickerDragRef.current = {
      id: sticker.id,
      startX: event.clientX,
      startY: event.clientY,
      originX: sticker.x,
      originY: sticker.y,
    };
  };
  const moveSticker = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = stickerDragRef.current;
    const canvas = stickerCanvasRef.current;
    if (!drag || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    updateSticker(drag.id, {
      x: Math.max(4, Math.min(96, drag.originX + ((event.clientX - drag.startX) / rect.width) * 100)),
      y: Math.max(5, Math.min(95, drag.originY + ((event.clientY - drag.startY) / rect.height) * 100)),
    });
  };
  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    const room = 5 - photos.length;
    const selected = Array.from(files).slice(0, room);
    const next = await Promise.all(
      selected.map(async (f) => {
        const dataUrl = await compressPhoto(f);
        const presentation = await analyzePhoto(dataUrl);
        return {
          id: crypto.randomUUID(),
          name: f.name,
          dataUrl,
          fit: presentation.fit,
          aspect: presentation.aspect,
          height: presentation.height,
        } as StoryPhoto;
      }),
    );
    setPhotos((x) => [...x, ...next]);
    if (next[0]) setPhotoConfigId(next[0].id);
    setMediaOpen("photo");
  };
  const updatePhoto = (id: string, changes: Partial<StoryPhoto>) =>
    setPhotos((items) =>
      items.map((photo) => (photo.id === id ? { ...photo, ...changes } : photo)),
    );
  const applyAiPhotoFit = (photo: StoryPhoto) => {
    const aspect = photo.aspect || 1;
    updatePhoto(photo.id, {
      fit: aspect < 0.78 || aspect > 1.75 ? "contain" : "cover",
      height: aspect < 0.72 ? 420 : aspect > 1.65 ? 250 : 320,
    });
  };
  const save = () => {
    const e = validateRecord(body, emotion);
    setErrors(e);
    if (e.body || e.emotion) return;
    const id = existing?.id || crypto.randomUUID();
    const record = {
      id,
      type: t,
      title: body.split(/[.!?\n]/)[0].slice(0, 24) || "우리의 소중한 순간",
      body,
      emotion: emotion!,
      date: recordDate,
      time: recordTime,
      weekOrAge:
        profile?.stage === "born"
          ? calculateAge(profile.date, new Date(`${recordDate}T${recordTime}`))
          : profile?.date
            ? calculateWeek(
                profile.date,
                new Date(`${recordDate}T${recordTime}`),
              )
            : "11주 6일",
      author: existing?.author || ("엄마" as const),
      createdAt: existing?.createdAt || Date.now(),
      color: t === "movement" ? "sage" : "pink",
      photos,
      stickers,
      milestone: existing?.milestone || (t === "movement" ? "첫 태동" : undefined),
    };
    if (existing) updateRecord(record);
    else addRecord(record);
    nav(`/record/${id}`);
  };
  return (
    <Shell title={existing ? `${labels[t]} 기록 수정` : `${labels[t]} 기록`}>
      <div className="editor-status">
        <span>
          <i />
          배우자 접속 중
        </span>
        <b>저장됨</b>
      </div>
      <div className="author-tabs">
        <button className="active">
          <span className="avatar mom">엄</span>
          {profile?.momName || "엄마"}
        </button>
        <button>
          <span className="avatar partner">배</span>
          {profile?.partnerName || "배우자"}
        </button>
      </div>
      <section className="editor">
        <p className="eyebrow">{labels[t].toUpperCase()} STORY</p>
        <h2>
          {t === "daily"
            ? "오늘 가장 기억하고 싶은 순간"
            : t === "checkup"
              ? "오늘 만난 아기의 모습"
              : t === "movement"
                ? "어디에서 어떤 움직임을 느꼈나요?"
                : "아이에게 꼭 전하고 싶은 말"}
        </h2>
        <div className="record-datetime">
          <label>
            기록 날짜
            <input
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
            />
          </label>
          <label>
            기록 시간
            <input
              type="time"
              value={recordTime}
              onChange={(e) => setRecordTime(e.target.value)}
            />
          </label>
        </div>
        {t === "checkup" && (
          <div className="mini-fields">
            <input placeholder="병원" />
            <input type="date" />
          </div>
        )}
        <textarea
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            if (e.target.value) setErrors((x) => ({ ...x, body: "" }));
          }}
          placeholder="오늘의 이야기를 적어주세요…"
        />
        <small className="error">{errors.body}</small>
        <h3>오늘의 감정</h3>
        <div className="emotions">
          {emotions.map((x) => (
            <button
              className={emotion === x ? "active" : ""}
              onClick={() => {
                setEmotion(x);
                setErrors((e) => ({ ...e, emotion: "" }));
              }}
              key={x}
            >
              <span>
                {x === "행복"
                  ? "☺"
                  : x === "설렘"
                    ? "♡"
                    : x === "감동"
                      ? "✦"
                      : x === "걱정"
                        ? "☁"
                        : "☾"}
              </span>
              {x}
            </button>
          ))}
        </div>
        <small className="error">{errors.emotion}</small>
        <input
          ref={fileRef}
          hidden
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => addPhotos(e.target.files)}
        />
        <div className="tools">
          <button onClick={() => fileRef.current?.click()}>
            <ImagePlus />
            <span>사진 {photos.length}/5</span>
          </button>
          <button
            onClick={() =>
              setMediaOpen(mediaOpen === "sticker" ? null : "sticker")
            }
          >
            ✿<span>스티커 {stickers.length}</span>
          </button>
          <button>
            ✦<span>AI 제안</span>
          </button>
        </div>
        {photos.length > 0 && (
          <div className="photo-strip">
              {photos.map((p, i) => (
                <div
                  className={photoConfigId === p.id ? "configuring" : ""}
                  key={p.id}
                  onClick={() => setPhotoConfigId(p.id)}
                >
                <img src={p.dataUrl} alt={`${i + 1}번째 사진`} />
                <span>{i + 1}</span>
                <button
                  aria-label="사진 삭제"
                    onClick={(event) => {
                      event.stopPropagation();
                      setPhotos((x) => x.filter((v) => v.id !== p.id));
                      if (photoConfigId === p.id) setPhotoConfigId(null);
                    }}
                >
                  <Trash2 />
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <button
                className="photo-add"
                onClick={() => fileRef.current?.click()}
              >
                <Plus />
                추가
              </button>
            )}
            </div>
          )}
          {photos.find((photo) => photo.id === photoConfigId) && (() => {
            const photo = photos.find((item) => item.id === photoConfigId)!;
            return (
              <div className="photo-size-panel">
                <div>
                  <b>사진 표시 조절</b>
                  <small>글 영역을 침범하지 않도록 사진 프레임 안에서만 조절돼요.</small>
                </div>
                <div className="photo-fit-buttons">
                  <button onClick={() => applyAiPhotoFit(photo)}>
                    <Sparkles /> AI 맞춤
                  </button>
                  <button
                    className={photo.fit === "cover" ? "active" : ""}
                    onClick={() => updatePhoto(photo.id, { fit: "cover" })}
                  >
                    화면 채우기
                  </button>
                  <button
                    className={photo.fit === "contain" ? "active" : ""}
                    onClick={() => updatePhoto(photo.id, { fit: "contain" })}
                  >
                    전체 보기
                  </button>
                </div>
                <label>
                  사진 영역 높이 <span>{photo.height || 320}px</span>
                  <input
                    type="range"
                    min="220"
                    max="480"
                    step="10"
                    value={photo.height || 320}
                    onChange={(event) =>
                      updatePhoto(photo.id, { height: Number(event.target.value) })
                    }
                  />
                </label>
                <div
                  className="photo-fit-preview"
                  style={{ height: Math.min(240, (photo.height || 320) * 0.65) }}
                >
                  <img
                    src={photo.dataUrl}
                    alt="사진 표시 미리보기"
                    style={{ objectFit: photo.fit === "contain" ? "contain" : "cover" }}
                  />
                </div>
              </div>
            );
          })()}
        {mediaOpen === "sticker" && (
          <div className="sticker-picker">
            <b>기록에 어울리는 스티커</b>
            <div>
              {stickerOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => addSticker(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {stickers.length > 0 && (
          <div
            className="sticker-canvas free-placement"
            ref={stickerCanvasRef}
            style={
              photos[0]
                ? { backgroundImage: `url(${photos[0].dataUrl})` }
                : undefined
            }
          >
            {stickers.map((sticker) => (
              <button
                className={selectedStickerId === sticker.id ? "selected" : ""}
                style={{
                  left: `${sticker.x}%`,
                  top: `${sticker.y}%`,
                  zIndex: sticker.zIndex,
                  transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
                }}
                key={sticker.id}
                onPointerDown={(event) => startStickerDrag(event, sticker)}
                onPointerMove={moveSticker}
                onPointerUp={() => (stickerDragRef.current = null)}
                onPointerCancel={() => (stickerDragRef.current = null)}
              >
                {sticker.stickerId}
              </button>
            ))}
            <small>스티커를 손가락이나 마우스로 원하는 위치에 옮겨보세요.</small>
          </div>
        )}
        {stickers.find((sticker) => sticker.id === selectedStickerId) && (() => {
          const sticker = stickers.find((item) => item.id === selectedStickerId)!;
          return (
            <div className="sticker-controls">
              <div><b>선택한 스티커</b><span>{sticker.stickerId}</span></div>
              <label>크기 <input type="range" min="0.5" max="2.5" step="0.1" value={sticker.scale} onChange={(event) => updateSticker(sticker.id, { scale: Number(event.target.value) })} /></label>
              <label>회전 <input type="range" min="-180" max="180" step="5" value={sticker.rotation} onChange={(event) => updateSticker(sticker.id, { rotation: Number(event.target.value) })} /></label>
              <div className="sticker-actions">
                <button onClick={() => {
                  const copy = { ...sticker, id: crypto.randomUUID(), x: Math.min(92, sticker.x + 8), y: Math.min(92, sticker.y + 8), zIndex: sticker.zIndex + 1 };
                  setStickers((items) => [...items, copy]);
                  setSelectedStickerId(copy.id);
                }}>복제</button>
                <button onClick={() => {
                  setStickers((items) => items.filter((item) => item.id !== sticker.id));
                  setSelectedStickerId(null);
                }}>삭제</button>
              </div>
            </div>
          );
        })()}
        {body && emotion && (
          <div className="ai-card">
            <Sparkles />
            <div>
              <b>이런 표현은 어때요?</b>
              <p>
                “{body.slice(0, 18)}
                {body.length > 18 ? "…" : ""}”
              </p>
              <small>AI 제안은 선택하기 전까지 원문에 반영되지 않아요.</small>
            </div>
          </div>
        )}
          <button className="primary" onClick={save}>
            {existing ? "수정 내용 저장하기" : "오늘의 순간 저장하기"}
          </button>
      </section>
    </Shell>
  );
}
function Detail() {
  const { id } = useParams();
  const { records } = useStore();
  const r = records.find((x) => x.id === id);
  const nav = useNavigate();
  const [index, setIndex] = useState(0);
  if (!r) return null;
  const photos = r.photos || [];
  const placedStickers = ((r.stickers || []) as unknown[]).map(
    (sticker, stickerIndex) =>
      typeof sticker === "string"
        ? {
            id: `legacy-${stickerIndex}`,
            stickerId: sticker,
            x: 18 + ((stickerIndex * 23) % 68),
            y: 18 + ((stickerIndex * 29) % 62),
            scale: 1,
            rotation: stickerIndex % 2 ? 12 : -9,
            zIndex: stickerIndex + 1,
            createdBy: "엄마" as const,
          }
        : (sticker as StickerInstance),
  );
  return (
    <Shell title="앨범 한 페이지">
      <button className="back inline" onClick={() => nav("/timeline")}>
        <ChevronLeft /> 타임라인
      </button>
      <article className="album">
          <div
            className={`album-photo ${r.color || ""}`}
            style={{ height: photos.length ? photos[index].height || 320 : 280 }}
          >
          {photos.length ? (
            <img
                src={photos[index].dataUrl}
                alt={`${r.title} 사진 ${index + 1}`}
                style={{
                  objectFit:
                    photos[index].fit === "cover" ? "cover" : "contain",
                }}
            />
          ) : (
            <span>{icons[r.type]}</span>
          )}
          <div className="album-stickers">
            {placedStickers.map((sticker) => (
              <i
                style={{
                  left: `${sticker.x}%`,
                  top: `${sticker.y}%`,
                  zIndex: sticker.zIndex,
                  transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
                }}
                key={sticker.id}
              >
                {sticker.stickerId}
              </i>
            ))}
          </div>
          {photos.length > 1 && (
            <>
              <button
                className="photo-prev"
                onClick={() =>
                  setIndex((index - 1 + photos.length) % photos.length)
                }
              >
                <ChevronLeft />
              </button>
              <button
                className="photo-next"
                onClick={() => setIndex((index + 1) % photos.length)}
              >
                <ChevronRight />
              </button>
            </>
          )}
          <b>
            {photos.length
              ? `${index + 1} / ${photos.length}`
              : "사진 없이 남긴 기록"}
          </b>
        </div>
        <div className="album-copy">
          <p className="eyebrow">{r.milestone || labels[r.type]}</p>
          <h2>{r.title}</h2>
          <div className="meta">
            <span>{r.emotion}</span>
            <span>{labels[r.type]}</span>
            <span>{r.weekOrAge}</span>
          </div>
          <p className="body">{r.body}</p>
            <div className="signature">
            <span className="avatar mom">엄</span>
            <div>
                <small>
                  {r.date}
                  {r.time ? ` · ${r.time}` : ""}
                </small>
              <b>{r.author}가 남긴 이야기</b>
            </div>
            </div>
            <button className="outline" onClick={() => nav(`/edit/${r.id}`)}>
              이 기록 수정하기
            </button>
            {r.milestone && (
            <button className="outline" onClick={() => nav("/stories")}>
              이 순간을 성장 이야기로 만들기
            </button>
          )}
        </div>
      </article>
    </Shell>
  );
}
function Stories() {
  const { records, stories, addStory, profile } = useStore();
  const nav = useNavigate();
  const [candidate, setCandidate] = useState("첫 태동");
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const sources = records
    .filter((r) => r.milestone === candidate || r.type === "movement")
    .slice(0, 4);
  const existing = stories.find((s) => s.milestone === candidate);
  const generate = () => {
    const lines = sources.length
      ? sources.map((r) => r.body)
      : records.slice(0, 2).map((r) => r.body);
    setDraft(
      `${profile?.babyName || "아기"}가 우리에게 처음 움직임으로 인사한 날을 기억해요.\n\n${lines.join("\n\n")}\n\n그날의 작은 떨림은 두 사람의 마음에 오래 남아, 앞으로 함께 써 내려갈 이야기의 첫 문장이 되었습니다.`,
    );
    setEditing(true);
  };
  const save = () => {
    addStory({
      id: existing?.id || crypto.randomUUID(),
      milestone: candidate,
      title: `${candidate}의 이야기`,
      story: draft,
      sourceRecordIds: sources.map((r) => r.id),
      createdAt: Date.now(),
      status: "완성",
    });
    setEditing(false);
  };
  return (
    <Shell title="성장 이야기">
      <div className="page-title">
        <p className="eyebrow">MILESTONE STORIES</p>
        <h2>
          특별한 이야기가
          <br />
          준비됐어요
        </h2>
        <p>부모가 남긴 원문만 모아 아이에게 전할 한 장의 이야기로 엮어요.</p>
        <button className="story-create-cta" onClick={() => nav("/stories/new")}>
          <Plus /> 기록을 골라 새 이야기 앨범 만들기
        </button>
      </div>
      {stories.length > 0 && (
        <div className="story-album-list">
          {stories.map((story) => (
            <article key={story.id}>
              <span><BookHeart /></span>
              <div>
                <small>{story.milestone} · 기록 {story.sourceRecordIds.length}개</small>
                <b>{story.title}</b>
                <p>{story.story}</p>
              </div>
            </article>
          ))}
        </div>
      )}
      {editing ? (
        <article className="story-editor">
          <div>
            <Sparkles />
            <b>AI 초안 · 직접 수정 가능</b>
          </div>
          <input value={`${candidate}의 이야기`} readOnly />
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} />
          <div className="story-sources">
            <b>사용한 원문 {sources.length}개</b>
            {sources.map((s) => (
              <small key={s.id}>
                {s.date} · {s.title}
              </small>
            ))}
          </div>
          <button className="primary" onClick={save}>
            확인하고 성장 이야기 저장
          </button>
          <button className="text" onClick={() => setEditing(false)}>
            초안 닫기
          </button>
        </article>
      ) : existing ? (
        <article className="finished-story">
          <div>
            <Sparkles />
            <span>확인 완료</span>
          </div>
          <p>{existing.milestone}</p>
          <h3>{existing.title}</h3>
          {existing.story
            .split("\n")
            .filter(Boolean)
            .map((p, i) => (
              <p className="story-paragraph" key={i}>
                {p}
              </p>
            ))}
          <button
            onClick={() => {
              setDraft(existing.story);
              setEditing(true);
            }}
          >
            이야기 다시 다듬기
          </button>
        </article>
      ) : (
        <article className="milestone-card">
          <div>
            <Sparkles />
            <span>이야기 후보</span>
          </div>
          <p>{candidate}</p>
          <h3>
            작은 움직임이
            <br />
            처음 말을 건 날
          </h3>
          <small>
            관련 기록 {sources.length}개 · 사진{" "}
            {sources.reduce((n, r) => n + (r.photos?.length || 0), 0)}장
          </small>
          <button onClick={generate}>
            성장 이야기 만들기 <ChevronRight />
          </button>
        </article>
      )}
      <h3 className="section-title">우리의 특별한 순간</h3>
      <div className="milestone-list">
        {["임신 확인", "첫 초음파", "첫 태동", "출산", "첫 웃음"].map((x) => {
          const done = stories.some((s) => s.milestone === x);
          const count = records.filter((r) => r.milestone === x).length;
          return (
            <button key={x} onClick={() => setCandidate(x)}>
              <span>{done ? "✓" : count ? "✦" : "○"}</span>
              <p>
                <b>{x}</b>
                <small>
                  {done
                    ? "이야기 완성"
                    : count
                      ? "이야기 후보"
                      : "기록을 기다리는 중"}
                </small>
              </p>
            </button>
          );
        })}
      </div>
    </Shell>
  );
}

function StoryBuilder() {
  const nav = useNavigate();
  const { records, addStory, profile } = useStore();
  const [types, setTypes] = useState<string[]>([]);
  const [ems, setEms] = useState<string[]>([]);
  const [milestonesOnly, setMilestonesOnly] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [draft, setDraft] = useState("");
  const filtered = useMemo(
    () =>
      records.filter(
        (r) =>
          (!types.length || types.includes(r.type)) &&
          (!ems.length || ems.includes(r.emotion)) &&
          (!milestonesOnly || Boolean(r.milestone)),
      ),
    [records, types, ems, milestonesOnly],
  );
  const toggle = (value: string, list: string[], set: (next: string[]) => void) =>
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  const sources = records.filter((r) => selected.includes(r.id));
  const generate = () => {
    if (!sources.length) return;
    const suggestedTitle =
      sources.length === 1
        ? sources[0].title
        : `${profile?.babyName || "아기"}와 함께 모은 ${sources.length}개의 순간`;
    setTitle(suggestedTitle);
    setDraft(
      sources
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((r) => `${r.date}${r.time ? ` ${r.time}` : ""}, ${r.body}`)
        .join("\n\n"),
    );
  };
  const save = () => {
    if (!title.trim() || !draft.trim() || !selected.length) return;
    addStory({
      id: crypto.randomUUID(),
      milestone: sources.some((r) => r.milestone)
        ? sources.map((r) => r.milestone).filter(Boolean).join(" · ")
        : "선택 기록 이야기",
      title: title.trim(),
      story: draft.trim(),
      sourceRecordIds: selected,
      createdAt: Date.now(),
      status: "완성",
    });
    nav("/stories");
  };
  return (
    <Shell title="이야기 앨범 만들기">
      <section className="story-builder">
        <button className="back-row" onClick={() => nav("/stories")}>
          <ChevronLeft /> 이야기로
        </button>
        <p className="eyebrow">SELECT YOUR MOMENTS</p>
        <h2>어떤 기록을 모아<br />이야기로 만들까요?</h2>
        <div className="builder-filters">
          <b>기록 필터</b>
          <div>
            {(Object.keys(labels) as RecordType[]).map((type) => (
              <button className={types.includes(type) ? "active" : ""} key={type} onClick={() => toggle(type, types, setTypes)}>
                {labels[type]}
              </button>
            ))}
          </div>
          <div>
            {emotions.map((emotion) => (
              <button className={ems.includes(emotion) ? "active" : ""} key={emotion} onClick={() => toggle(emotion, ems, setEms)}>
                {emotion}
              </button>
            ))}
          </div>
          <label>
            <input type="checkbox" checked={milestonesOnly} onChange={(e) => setMilestonesOnly(e.target.checked)} />
            특별한 순간 기록만 보기
          </label>
        </div>
        <div className="builder-records">
          <div><b>기록 선택</b><span>{selected.length}개 선택</span></div>
          {filtered.map((record) => (
            <label className={selected.includes(record.id) ? "selected" : ""} key={record.id}>
              <input type="checkbox" checked={selected.includes(record.id)} onChange={() => toggle(record.id, selected, setSelected)} />
              <span>{icons[record.type]}</span>
              <div>
                <small>{record.date}{record.time ? ` · ${record.time}` : ""} · {labels[record.type]} · {record.emotion}</small>
                <b>{record.title}</b>
                <p>{record.body}</p>
              </div>
            </label>
          ))}
          {!filtered.length && <p className="builder-empty">조건에 맞는 기록이 없어요.</p>}
        </div>
        {!draft ? (
          <button className="primary" disabled={!selected.length} onClick={generate}>
            선택한 {selected.length}개 기록으로 초안 만들기
          </button>
        ) : (
          <div className="builder-draft">
            <label>이야기 앨범 제목<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
            <label>성장 이야기<textarea value={draft} onChange={(e) => setDraft(e.target.value)} /></label>
            <small>선택한 기록의 원문만 사용했습니다. 저장 전에 자유롭게 다듬어주세요.</small>
            <button className="primary" onClick={save}>새 이야기 앨범 저장하기</button>
          </div>
        )}
      </section>
    </Shell>
  );
}
function Invite() {
  const { profile } = useStore();
  const { user, ready } = useAuthUser();
  const [invite, setInvite] = useState<{ link: string; pin: string; expiresAt: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const issueInvite = async () => {
    if (!profile || !user) return;
    setBusy(true);
    setMessage("");
    try {
      let workspaceId = localStorage.getItem("ofs-workspace-id");
      if (!workspaceId) {
        const workspace = await createWorkspaceRemote({
          babyName: profile.babyName,
          stage: profile.stage,
          date: profile.date,
          displayName: profile.momName,
        });
        workspaceId = workspace.workspaceId;
        localStorage.setItem("ofs-workspace-id", workspaceId);
      }
      const result = await createInviteRemote(workspaceId);
      const link = `${window.location.origin}/join/${encodeURIComponent(result.token)}`;
      setInvite({ link, pin: result.pin, expiresAt: result.expiresAt });
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "초대를 만들지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };
  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setMessage(`${label}를 복사했습니다.`);
  };
  const share = async () => {
    if (!invite) return;
    const text = `${profile?.babyName || "아기"}의 가족 앨범에 초대했어요.\n초대 링크: ${invite.link}\n6자리 PIN: ${invite.pin}`;
    if (navigator.share) await navigator.share({ title: "우리의 첫 이야기 초대", text, url: invite.link });
    else await copy(text, "초대 내용");
  };
  return (
    <Shell title="배우자 초대">
      <div className="page-title center">
        <Users />
        <h2>배우자를 초대해요</h2>
        <p>링크와 PIN은 따로 전달하면 더 안전해요.</p>
      </div>
      {!firebaseEnabled ? (
        <div className="firebase-notice"><b>Firebase 연결이 필요해요</b><p><code>.env</code>에 Firebase 값을 넣고 <code>VITE_USE_MOCK=false</code>로 설정하면 실제 로그인과 초대 발급이 활성화됩니다.</p></div>
      ) : !ready ? (
        <div className="invite-loading">로그인 상태를 확인하고 있어요…</div>
      ) : !user ? (
        <AuthPanel />
      ) : !invite ? (
        <div className="invite-card issue-invite">
          <div className="signed-user"><span>로그인됨</span><b>{user.email}</b></div>
          <p>서버에서 예측하기 어려운 초대 링크와 별도의 6자리 개인번호를 발급합니다.</p>
          <button className="primary" disabled={busy} onClick={issueInvite}>{busy ? "안전한 초대 발급 중…" : "새 초대 링크와 개인번호 받기"}</button>
          {message && <small>{message}</small>}
        </div>
      ) : (
        <div className="invite-card">
          <label>초대 링크<div><code>{invite.link}</code><button onClick={() => copy(invite.link, "초대 링크")}>복사</button></div></label>
          <label>6자리 개인번호<div><strong>{invite.pin.slice(0, 3)} {invite.pin.slice(3)}</strong><button onClick={() => copy(invite.pin, "개인번호")}>복사</button></div></label>
          <button className="primary" onClick={share}>배우자에게 공유하기</button>
          <button className="outline" onClick={issueInvite}>새 초대 추가 발급</button>
          {message && <small>{message}</small>}
          <small>개인번호는 링크에 포함되지 않으며 {new Date(invite.expiresAt).toLocaleString("ko-KR")}에 만료됩니다.</small>
        </div>
      )}
    </Shell>
  );
}

function JoinInvite() {
  const { token = "" } = useParams();
  const nav = useNavigate();
  const { user, ready } = useAuthUser();
  const [pin, setPin] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const join = async () => {
    setError("");
    if (!/^\d{6}$/.test(pin) || !displayName.trim()) {
      setError("6자리 개인번호와 표시 이름을 입력해주세요.");
      return;
    }
    setBusy(true);
    try {
      const result = await joinWorkspaceRemote({ token, pin, displayName: displayName.trim() });
      localStorage.setItem("ofs-workspace-id", result.workspaceId);
      localStorage.setItem("ofs-collaborator-name", displayName.trim());
      nav("/timeline");
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "앨범에 참여하지 못했습니다.";
      setError(message.includes("PIN") ? "개인번호가 올바르지 않습니다." : message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="join-page">
      <MoonMark />
      <p className="eyebrow">PRIVATE FAMILY INVITE</p>
      <h1>함께 기록할게요</h1>
      <p>로그인한 계정과 가족 앨범을 안전하게 연결합니다.</p>
      {!firebaseEnabled ? <div className="firebase-notice">Firebase 연결이 필요합니다.</div> : !ready ? <div>로그인 확인 중…</div> : !user ? <AuthPanel /> : (
        <div className="join-card">
          <small>{user.email} 계정으로 참여</small>
          <label>6자리 개인번호<input inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="000000" /></label>
          <label>표시 이름<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="예: 민준" /></label>
          {error && <small className="auth-error">{error}</small>}
          <button className="primary" disabled={busy} onClick={join}>{busy ? "참여 확인 중…" : "가족 앨범 참여하기"}</button>
        </div>
      )}
    </div>
  );
}
function SettingsPage() {
  const nav = useNavigate();
  const { profile } = useStore();
  const age = profile?.date
    ? profile.stage === "pregnant"
      ? calculateWeek(profile.date)
      : calculateAge(profile.date)
    : "날짜 미설정";
  return (
    <Shell title="설정">
      <div className="settings-card">
        <div className="baby-icon">
          <Baby />
        </div>
        <h2>{profile?.babyName || "콩콩이"}의 앨범</h2>
        <p>
          {profile?.momName || "엄마"}와 {profile?.partnerName || "배우자"}가
          함께 기록 중
        </p>
      </div>
      <div className="settings-list">
        <button onClick={() => nav("/invite")}>
          <Users />
          <span>
            <b>배우자와 함께</b>
            <small>초대 링크와 참여자 관리</small>
          </span>
          <ChevronRight />
        </button>
        <button onClick={() => nav("/settings/baby")}>
          <CalendarDays />
          <span>
            <b>아기 정보</b>
            <small>
              {profile?.stage === "born" ? "생년월일" : "예정일"} · 현재 {age}
            </small>
          </span>
          <ChevronRight />
        </button>
        <button onClick={() => nav("/settings/history")}>
          <BookHeart />
          <span>
            <b>변경 이력</b>
            <small>편집 기록 확인과 복원</small>
          </span>
          <ChevronRight />
        </button>
      </div>
      <div className="demo-banner">
        데모 모드 · 이 기기에 안전하게 저장되고 있어요
      </div>
    </Shell>
  );
}
function BabySettings() {
  const nav = useNavigate();
  const { profile, setProfile } = useStore();
  const [p, setP] = useState<Profile>(
    profile || {
      babyName: "",
      stage: "pregnant",
      date: "",
      momName: "엄마",
      partnerName: "배우자",
    },
  );
  const preview = p.date
    ? p.stage === "pregnant"
      ? calculateWeek(p.date)
      : calculateAge(p.date)
    : "";
  return (
    <Shell title="아기 정보">
      <section className="settings-editor">
        <button className="back-row" onClick={() => nav("/settings")}>
          <ChevronLeft />
          설정으로
        </button>
        <p className="eyebrow">BABY PROFILE</p>
        <h2>
          우리 가족의 정보를
          <br />
          수정할 수 있어요
        </h2>
        <label>
          태명 또는 아이 이름
          <input
            value={p.babyName}
            onChange={(e) => setP({ ...p, babyName: e.target.value })}
          />
        </label>
        <label>현재 단계</label>
        <div className="choice">
          <button
            className={p.stage === "pregnant" ? "active" : ""}
            onClick={() => setP({ ...p, stage: "pregnant" })}
          >
            🤰 임신 중
          </button>
          <button
            className={p.stage === "born" ? "active" : ""}
            onClick={() => setP({ ...p, stage: "born" })}
          >
            🍼 출산 후
          </button>
        </div>
        <label>
          {p.stage === "pregnant" ? "출산 예정일" : "생년월일"}
          <input
            type="date"
            value={p.date}
            onChange={(e) => setP({ ...p, date: e.target.value })}
          />
        </label>
        {preview && <div className="calculated">현재 {preview}로 계산돼요</div>}
        <div className="settings-names">
          <label>
            엄마 표시 이름
            <input
              value={p.momName}
              onChange={(e) => setP({ ...p, momName: e.target.value })}
            />
          </label>
          <label>
            배우자 표시 이름
            <input
              value={p.partnerName}
              onChange={(e) => setP({ ...p, partnerName: e.target.value })}
            />
          </label>
        </div>
        <button
          className="primary"
          disabled={!p.babyName.trim() || !p.date}
          onClick={() => {
            setProfile(p);
            nav("/settings");
          }}
        >
          변경 내용 저장하기
        </button>
      </section>
    </Shell>
  );
}
function HistorySettings() {
  const nav = useNavigate();
  const { records, restoreRecord } = useStore();
  const [selected, setSelected] = useState<string | null>(null);
  const chosen = records.find((r) => r.id === selected);
  const historyDate = (r: (typeof records)[number]) =>
    new Date(
      r.createdAt > 1000000000000 ? r.createdAt : new Date(r.date).getTime(),
    ).toLocaleString("ko-KR");
  return (
    <Shell title="변경 이력">
      <section className="history-page">
        <button className="back-row" onClick={() => nav("/settings")}>
          <ChevronLeft />
          설정으로
        </button>
        <p className="eyebrow">EDIT HISTORY</p>
        <h2>
          기록의 지난 모습을
          <br />
          확인하고 복원하세요
        </h2>
        <p className="history-help">
          복원하면 현재 기록은 그대로 유지되고, 선택한 시점의 복원본이
          타임라인에 새로 추가됩니다.
        </p>
        <div className="history-list">
          {[...records]
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((r) => (
              <button
                className={selected === r.id ? "selected" : ""}
                key={r.id}
                onClick={() => setSelected(r.id)}
              >
                <span className={`history-icon ${r.color || ""}`}>
                  {icons[r.type]}
                </span>
                <div>
                  <small>{historyDate(r)}</small>
                  <b>{r.title}</b>
                  <em>
                    {r.author} · {labels[r.type]} · {r.emotion}
                  </em>
                </div>
                <ChevronRight />
              </button>
            ))}
        </div>
        {chosen && (
          <div className="restore-panel">
            <b>선택한 시점</b>
            <h3>{chosen.title}</h3>
            <p>{chosen.body}</p>
            <div>
              <button onClick={() => nav(`/record/${chosen.id}`)}>
                현재 기록 보기
              </button>
              <button
                className="restore"
                onClick={() => {
                  restoreRecord(chosen.id);
                  nav("/timeline");
                }}
              >
                이 시점으로 복원
              </button>
            </div>
          </div>
        )}
      </section>
    </Shell>
  );
}
function MoonMark() {
  return (
    <div className="moon-mark">
      <div className="moon-cut" />
      <span>♡</span>
      <i>✦</i>
      <b>·</b>
    </div>
  );
}
function PhoneSetup() {
  const nav = useNavigate();
  const { profile, setProfile } = useStore();
  const [p, setP] = useState<Profile>(
    profile || {
      babyName: "별이",
      stage: "pregnant",
      date: "2026-12-14",
      momName: "서윤",
      partnerName: "민준",
    },
  );
  const start = () => {
    setProfile(p);
    nav("/timeline");
  };
  return (
    <div className="phone-screen">
      <div className="phone-status">
        <b>9:41</b>
        <span>▥　●　▰</span>
      </div>
      <div className="dynamic-island" />
      <section className="phone-intro">
        <MoonMark />
        <p>우리의 첫 페이지</p>
        <h2>
          아기와 함께할
          <br />
          이야기를 시작해요
        </h2>
        <small>
          임신부터 육아까지, 두 사람의 마음을 한 권의 앨범으로 모아드릴게요.
        </small>
      </section>
      <section className="phone-form">
        <label>
          아기의 태명 또는 이름
          <input
            value={p.babyName}
            onChange={(e) => setP({ ...p, babyName: e.target.value })}
          />
        </label>
        <div className="segmented">
          <button
            className={p.stage === "pregnant" ? "on" : ""}
            onClick={() => setP({ ...p, stage: "pregnant" })}
          >
            예정일
          </button>
          <button
            className={p.stage === "born" ? "on" : ""}
            onClick={() => setP({ ...p, stage: "born" })}
          >
            생년월일
          </button>
        </div>
        <label>
          {p.stage === "pregnant" ? "출산 예정일" : "생년월일"}
          <input
            type="date"
            value={p.date}
            onChange={(e) => setP({ ...p, date: e.target.value })}
          />
        </label>
        <div className="phone-row">
          <label>
            엄마 표시 이름
            <input
              value={p.momName}
              onChange={(e) => setP({ ...p, momName: e.target.value })}
            />
          </label>
          <label>
            배우자 표시 이름
            <input
              value={p.partnerName}
              onChange={(e) => setP({ ...p, partnerName: e.target.value })}
            />
          </label>
        </div>
      </section>
      <button
        className="phone-cta"
        disabled={!p.babyName.trim() || !p.date}
        onClick={start}
      >
        {p.babyName.trim() || "아기"}의 앨범 {profile ? "계속하기" : "시작하기"}{" "}
        <span>→</span>
      </button>
      <small className="privacy-copy">
        입력한 정보는 주수와 개월 수를 계산하는 데 사용돼요.
      </small>
      <div className="home-indicator" />
    </div>
  );
}
function Showcase() {
  const nav = useNavigate();
  const cards = [
    ["01", "처음 설정", "아기와 가족 정보", "/"],
    ["02", "타임라인", "필터로 기록 찾기", "/timeline"],
    ["03", "일기와 AI", "자동 제안 선택·수정", "/write/daily"],
    ["04", "앨범 감상", "한 장씩 넘겨보기", "/record/first-ultrasound"],
    ["05", "성장 이야기", "특별한 순간 묶기", "/stories"],
    ["06", "공동 초대", "링크와 6자리 PIN", "/invite"],
  ];
  return (
    <div className="showcase">
      <section className="showcase-copy">
        <div className="showcase-brand">
          <span>별</span>
          <div>
            <small>INTERACTIVE MOCKUP</small>
            <b>우리의 첫 이야기</b>
          </div>
        </div>
        <div className="showcase-hero">
          <p>임신부터 육아까지</p>
          <h1>
            두 사람의 마음을
            <br />한 권의 이야기로
          </h1>
          <h2>
            오른쪽 휴대폰 화면을 직접 눌러 핵심 경험을 살펴보세요. 따뜻한
            스크랩북 감성과 여백 많은 파스텔 디자인을 함께 담았습니다.
          </h2>
        </div>
        <div className="showcase-menu">
          {cards.map(([n, t, d, path], i) => (
            <button
              className={i === 0 ? "active" : ""}
              key={n}
              onClick={() => path !== "/" && nav(path)}
            >
              <em>{n}</em>
              <span>
                <b>{t}</b>
                <small>{d}</small>
              </span>
              <i>→</i>
            </button>
          ))}
        </div>
        <div className="showcase-tip">
          <b>TIP</b>
          <p>
            타임라인의 <strong>오늘 기록하기</strong> 버튼부터 시작하면 전체
            흐름을 자연스럽게 체험할 수 있어요.
          </p>
        </div>
      </section>
      <section className="device-wrap">
        <div className="phone-device">
          <PhoneSetup />
        </div>
      </section>
    </div>
  );
}
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Showcase />} />
      <Route path="/welcome" element={<Intro />} />
      <Route path="/setup" element={<Setup />} />
      <Route path="/ready" element={<Ready />} />
      <Route path="/timeline" element={<Timeline />} />
      <Route path="/new" element={<NewRecord />} />
      <Route path="/write/:type" element={<Write />} />
      <Route path="/edit/:id" element={<Write />} />
      <Route path="/record/:id" element={<Detail />} />
      <Route path="/stories" element={<Stories />} />
      <Route path="/stories/new" element={<StoryBuilder />} />
      <Route path="/invite" element={<Invite />} />
      <Route path="/join/:token" element={<JoinInvite />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/settings/baby" element={<BabySettings />} />
      <Route path="/settings/history" element={<HistorySettings />} />
      <Route path="*" element={<Showcase />} />
    </Routes>
  );
}
