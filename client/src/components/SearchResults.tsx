import {
  useEffect,
  useRef,
} from 'react';

import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SourceList } from '@/components/SourceList';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SearchResult {
  sessionId?: string;
  summary?: string;
  sources?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}

interface SearchResultsProps {
  query: string;
  results: SearchResult | null;
  isLoading: boolean;
  error?: Error;
  isFollowUp?: boolean;
  originalQuery?: string;
}

export function SearchResults({ 
  query,
  results,
  isLoading,
  error,
  isFollowUp,
  originalQuery
}: SearchResultsProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (results && contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [results]);

  if (error) {
    return (
      <Alert variant="destructive" className="animate-in fade-in-50 bg-[#2A1A1A] border-[#FFA589] text-white">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error.message || 'An error occurred while searching. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center py-12"
      >
        <LoadingSpinner className="mb-4" />
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-white text-sm"
        >
          Searching...
        </motion.p>
      </motion.div>
    );
  }

  if (!results) return null;

  return (
    <div ref={contentRef} className="space-y-6 animate-in fade-in-50">
      {/* Search Query Display */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        {isFollowUp && originalQuery && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 text-xs sm:text-sm text-gray-200">
              <span>Original search:</span>
              <span className="font-medium">"{originalQuery}"</span>
            </div>
            <div className="h-px bg-[#2A2A2A] w-full" />
          </>
        )}
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 text-sm sm:text-base text-white">
          <span>{isFollowUp ? 'Follow-up question:' : ''}</span>
          <h1 className="font-serif text-lg sm:text-3xl text-white">"{query}"</h1>
        </div>
      </motion.div>

      {/* Sources Section */}
      {results.sources && results.sources.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: 0.2,
            type: "spring",
            stiffness: 100,
            damping: 15
          }}
        >
          <SourceList sources={results.sources} />
        </motion.div>
      )}

      {/* Main Content */}
      <Card className="overflow-hidden shadow-md bg-[#1A1A1A] border-[#2A2A2A]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: 0.3,
            type: "spring",
            stiffness: 100,
            damping: 15
          }}
          className="py-4 px-8"
        >
          <div
            className={cn(
              "prose max-w-none text-white",
              "prose-headings:text-white prose-headings:font-bold prose-headings:mb-4",
              "prose-h2:text-2xl prose-h2:mt-8 prose-h2:border-b prose-h2:pb-2 prose-h2:border-[#2A2A2A]",
              "prose-h3:text-xl prose-h3:mt-6",
              "prose-p:text-white prose-p:leading-7 prose-p:my-4",
              "prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6",
              "prose-li:my-2 prose-li:text-white prose-li:marker:text-[#FFA589]",
              "prose-strong:font-semibold prose-strong:text-[#FFA589]",
              "prose-a:text-[#FFA589] prose-a:no-underline hover:prose-a:text-[#FFB89E]",
            )}
            dangerouslySetInnerHTML={{ 
              __html: results.summary || ''
            }}
          />
        </motion.div>
      </Card>
    </div>
  );
}
