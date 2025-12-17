// 修改后
import { useEffect, useRef } from "react";

interface UseAnimationFrameOptions {
  animate: () => void;
  fps?: number;
}

const useAnimationFrame = ({ animate, fps = 60 }: UseAnimationFrameOptions) => {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const animateRef = useRef<() => void>();

  // 将 animate 函数存储在 ref 中，避免闭包问题
  animateRef.current = animate;

  useEffect(() => {
    const animateFrame = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        const frameDuration = 1000 / fps;

        if (deltaTime >= frameDuration) {
          animateRef.current?.();
          previousTimeRef.current = time;
        }
      } else {
        previousTimeRef.current = time;
      }

      requestRef.current = requestAnimationFrame(animateFrame);
    };

    requestRef.current = requestAnimationFrame(animateFrame);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [fps]);

  return { requestRef, previousTimeRef };
};

export default useAnimationFrame;
