import { useEffect, useState, type RefObject } from "react";

export function useFullscreenToggle(targetRef: RefObject<HTMLElement>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === targetRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [targetRef]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await (targetRef.current ?? document.documentElement).requestFullscreen();
      return;
    }

    await document.exitFullscreen();
  };

  return { isFullscreen, toggleFullscreen };
}
