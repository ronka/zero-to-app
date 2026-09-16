import Markdown from "react-markdown";

import {
  getYouTubeEmbedUrl,
  type TutorialVideo,
} from "../_lib/videos";
import { VideoCompletionButton } from "./video-completion-button";

type VideoGuidePageProps = {
  eyebrow: string;
  title: string;
  introduction: string;
  storageKey: `zero-to-saas:videos:${"web" | "mobile"}:completed`;
  videos: readonly TutorialVideo[];
};

function VideoCard({
  index,
  storageKey,
  video,
}: {
  index: number;
  storageKey: VideoGuidePageProps["storageKey"];
  video: TutorialVideo;
}) {
  const embedUrl = getYouTubeEmbedUrl(video.videoUrl);

  return (
    <details className="group overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--surface)] open:border-zinc-600">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-5 py-5 marker:content-none md:px-7 md:py-6 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-4">
          <span className="font-mono text-xs font-black text-[var(--coral)]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-lg font-black tracking-tight md:text-xl">
            {video.title}
          </span>
        </span>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-600 text-xl text-zinc-300 transition group-open:rotate-45 group-open:border-[var(--lime)] group-open:text-[var(--lime)]"
          aria-hidden="true"
        >
          +
        </span>
      </summary>

      <div className="border-t border-[var(--line)]">
        {embedUrl ? (
          <div className="aspect-video bg-black">
            <iframe
              src={embedUrl}
              title={video.title}
              className="h-full w-full"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center bg-black/40 px-6 text-center text-sm font-bold text-zinc-500">
            כתובת הסרטון אינה תקינה.
          </div>
        )}

        <div className="p-6 md:p-8">
          <div className="space-y-4 leading-7 text-zinc-400 [&_a]:font-bold [&_a]:text-[var(--sky)] [&_a]:underline [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[var(--lime)] [&_li]:ms-5 [&_li]:list-disc [&_ul]:space-y-2">
            <Markdown>{video.description}</Markdown>
          </div>
          <div className="mt-6 border-t border-[var(--line)] pt-6">
            <VideoCompletionButton
              storageKey={storageKey}
              videoId={`${video.title}:${video.videoUrl}`}
            />
          </div>
        </div>
      </div>
    </details>
  );
}

export function VideoGuidePage({
  eyebrow,
  title,
  introduction,
  storageKey,
  videos,
}: VideoGuidePageProps) {
  return (
    <main className="flex-1">
      <section className="border-b border-[var(--line)] py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-5 md:px-8">
          <p className="font-mono text-sm font-bold text-[var(--coral)]">
            {eyebrow}
          </p>
          <h1 className="mt-5 text-5xl font-black tracking-[-.05em] md:text-7xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
            {introduction}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14 md:px-8 md:py-20">
        {videos.length > 0 ? (
          <div className="grid gap-8">
            {videos.map((video, index) => (
              <VideoCard
                key={`${video.title}-${video.videoUrl}`}
                index={index}
                storageKey={storageKey}
                video={video}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-zinc-700 bg-[var(--surface)] px-6 py-16 text-center">
            <p className="text-xl font-black">הסרטונים יתווספו בקרוב.</p>
            <p className="mt-2 text-zinc-500">
              כאן יופיע המדריך המלא לשימוש בתבנית.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
