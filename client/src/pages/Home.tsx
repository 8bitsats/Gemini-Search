import { Search } from 'lucide-react';
import { useLocation } from 'wouter';

import { Logo } from '@/components/Logo';
import { SearchInput } from '@/components/SearchInput';

export function Home() {
  const [, setLocation] = useLocation();

  const handleSearch = (query: string, mode: 'web' | 'blockchain') => {
    if (query.trim()) {
      setLocation(`/search?q=${encodeURIComponent(query.trim())}&mode=${mode}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] relative">
      <div 
        style={{ backgroundImage: "url(/media/gradient.png)" }}
        className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 bg-cover bg-center opacity-50"
      />

      <div className="w-full max-w-3xl px-4 animate-fade-in relative z-10">
        <div className="flex flex-col items-center mb-12">
          <Logo className="mb-8" />
          <div className="bg-gradient-to-br from-orange-700 to-yellow-400 bg-clip-text">
            <h1 className="text-6xl font-bold text-transparent">
              Explore
            </h1>
          </div>
        </div>
        
        <div className="w-full backdrop-blur-sm">
          <SearchInput onSearch={handleSearch} large autoFocus />
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#2A2A2A] mb-5">
              <Search className="h-6 w-6 text-[#FF6B4A]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Multi-Source Search</h2>
            <p className="text-gray-400">Search across Google, Perplexity, and Tavily for comprehensive results.</p>
          </div>

          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#2A2A2A] mb-5">
              <span className="text-[#FF6B4A] font-bold">.sol</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Solana Explorer</h2>
            <p className="text-gray-400">Look up any account, token, transaction, or .sol domain on the Solana blockchain.</p>
          </div>

          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#2A2A2A] mb-5">
              <span className="text-[#FF6B4A] text-xl">AI</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">AI-Powered</h2>
            <p className="text-gray-400">Get intelligent answers and insights powered by advanced language models.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
