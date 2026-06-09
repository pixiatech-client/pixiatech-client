"use client";

import { CSSProperties, ReactElement, useEffect, useState } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface Sparkle {
  id: string;
  x: string;
  y: string;
  color: string;
  delay: number;
  scale: number;
  lifespan: number;
}

interface SparklesTextProps {
  as?: ReactElement;
  className?: string;
  text: string;
  sparklesCount?: number;
  colors?: {
    first: string;
    second: string;
  };
  style?: CSSProperties;
}

const DEFAULT_COLORS = {
  first: "#6366f1",
  second: "#c084fc",
};

const generateSparkle = (color: string): Sparkle => ({
  id: `${Date.now()}-${Math.random()}`,
  x: `${Math.random() * 100}%`,
  y: `${Math.random() * 100}%`,
  color,
  delay: Math.random() * 2,
  scale: Math.random() * 0.5 + 0.5,
  lifespan: Math.random() * 2 + 1,
});

export function SparklesText({
  text,
  sparklesCount = 3,
  colors = DEFAULT_COLORS,
  className,
  style,
}: SparklesTextProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    const generateSparkles = () => {
      const newSparkles = Array.from({ length: sparklesCount }, () =>
        Math.random() > 0.5
          ? generateSparkle(colors.first)
          : generateSparkle(colors.second)
      );
      setSparkles(newSparkles);
    };

    generateSparkles();
    const interval = setInterval(generateSparkles, 3000);

    return () => clearInterval(interval);
  }, [sparklesCount, colors]);

  return (
    <span
      className={cn("relative inline-block", className)}
      style={style}
    >
      {sparkles.map((sparkle) => (
        <motion.span
          key={sparkle.id}
          className="absolute pointer-events-none z-10"
          style={{
            left: sparkle.x,
            top: sparkle.y,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, sparkle.scale, 0],
          }}
          transition={{
            duration: sparkle.lifespan,
            delay: sparkle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7 0C7 0 7.5 4 10 6.5C12.5 9 14 9.5 14 9.5C14 9.5 10 10 7.5 12.5C5 15 7 14 7 14C7 14 6.5 10 4 7.5C1.5 5 0 4.5 0 4.5C0 4.5 4 4 6.5 1.5C9 -1 7 0 7 0Z"
              fill={sparkle.color}
            />
          </svg>
        </motion.span>
      ))}
      <span className="relative z-0">{text}</span>
    </span>
  );
}
