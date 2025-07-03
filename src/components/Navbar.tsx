import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/Button";
import { Brain, Menu, X, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Check authentication status
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('authToken');
      setIsAuthenticated(!!token);
    };

    checkAuthStatus();
    
    // Listen for storage changes to update auth status
    window.addEventListener('storage', checkAuthStatus);
    
    return () => {
      window.removeEventListener('storage', checkAuthStatus);
    };
  }, []);
  
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    // Clear authentication data from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('selectedQuestionPaperId');
    localStorage.removeItem('defaultEvaluationType');
    
    // Update authentication status
    setIsAuthenticated(false);
    
    // Show success message
    toast({
      title: "Logged out successfully",
      description: "You have been safely logged out of your account.",
    });
    
    // Redirect to home page
    navigate('/');
  };
  
  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/80 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="font-bold text-xl">Autograder AI</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-1">
            <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
              Home
            </Link>
            <Link to="/about" className={`nav-link ${isActive("/about") ? "active" : ""}`}>
              About
            </Link>
            <Link to="/pricing" className={`nav-link ${isActive("/pricing") ? "active" : ""}`}>
              Pricing
            </Link>
            <Link to="/contact" className={`nav-link ${isActive("/contact") ? "active" : ""}`}>
              Contact
            </Link>
          </nav>
          
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">
                  <Button variant="outline" className="h-9 px-4 rounded-lg transition-all duration-300 hover:scale-105">
                    Dashboard
                  </Button>
                </Link>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="h-9 px-4 rounded-lg transition-all duration-300 hover:scale-105 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" className="h-9 px-4 rounded-lg transition-all duration-300 hover:scale-105">
                    Log in
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 transition-all duration-300 hover:scale-105">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>
          
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-md animate-fade-in">
          <div className="px-4 py-4 space-y-1">
            <Link 
              to="/" 
              className={`block py-3 px-4 rounded-lg ${isActive("/") ? "bg-accent/10 text-accent font-medium" : ""}`}
            >
              Home
            </Link>
            <Link 
              to="/about" 
              className={`block py-3 px-4 rounded-lg ${isActive("/about") ? "bg-accent/10 text-accent font-medium" : ""}`}
            >
              About
            </Link>
            <Link 
              to="/pricing" 
              className={`block py-3 px-4 rounded-lg ${isActive("/pricing") ? "bg-accent/10 text-accent font-medium" : ""}`}
            >
              Pricing
            </Link>
            <Link 
              to="/contact" 
              className={`block py-3 px-4 rounded-lg ${isActive("/contact") ? "bg-accent/10 text-accent font-medium" : ""}`}
            >
              Contact
            </Link>
            
            <div className="pt-4">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <Link to="/dashboard" className="w-full">
                    <Button variant="outline" className="w-full">Dashboard</Button>
                  </Link>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/login" className="w-full">
                    <Button variant="outline" className="w-full">Log in</Button>
                  </Link>
                  <Link to="/signup" className="w-full">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">Sign up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
