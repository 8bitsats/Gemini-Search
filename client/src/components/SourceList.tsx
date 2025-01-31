import { motion } from 'framer-motion';
import {
  ExternalLink,
  Link2,
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import {
  ScrollArea,
  ScrollBar,
} from '@/components/ui/scroll-area';

interface Source {
  title: string;
  url: string;
  snippet: string;
}

interface SourceListProps {
  sources: Source[];
}

export function SourceList({ sources }: SourceListProps) {
  return (
    <div className="space-y-4 animate-in fade-in-50 w-full overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <Link2 className="h-4 w-4 text-[#FFA589]" />
        <h2 className="text-base font-semibold text-white">Sources</h2>
      </div>

      <ScrollArea className="w-full whitespace-nowrap rounded-md touch-pan-x overflow-visible">
        <motion.div 
          className="flex space-x-3 pb-4 px-0.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ 
            duration: 0.4, 
            staggerChildren: 0.1,
            type: "spring",
            stiffness: 100,
            damping: 15
          }}
        >
          {sources.map((source, index) => (
            <motion.div
              key={source.url}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                duration: 0.3, 
                delay: index * 0.1,
                type: "spring",
                stiffness: 100,
                damping: 15
              }}
              className="shrink-0"
            >
              <Card 
                className="w-[260px] sm:w-[300px] md:w-[340px] group overflow-hidden transition-all hover:shadow-md cursor-pointer bg-[#1A1A1A] hover:bg-[#2A2A2A] border-[#2A2A2A] transform hover:scale-[1.02] transition-transform duration-200 flex-shrink-0"
                onClick={() => window.open(source.url, '_blank')}
              >
                <div className="p-3 sm:p-4 hover:bg-[#2A2A2A] h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 flex flex-col h-full">
                      <h3 className="font-medium text-sm sm:text-base text-white line-clamp-1 mb-1">
                        {source.title.replace(/\*\*/g, '')}
                      </h3>

                      {source.snippet && (
                        <p className="text-xs sm:text-sm text-gray-200 line-clamp-2 mb-2">
                          {source.snippet.replace(/\*\*/g, '')}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300 mt-auto">
                        <span className="truncate max-w-[140px] sm:max-w-[180px] md:max-w-[220px]">
                          {new URL(source.url).hostname.replace('www.', '')}
                        </span>
                      </div>
                    </div>

                    <ExternalLink className="h-4 w-4 flex-shrink-0 text-[#FFA589] 
                      opacity-70 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
