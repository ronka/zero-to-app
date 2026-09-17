export type YouTubeUrl =
  | `https://www.youtube.com/watch?v=${string}`
  | `https://youtu.be/${string}`;

export type UsefulLink = {
  label: string;
  href: string;
};

export type TutorialVideo = {
  // Stable completion key; keep it unchanged when the title or video changes.
  id: string;
  title: string;
  description: string;
  // Leave unset until the video is uploaded to show a "coming soon" placeholder.
  videoUrl?: YouTubeUrl;
  links?: readonly UsefulLink[];
};

type YouTubeEmbedUrl = `https://www.youtube-nocookie.com/embed/${string}`;

const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function getYouTubeEmbedUrl(
  videoUrl: YouTubeUrl,
): YouTubeEmbedUrl | null {
  try {
    const url = new URL(videoUrl);
    const videoId =
      url.hostname === "youtu.be"
        ? url.pathname.split("/").filter(Boolean)[0]
        : url.hostname === "www.youtube.com" && url.pathname === "/watch"
          ? url.searchParams.get("v")
          : null;

    if (!videoId || !YOUTUBE_VIDEO_ID.test(videoId)) return null;

    return `https://www.youtube-nocookie.com/embed/${videoId}`;
  } catch {
    return null;
  }
}
