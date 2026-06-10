import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Github, Chrome, Smartphone } from 'lucide-react';

function FloatingShape({ size, top, left, delay, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 0.15, scale: 1 }}
      transition={{ delay, duration: 1.2 }}
      className="absolute rounded-2xl animate-float"
      style={{
        width: size,
        height: size,
        top,
        left,
        background: color,
        animationDelay: `${delay}s`,
        filter: 'blur(1px)',
        transform: `rotate(${Math.random() * 45}deg)`,
      }}
    />
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const isDisabled = !email.trim() || !password.trim();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen flex"
      style={{ background: 'var(--color-surface)' }}
    >
      {/* Left decorative panel - hidden on mobile */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden flex-col items-center justify-center p-12"
        style={{
          background: 'linear-gradient(135deg, #0b1628 0%, #0c2d48 40%, #064e5e 100%)',
        }}
      >
        {/* Floating shapes */}
        <FloatingShape size={80} top="15%" left="10%" delay={0.2} color="rgba(56,189,248,0.3)" />
        <FloatingShape size={120} top="60%" left="70%" delay={0.4} color="rgba(6,182,212,0.25)" />
        <FloatingShape size={60} top="75%" left="15%" delay={0.6} color="rgba(14,165,233,0.2)" />
        <FloatingShape size={90} top="25%" left="65%" delay={0.3} color="rgba(56,189,248,0.2)" />
        <FloatingShape size={50} top="45%" left="35%" delay={0.5} color="rgba(6,182,212,0.3)" />
        <FloatingShape size={70} top="10%" left="80%" delay={0.7} color="rgba(14,165,233,0.15)" />

        {/* Radial glow */}
        <div
          className="absolute"
          style={{
            width: 500,
            height: 500,
            background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Branding content */}
        <div className="relative z-10 text-center max-w-md">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 14 }}
            className="w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
              boxShadow: '0 0 50px rgba(14,165,233,0.4)',
            }}
          >
            <span className="text-white font-extrabold text-3xl">EN</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-4xl font-extrabold text-white mb-4 tracking-tight"
          >
            E-NOSE
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-cyan-200/60 text-sm leading-relaxed"
          >
            AI-powered drone-based environmental monitoring system.
            Real-time gas detection, environmental analysis, and predictive intelligence.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 flex items-center justify-center gap-6 text-cyan-300/40 text-xs"
          >
            <span>● Real-time Sensing</span>
            <span>● AI Predictions</span>
            <span>● Drone Control</span>
          </motion.div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
                boxShadow: '0 0 30px rgba(14,165,233,0.25)',
              }}
            >
              <span className="text-white font-extrabold text-xl">EN</span>
            </div>
            <h1 className="text-2xl font-extrabold gradient-text">E-NOSE</h1>
          </div>

          {/* Glass card form */}
          <div className="glass p-8 sm:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
                Welcome back
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Sign in to your monitoring dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email field */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@enose.io"
                    className="input-field pl-11"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pl-11 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500 accent-sky-500"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  className="text-xs text-sky-500 hover:text-sky-600 font-semibold transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Login button */}
              <motion.button
                type="submit"
                disabled={isDisabled}
                whileHover={!isDisabled ? { scale: 1.02 } : {}}
                whileTap={!isDisabled ? { scale: 0.98 } : {}}
                className="btn-primary w-full text-center"
                style={{
                  opacity: isDisabled ? 0.5 : 1,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                }}
              >
                Sign In to Dashboard
              </motion.button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400 font-medium">or continue with</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* Social login buttons */}
            <div className="flex gap-3">
              {[
                { icon: Chrome, label: 'Google' },
                { icon: Github, label: 'GitHub' },
                { icon: Smartphone, label: 'SSO' },
              ].map(({ icon: Icon, label }) => (
                <motion.button
                  key={label}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <Icon size={16} className="text-slate-500 dark:text-slate-400" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-400 mt-6">
            E-NOSE Environmental Intelligence Platform © 2026
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
