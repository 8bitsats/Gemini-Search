import { AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import {
  Link,
  Route,
  Switch,
  useLocation,
} from 'wouter';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Home } from '@/pages/Home';
import { Search } from '@/pages/Search';

function App() {
  const [location] = useLocation();

  return (
    <>
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex space-x-4">
              <Link href="/" className="text-gray-700 hover:text-gray-900 transition-colors">
                Home
              </Link>
              <Link href="/search" className="text-gray-700 hover:text-gray-900 transition-colors">
                Search
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        <Switch location={location} key={location}>
          <Route path="/" component={Home} />
          <Route path="/search" component={Search} />
          <Route component={NotFound} />
        </Switch>
      </AnimatePresence>
    </>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-muted-foreground">
            The page you're looking for doesn't exist.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
