import React, { useEffect, useRef } from "react";

const ParticlesBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        let particles = [];
        let animationId;
        const particleCount = 50;

        class Particle {
            constructor() {
                this.reset();
                this.y = Math.random() * canvas.height;
            }

            reset() {
                this.x = Math.random() * canvas.width;
                this.y = canvas.height + 20; 
                this.radius = Math.random() * 2.2 + 0.6; 
                
                this.speedY = -(Math.random() * 0.5 + 0.15); 
                this.speedX = (Math.random() - 0.5) * 0.25;

                this.wobble = Math.random() * Math.PI * 2;
                this.wobbleSpeed = Math.random() * 0.02 + 0.008;

                this.opacity = Math.random() * 0.4 + 0.1;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

                // 🔴 CHANGED: Swapped light cyan for a deeper, richer ocean blue
                ctx.fillStyle = `rgba(56, 120, 240, ${this.opacity})`;
                
                // 🔴 CHANGED: Increased the shadow blur slightly and made the shadow a dark indigo
                ctx.shadowBlur = 15;
                ctx.shadowColor = `rgba(30, 64, 175, 0.6)`;
                
                ctx.fill();
                ctx.shadowBlur = 0; 
            }

            update() {
                this.wobble += this.wobbleSpeed;
                this.x += this.speedX + Math.sin(this.wobble) * 0.3;
                this.y += this.speedY;

                this.opacity += Math.sin(this.wobble) * 0.003;
                this.opacity = Math.max(0.05, Math.min(0.55, this.opacity));

                if (this.y < -10) {
                    this.reset();
                }

                if (this.x < -10) this.x = canvas.width + 10;
                if (this.x > canvas.width + 10) this.x = -10;

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
            // 🔴 CHANGED: Instead of clearing the canvas to be transparent, 
            // we now paint a deep, dark abyss-blue background on every frame.
            ctx.fillStyle = "#020617"; 
            ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

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