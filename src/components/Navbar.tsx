
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/Button";
import { Brain, Menu, X } from "lucide-react";

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  
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
  
  const isActive = (path: string) => location.pathname === path;
  
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
              <Brain className="h-8 w-8 text-accent" />
              <span className="font-bold text-xl">EduAI</span>
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
            <Link to="/login">
              <Button variant="outline" className="h-9 px-4 rounded-lg transition-all duration-300 hover:scale-105">
                Log in
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="h-9 px-4 rounded-lg bg-accent hover:bg-accent/90 transition-all duration-300 hover:scale-105">
                Sign up
              </Button>
            </Link>
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
            <div className="pt-4 grid grid-cols-2 gap-3">
              <Link to="/login" className="w-full">
                <Button variant="outline" className="w-full">Log in</Button>
              </Link>
              <Link to="/signup" className="w-full">
                <Button className="w-full bg-accent hover:bg-accent/90">Sign up</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
