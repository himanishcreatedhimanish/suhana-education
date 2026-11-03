"use client";
import { useEffect } from "react";
import { PlayIcon, LiveIcon, CheckIcon, DownloadIcon, ClockIcon, XIcon } from "@/components/icons";

export interface PlayerLecture {
  id: string;
  courseId: string;
  title: string;
  type: "recorded" | "live";
  duration_min: number;
  description?: string | null;
  scheduled_at?: string | null;
  subject: string;
  chapterTitle: string;
  courseTitle: string;
  videoUrl?: string | null; // wired when real content is connected
}

export default function LecturePlayer({
  lecture, done, downloaded, onClose, onToggleDone, onToggleDownload,
}: {
  lecture: PlayerLecture;
  done: boolean;
  downloaded: boolean;
  onClose: () => void;
  onToggleDone: () => void;
  onToggleDownload: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const isLive = lecture.type === "live";
  const when = lecture.scheduled_at
    ? new Date(lecture.scheduled_at).toLocaleString("en-IN", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <div className="lp-bg" role="dialog" aria-modal="true" aria-label={lecture.title} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="lp-modal">
        <button className="lp-x" onClick={onClose} aria-label="Close"><XIcon size={18} /></button>

        <div className="lp-stage">
          {lecture.videoUrl ? (
            <video className="lp-video" src={lecture.videoUrl} controls playsInline />
          ) : (
            <div className="lp-placeholder">
              <div className="lp-play">{isLive ? <LiveIcon size={28} /> : <PlayIcon size={24} />}</div>
              <div className="lp-ph-title">{isLive ? (when ? `Live class on ${when}` : "Live class") : "Recorded lecture"}</div>
              <div className="lp-ph-sub">
                {isLive
                  ? "The stream and join link appear here when the class begins."
                  : "The video plays here once lecture content is connected."}
              </div>
            </div>
          )}
        </div>

        <div className="lp-body">
          <div className="lp-crumb">{lecture.subject}, {lecture.chapterTitle}</div>
          <h3 className="lp-title">{lecture.title}</h3>
          <div className="meta">
            <span className={"badge" + (isLive ? " live" : "")}>{isLive ? "Live" : "Recorded"}</span>
            <span><ClockIcon size={14} />{lecture.duration_min} min</span>
            <span>{lecture.courseTitle}</span>
          </div>
          {lecture.description && <p className="lp-desc">{lecture.description}</p>}

          <div className="lp-actions">
            {isLive ? (
              <button className="btn" onClick={onClose}>Join live class</button>
            ) : (
              <>
                <button className={"btn" + (done ? " ghost" : "")} onClick={onToggleDone} aria-pressed={done}>
                  <CheckIcon size={17} />{done ? "Marked as done" : "Mark as done"}
                </button>
                <button className={"btn ghost" + (downloaded ? " lp-saved" : "")} onClick={onToggleDownload} aria-pressed={downloaded}>
                  <DownloadIcon size={17} />{downloaded ? "Downloaded" : "Download"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
