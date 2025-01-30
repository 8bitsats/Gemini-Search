import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  className?: string;
}

export const LoadingSpinner = ({ className = '' }: LoadingSpinnerProps) => {
  return (
    <div className={`flex justify-center ${className}`}>
      <motion.div
        className="w-8 h-8 border-4 border-t-[#FF6B4A] border-r-transparent border-b-[#FF6B4A] border-l-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
};
