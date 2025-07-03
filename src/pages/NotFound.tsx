
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="text-center animate-fade-in">
        <Link to="/" className="inline-flex items-center mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-accent mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
            <line x1="16" y1="8" x2="2" y2="22"></line>
            <line x1="17.5" y1="15" x2="9" y2="15"></line>
          </svg>
                        <span className="text-2xl font-bold">Autograder AI</span>
        </Link>
        
        <div className="relative mb-8">
          <div className="text-9xl font-bold text-accent/10">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl font-bold">Page Not Found</div>
          </div>
        </div>
        
        <p className="text-xl text-muted-foreground mb-8 max-w-md mx-auto">
          We couldn't find the page you're looking for. It might have been moved or deleted.
        </p>
        
        <Link to="/">
          <button className="bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded inline-flex items-center text-sm font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
