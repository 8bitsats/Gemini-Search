import {
  KeyboardEvent,
  useState,
} from 'react';

import {
  Loader2,
  MessageSquarePlus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FollowUpInputProps {
  onSubmit: (query: string) => void;
  isLoading?: boolean;
}

export function FollowUpInput({ 
  onSubmit,
  isLoading = false,
}: FollowUpInputProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = () => {
    if (query.trim() && !isLoading) {
      onSubmit(query.trim());
      setQuery('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      <div className="flex-1">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a follow-up question..."
          className={cn(
            "transition-all duration-200",
            "bg-base-300/50 backdrop-blur-sm border-[#2A2A2A] text-white",
            "placeholder:text-gray-500",
            "focus-visible:ring-2 focus-visible:ring-[#FF6B4A] focus-visible:border-[#FF6B4A]",
            "hover:bg-base-300/70",
            "w-full"
          )}
          disabled={isLoading}
        />
      </div>

      <Button 
        onClick={handleSubmit}
        disabled={!query.trim() || isLoading}
          className={cn(
            "flex items-center justify-center gap-2 w-full sm:w-auto",
            "bg-[#FF6B4A] hover:bg-[#FF8266] text-white",
            "border-none backdrop-blur-sm"
          )}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <MessageSquarePlus className="h-4 w-4" />
            Ask
          </>
        )}
      </Button>
    </div>
  );
}
