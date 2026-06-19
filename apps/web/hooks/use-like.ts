"use client";

import { useCallback, useState } from "react";

interface UseLikeOptions {
  initialLiked?: boolean;
  initialLikeCount: number;
}

export function useLike({
  initialLiked = false,
  initialLikeCount,
}: UseLikeOptions) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);

  const toggleLike = useCallback(() => {
    setIsLiked((current) => {
      const nextLiked = !current;

      setLikeCount((count) => {
        if (nextLiked) {
          return count + 1;
        }

        return Math.max(0, count);
      });

      return nextLiked;
    });
  }, []);

  return {
    isLiked,
    likeCount,
    toggleLike,
  };
}
