import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// CSS-only floating particles
function Particles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 6 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 6 + 4,
    delay: Math.random() * 3,
    opacity: Math.random() * 0.5 + 0.1,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: `rgba(${p.id % 2 === 0 ? '56, 189, 248' : '6, 182, 212'}, ${p.opacity})`,
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
            boxShadow: `0 0 ${p.size * 2}px rgba(56, 189, 248, ${p.opacity * 0.5})`,
          }}
        />
      ))}
    </div>
  );
}

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0b1628 0%, #0c2d48 30%, #0a3d5c 50%, #064e5e 70%, #0d4d4d 100%)',
      }}
    >
      {/* Floating particles background */}
      <Particles />

      {/* Radial glow behind logo */}
      <div
        className="absolute"
        style={{
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -60%)',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Logo circle with EN text */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
            duration: 0.8,
          }}
          className="relative"
        >
          <div
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #0ea5e9, #06b6d4, #0284c7)',
              boxShadow: '0 0 60px rgba(14,165,233,0.4), 0 0 120px rgba(6,182,212,0.2)',
            }}
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-white font-extrabold text-4xl sm:text-5xl tracking-tight"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
            >
              EN
            </motion.span>
          </div>

          {/* Orbiting ring */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="absolute inset-[-12px] rounded-full animate-spin-slow"
            style={{
              border: '2px solid transparent',
              borderTopColor: 'rgba(56,189,248,0.4)',
              borderRightColor: 'rgba(6,182,212,0.2)',
            }}
          />
        </motion.div>

        {/* E-NOSE title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-5xl sm:text-6xl font-extrabold tracking-tight gradient-text"
        >
          E-NOSE
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="text-sm sm:text-base text-cyan-200/70 text-center max-w-sm px-4 font-medium tracking-wide"
        >
          AI Drone-Based Environmental Monitoring System
        </motion.p>
      </div>

      {/* Loading bar at bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        className="absolute bottom-16 sm:bottom-20 w-56 sm:w-64"
      >
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: 'rgba(56,189,248,0.15)' }}
        >
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ delay: 1.3, duration: 2.2, ease: 'easeInOut' }}
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #0ea5e9, #06b6d4, #38bdf8)',
              boxShadow: '0 0 12px rgba(14,165,233,0.5)',
            }}
          />
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.4 }}
          className="text-xs text-cyan-300/50 text-center mt-3 font-medium tracking-wider uppercase"
        >
          Initializing systems...
        </motion.p>
      </motion.div>

      {/* Bottom version text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-6 text-[10px] text-cyan-300/40 tracking-widest uppercase"
      >
        v2.0 — Environmental Intelligence Platform
      </motion.p>
    </motion.div>
  );
}
