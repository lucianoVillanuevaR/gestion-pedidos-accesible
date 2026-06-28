import { useCallback, useEffect, useRef, useState } from "react";
import type { FeedbackState } from "../PdvShared";

export function usePdvFeedback() {
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const feedbackRef = useRef<HTMLDivElement | null>(null);

  const showFeedback = useCallback((nextFeedback: FeedbackState) => {
    setFeedback(nextFeedback);
  }, []);

  useEffect(() => {
    if (feedback && feedbackRef.current) {
      feedbackRef.current.focus();
    }
  }, [feedback]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFeedback((currentFeedback) => (currentFeedback === feedback ? null : currentFeedback));
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  return {
    feedback,
    feedbackRef,
    setFeedback,
    showFeedback
  };
}
