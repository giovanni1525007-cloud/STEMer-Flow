import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  delay?: number;
}

export function Card({ children, className = '', hover = false, onClick, delay = 0 }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, type: 'spring', stiffness: 100 }}
      whileHover={hover ? { y: -4, transition: { type: 'spring', stiffness: 300 } } : undefined}
      onClick={onClick}
      className={`bg-surface border border-border rounded-2xl ${hover ? 'hover:shadow-lg hover:border-brand-blue/30 transition-all cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
}
