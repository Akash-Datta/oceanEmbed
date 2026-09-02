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
                // Randomly scatter initial positions across the whole screen height
                this.y = Math.random() * canvas.height;
            }

            reset() {
                this.x = Math.random() * canvas.width;
                this.y = canvas.height + 20; // Start just below the screen
                this.radius = Math.random() * 2.2 + 0.6; // Varied bubble/plankton sizes
                
                // Buoyancy: move upward consistently with a slight drift
                this.speedY = -(Math.random() * 0.5 + 0.15); 
                this.speedX = (Math.random() - 0.5) * 0.25;

                // Sine wave parameters for organic underwater swaying current
                this.wobble = Math.random() * Math.PI * 2;
                this.wobbleSpeed = Math.random() * 0.02 + 0.008;

                this.opacity = Math.random() * 0.4 + 0.1;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

                // Aquatic cyan/teal soft glow
                ctx.fillStyle = `rgba(148, 221, 248, ${this.opacity})`;
                ctx.shadowBlur = 12;
                ctx.shadowColor = `rgba(34, 211, 238, 0.4)`;
                
                ctx.fill();
                ctx.shadowBlur = 0; // Reset shadow for performance
            }

            update() {
                // Apply current swaying and upward buoyancy
                this.wobble += this.wobbleSpeed;
                this.x += this.speedX + Math.sin(this.wobble) * 0.3;
                this.y += this.speedY;

                // Organic shimmer/pulsing effect
                this.opacity += Math.sin(this.wobble) * 0.003;
                this.opacity = Math.max(0.05, Math.min(0.55, this.opacity));

                // Recycle particle to the bottom when it floats past the top
                if (this.y < -10) {
                    this.reset();
                }

                // Wrap around horizontally if it drifts off the screen sides
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
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

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