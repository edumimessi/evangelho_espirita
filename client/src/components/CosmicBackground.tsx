import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

export function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let stars: Star[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    const initStars = () => {
      const count = Math.floor((canvas.width * canvas.height) / 4000);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.8 + 0.2,
        opacity: Math.random() * 0.7 + 0.1,
        speed: Math.random() * 0.02 + 0.005,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
      }));
    };

    let time = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.016;

      for (const star of stars) {
        star.twinklePhase += star.twinkleSpeed;
        const twinkle = 0.5 + 0.5 * Math.sin(star.twinklePhase);
        const opacity = star.opacity * (0.4 + 0.6 * twinkle);

        // Star color: mostly white/blue-white, some warm
        const hue = Math.random() > 0.9 ? "255, 220, 180" : "200, 220, 255";

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${hue}, ${opacity})`;
        ctx.fill();

        // Glow for larger stars
        if (star.size > 1.2) {
          const gradient = ctx.createRadialGradient(
            star.x, star.y, 0,
            star.x, star.y, star.size * 4
          );
          gradient.addColorStop(0, `rgba(180, 220, 255, ${opacity * 0.4})`);
          gradient.addColorStop(1, "rgba(180, 220, 255, 0)");
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 4, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      }

      // Nebula wisps
      drawNebula(ctx, canvas.width * 0.2, canvas.height * 0.15, 200, 120, "rgba(80, 40, 140, 0.04)", time * 0.1);
      drawNebula(ctx, canvas.width * 0.75, canvas.height * 0.7, 180, 100, "rgba(20, 80, 160, 0.04)", time * 0.08);
      drawNebula(ctx, canvas.width * 0.5, canvas.height * 0.4, 150, 80, "rgba(60, 20, 120, 0.03)", time * 0.12);

      animationId = requestAnimationFrame(draw);
    };

    const drawNebula = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      rx: number,
      ry: number,
      color: string,
      phase: number
    ) => {
      const offsetX = Math.sin(phase) * 10;
      const offsetY = Math.cos(phase * 0.7) * 8;

      const gradient = ctx.createRadialGradient(
        x + offsetX, y + offsetY, 0,
        x + offsetX, y + offsetY, Math.max(rx, ry)
      );
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, "rgba(0,0,0,0)");

      ctx.save();
      ctx.translate(x + offsetX, y + offsetY);
      ctx.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry));
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(rx, ry), 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();
    };

    resize();
    draw();

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <>
      <div className="cosmic-bg" />
      <canvas ref={canvasRef} id="stars-canvas" />
    </>
  );
}
