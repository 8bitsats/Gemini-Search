import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative">
        <img
          src="/chesh.png"
          alt="Cheshire Terminal Logo"
          className="w-32 h-32 object-contain"
          style={{
            filter: "drop-shadow(0 0 20px rgba(255, 107, 74, 0.5))"
          }}
        />
        <div className="absolute inset-0 bg-[#FF6B4A] opacity-20 blur-xl rounded-full" />
      </div>
      <div className="flex flex-col items-center">
        <h1 className="text-3xl font-bold text-white tracking-wider">CHESHIRE</h1>
        <span className="text-sm text-[#FF6B4A] tracking-widest">TERMINAL BETA</span>
      </div>
    </div>
  );
}
