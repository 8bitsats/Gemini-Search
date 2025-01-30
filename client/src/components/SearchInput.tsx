import {
  KeyboardEvent,
  useState,
} from 'react';

import {
  Globe,
  Loader2,
  Search,
  Wallet,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  onSearch: (query: string, mode: 'web' | 'blockchain') => void;
  isLoading?: boolean;
  initialValue?: string;
  initialMode?: 'web' | 'blockchain';
  autoFocus?: boolean;
  large?: boolean;
  onClear?: () => void;
}

export function SearchInput({ 
  onSearch, 
  isLoading = false,
  initialValue = '',
  initialMode = 'web',
  autoFocus = false,
  large = false,
  onClear,
}: SearchInputProps) {
  const [query, setQuery] = useState(initialValue);
  const [searchMode, setSearchMode] = useState<'web' | 'blockchain'>(initialMode);

  const handleSubmit = () => {
    if (query.trim() && !isLoading) {
      onSearch(query.trim(), searchMode);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const toggleSearchMode = () => {
    setSearchMode(prev => prev === 'web' ? 'blockchain' : 'web');
  };

  return (
    <div className="relative flex w-full flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2",
            "text-[#FF6B4A]",
            large ? "h-5 w-5" : "h-4 w-4"
          )} />

          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={searchMode === 'web' 
              ? "Search across Google, Perplexity, Tavily..." 
              : "Search Solana blockchain (addresses, transactions, tokens...)"}
            className={cn(
              "pl-10 pr-10 transition-all duration-200",
              "bg-base-300/50 backdrop-blur-sm border-[#2A2A2A] text-white",
              "placeholder:text-gray-500",
              large && "h-14 text-lg rounded-lg",
              "focus-visible:ring-2 focus-visible:ring-[#FF6B4A]",
              "hover:bg-base-300/70"
            )}
            disabled={isLoading}
            autoFocus={autoFocus}
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                if (onClear) onClear();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X className={large ? "h-5 w-5" : "h-4 w-4"} />
            </button>
          )}
        </div>

        <Button
          onClick={toggleSearchMode}
          variant="ghost"
          className={cn(
            "min-w-[40px] px-2",
            "text-gray-400 hover:text-white",
            "border border-[#2A2A2A]",
            searchMode === 'blockchain' && "bg-[#2A2A2A]",
            large && "h-14"
          )}
        >
          {searchMode === 'web' ? (
            <Globe className={large ? "h-5 w-5" : "h-4 w-4"} />
          ) : (
            <Wallet className={large ? "h-5 w-5" : "h-4 w-4"} />
          )}
        </Button>

        <Button 
          onClick={handleSubmit}
          disabled={!query.trim() || isLoading}
          className={cn(
            "min-w-[80px] shadow-sm",
            "bg-[#FF6B4A] hover:bg-[#FF8266] text-white",
            "backdrop-blur-sm",
            large && "h-14 px-6 text-lg rounded-lg"
          )}
        >
          {isLoading ? (
            <Loader2 className={cn("animate-spin", large ? "h-5 w-5" : "h-4 w-4")} />
          ) : (
            'Search'
          )}
        </Button>
      </div>
      <div className="text-center text-sm text-gray-500">
        <span className="bg-gradient-to-br from-orange-700 to-yellow-400 bg-clip-text text-transparent font-bold">
          Cheshire Terminal
        </span>
        <span> - {searchMode === 'web' 
          ? 'Powered by Google, Perplexity, and Tavily' 
          : 'Powered by Solana Blockchain'}</span>
      </div>
    </div>
  );
}
