
import { useEffect, useRef } from 'react';

export default function MatrixRain() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId;
    let lastTime = 0;
    let columns = [];
    const fontSize = 14;
    const spacing = 32;
    const characters = '0123456789ABCDEF';

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      columns = Array.from(
        { length: Math.ceil(canvas.width / spacing) },
        () => Math.random() * -canvas.height / fontSize
      );
    };

    const draw = (time) => {
      if (time - lastTime >= 90) {
        ctx.fillStyle = 'rgba(11, 16, 13, 0.16)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = `${fontSize}px monospace`;
        ctx.fillStyle = '#4ade80';

        columns.forEach((position, index) => {
          if (Math.random() < 0.35) {
            const char = characters[
              Math.floor(Math.random() * characters.length)
            ];

            ctx.fillText(
              char,
              index * spacing,
              position * fontSize
            );
          }

          columns[index] += 0.25;

          if (columns[index] * fontSize > canvas.height) {
            columns[index] = -Math.random() * 30;
          }
        });

        lastTime = time;
      }

      frameId = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    frameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="matrix-rain"
      aria-hidden="true"
    />
  );
}
