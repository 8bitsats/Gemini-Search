import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  AnimatePresence,
  motion,
} from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

import { FollowUpInput } from '@/components/FollowUpInput';
import { Logo } from '@/components/Logo';
import { SearchInput } from '@/components/SearchInput';
import { SearchResults } from '@/components/SearchResults';
import { Button } from '@/components/ui/button';
import {
  useMutation,
  useQuery,
} from '@tanstack/react-query';

interface SearchResult {
  sessionId?: string;
  summary?: string;
  sources?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}

export function Search() {
  const [location, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentResults, setCurrentResults] = useState<SearchResult | null>(null);
  const [originalQuery, setOriginalQuery] = useState<string | null>(null);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [followUpQuery, setFollowUpQuery] = useState<string | null>(null);
  
  // Extract query from URL, handling both initial load and subsequent navigation
  const getParamsFromUrl = useCallback(() => {
    const searchParams = new URLSearchParams(window.location.search);
    return {
      query: searchParams.get('q') || '',
      mode: (searchParams.get('mode') as 'web' | 'blockchain') || 'web'
    };
  }, []);
  
  const [searchQuery, setSearchQuery] = useState(getParamsFromUrl().query);
  const [searchMode, setSearchMode] = useState<'web' | 'blockchain'>(getParamsFromUrl().mode);
  const [refetchCounter, setRefetchCounter] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['search', searchQuery, refetchCounter],
    queryFn: async () => {
      if (!searchQuery) return null;
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      const result = await response.json();
      console.log('Search API Response:', JSON.stringify(result, null, 2));
      if (result.sessionId) {
        setSessionId(result.sessionId);
        setCurrentResults(result);
        if (!originalQuery) {
          setOriginalQuery(searchQuery);
        }
        setIsFollowUp(false);
      }
      return result;
    },
    enabled: !!searchQuery,
  });

  // Follow-up mutation
  const followUpMutation = useMutation({
    mutationFn: async (followUpQuery: string) => {
      if (!sessionId) {
        const response = await fetch(`/api/search?q=${encodeURIComponent(followUpQuery)}`);
        if (!response.ok) throw new Error('Search failed');
        const result = await response.json();
        console.log('New Search API Response:', JSON.stringify(result, null, 2));
        if (result.sessionId) {
          setSessionId(result.sessionId);
          setOriginalQuery(searchQuery);
          setIsFollowUp(false);
        }
        return result;
      }

      const response = await fetch('/api/follow-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          query: followUpQuery,
        }),
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          const newResponse = await fetch(`/api/search?q=${encodeURIComponent(followUpQuery)}`);
          if (!newResponse.ok) throw new Error('Search failed');
          const result = await newResponse.json();
          console.log('Fallback Search API Response:', JSON.stringify(result, null, 2));
          if (result.sessionId) {
            setSessionId(result.sessionId);
            setOriginalQuery(searchQuery);
            setIsFollowUp(false);
          }
          return result;
        }
        throw new Error('Follow-up failed');
      }
      
      const result = await response.json();
      console.log('Follow-up API Response:', JSON.stringify(result, null, 2));
      return result;
    },
    onSuccess: (result) => {
      setCurrentResults(result);
      setIsFollowUp(true);
    },
  });

  const handleSearch = async (newQuery: string, newMode: 'web' | 'blockchain') => {
    setSearchMode(newMode);
    if (newMode === 'blockchain') {
      // Handle blockchain search
      try {
        const response = await fetch(`/api/solana/search?q=${encodeURIComponent(newQuery)}`);
        if (!response.ok) throw new Error('Blockchain search failed');
        const result = await response.json();
        setCurrentResults({
          summary: result.summary,
          sources: result.sources,
        });
        setIsFollowUp(false);
      } catch (error) {
        console.error('Blockchain search error:', error);
      }
    } else {
      // Handle web search
      if (newQuery === searchQuery) {
        // If it's the same query, increment the refetch counter to trigger a new search
        setRefetchCounter(c => c + 1);
      } else {
        setSessionId(null); // Clear session on new search
        setOriginalQuery(null); // Clear original query
        setIsFollowUp(false); // Reset follow-up state
        setSearchQuery(newQuery);
      }
    }
    // Update URL without triggering a page reload
    const newUrl = `/search?q=${encodeURIComponent(newQuery)}&mode=${newMode}`;
    window.history.pushState({}, '', newUrl);
  };

  const handleFollowUp = async (newFollowUpQuery: string) => {
    setFollowUpQuery(newFollowUpQuery);
    await followUpMutation.mutateAsync(newFollowUpQuery);
  };

  // Automatically start search when component mounts or URL changes
  useEffect(() => {
    const { query, mode } = getParamsFromUrl();
    if ((query && query !== searchQuery) || (mode && mode !== searchMode)) {
      setSessionId(null); // Clear session on URL change
      setOriginalQuery(null); // Clear original query
      setIsFollowUp(false); // Reset follow-up state
      setSearchQuery(query);
      setSearchMode(mode);
    }
  }, [searchQuery, searchMode, getParamsFromUrl]);

  // Use currentResults if available, otherwise fall back to data from useQuery
  const displayResults = currentResults || data;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-[#0A0A0A] relative"
    >
      <div 
        style={{ backgroundImage: "url(/media/gradient.png)" }}
        className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 bg-cover bg-center opacity-30"
      />

      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-6xl mx-auto p-4 relative z-10"
      >
        <div className="flex justify-center mb-8">
          <Logo className="w-48" />
        </div>
        
        <motion.div 
          className="flex items-center gap-4 mb-8"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/')}
            className="hidden sm:flex text-white hover:text-[#FF6B4A] hover:bg-[#1A1A1A]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="w-full">
            <SearchInput
              onSearch={handleSearch}
              initialValue={searchQuery}
              initialMode={searchMode}
              isLoading={isLoading}
              autoFocus={false}
              large={false}
              onClear={() => setLocation('/')}
            />
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={searchQuery}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-stretch"
          >
            <div className="bg-base-300/50 backdrop-blur-sm rounded-lg border border-[#2A2A2A] p-6">
              <SearchResults
                query={isFollowUp ? (followUpQuery || '') : searchQuery}
                results={displayResults}
                isLoading={isLoading || followUpMutation.isPending}
                error={error || followUpMutation.error || undefined}
                isFollowUp={isFollowUp}
                originalQuery={originalQuery || ''}
              />
            </div>

            {displayResults && !isLoading && !followUpMutation.isPending && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="mt-8 w-full backdrop-blur-sm"
              >
                <FollowUpInput
                  onSubmit={handleFollowUp}
                  isLoading={followUpMutation.isPending}
                />
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
