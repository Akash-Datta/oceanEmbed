import React, { useEffect, useRef } from "react";

const ParticlesBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        let particles = [];
        let animationId;

        const particleCount = 65;

        class Particle {
            constructor() {
                this.reset();
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
            }

            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;

                this.radius = Math.random() * 1.8 + 0.6;

                this.speedX = (Math.random() - 0.5) * 0.35;
                this.speedY = (Math.random() - 0.5) * 0.35;

                this.opacity = Math.random() * 0.5 + 0.25;

                this.twinkleSpeed = Math.random() * 0.02 + 0.005;
                this.twinkleDirection = Math.random() > 0.5 ? 1 : -1;
            }

            draw() {
                ctx.beginPath();

                ctx.arc(
                    this.x,
                    this.y,
                    this.radius,
                    0,
                    Math.PI * 2
                );

                const alpha = Math.max(
                    0.15,
                    Math.min(0.9, this.opacity)
                );

                ctx.fillStyle = `rgba(125, 211, 252, ${alpha})`;

                ctx.shadowBlur = 8;
                ctx.shadowColor = `rgba(56, 189, 248, ${alpha})`;

                ctx.fill();

                ctx.shadowBlur = 0;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                /*
                 * Subtle twinkling effect
                 */
                this.opacity +=
                    this.twinkleSpeed * this.twinkleDirection;

                if (this.opacity >= 0.8) {
                    this.opacity = 0.8;
                    this.twinkleDirection = -1;
                }

                if (this.opacity <= 0.2) {
                    this.opacity = 0.2;
                    this.twinkleDirection = 1;
                }

                /*
                 * Wrap around screen
                 */
                if (this.x < -5) {
                    this.x = canvas.width + 5;
                }

                if (this.x > canvas.width + 5) {
                    this.x = -5;
                }

                if (this.y < -5) {
                    this.y = canvas.height + 5;
                }

                if (this.y > canvas.height + 5) {
                    this.y = -5;
                }

                this.draw();
            }
        }

        const createParticles = () => {
            particles = [];

            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        };

        const resizeCanvas = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);

            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;

            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            createParticles();
        };

        resizeCanvas();

        window.addEventListener("resize", resizeCanvas);

        const animate = () => {
            ctx.clearRect(
                0,
                0,
                window.innerWidth,
                window.innerHeight
            );

            particles.forEach((particle) => {
                particle.update();
            });

            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener("resize", resizeCanvas);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="particles-background"
            aria-hidden="true"
        />
    );
};

export default ParticlesBackground;