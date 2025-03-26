
import { Link } from "react-router-dom";
import { Button } from "@/components/Button";
import { ArrowRight, BrainCircuit, BookOpen, GraduationCap, Users, LineChart, Shield } from "lucide-react";

const Home = () => {
  return (
    <div className="page-transition">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-accent/10 z-0"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 right-0 w-96 h-96 bg-accent/10 rounded-full filter blur-3xl opacity-50 animate-pulse-slow"></div>
          <div className="absolute bottom-20 left-0 w-96 h-96 bg-accent/10 rounded-full filter blur-3xl opacity-50 animate-pulse-slow" style={{ animationDelay: "2s" }}></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="py-20 md:py-28 lg:py-32 flex flex-col items-center text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-accent/30 bg-accent/5 text-accent/80 text-sm font-medium mb-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              Introducing the future of AI-powered learning
            </div>
            
            <h1 className="hero-title animate-fade-in" style={{ animationDelay: "0.4s" }}>
              Transform Education with <span className="gradient-text">Artificial Intelligence</span>
            </h1>
            
            <p className="hero-subtitle animate-fade-in" style={{ animationDelay: "0.6s" }}>
              Our intelligent learning platform uses advanced AI to personalize education, 
              track progress, and provide insights for better learning outcomes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-8 animate-fade-in" style={{ animationDelay: "0.8s" }}>
              <Link to="/signup">
                <Button size="lg" className="bg-accent hover:bg-accent/90 rounded-lg text-white px-8 transition-all duration-300 hover:scale-105">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" size="lg" className="rounded-lg px-8 transition-all duration-300 hover:scale-105">
                  Learn More
                </Button>
              </Link>
            </div>
            
            <div className="mt-16 md:mt-24 relative animate-fade-in" style={{ animationDelay: "1s" }}>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/30 to-blue-500/30 rounded-2xl blur opacity-30"></div>
              <div className="relative bg-background/80 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl overflow-hidden">
                <img 
                  src="https://placehold.co/1200x600/2563eb/FFFFFF/png?text=EduAI+Dashboard+Preview&font=montserrat" 
                  alt="EduAI platform dashboard preview" 
                  className="w-full max-w-5xl rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title animate-slide-in-up">Powerful Features for Modern Learning</h2>
            <p className="section-subtitle animate-slide-in-up">
              Our platform combines artificial intelligence with proven educational methods to deliver 
              a learning experience that adapts to each student's needs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="feature-card glass-card rounded-xl p-6 animate-slide-in-up" style={{ animationDelay: "0.1s" }}>
              <div className="bg-accent/10 p-3 rounded-lg w-fit mb-5">
                <BrainCircuit className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI-Powered Learning</h3>
              <p className="text-muted-foreground">
                Our AI engine analyzes learning patterns and adapts content to match each student's pace, 
                preferences, and strengths.
              </p>
            </div>
            
            <div className="feature-card glass-card rounded-xl p-6 animate-slide-in-up" style={{ animationDelay: "0.2s" }}>
              <div className="bg-accent/10 p-3 rounded-lg w-fit mb-5">
                <BookOpen className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Rich Content Library</h3>
              <p className="text-muted-foreground">
                Access thousands of lessons, interactive exercises, videos, and assessments across 
                various subjects and difficulty levels.
              </p>
            </div>
            
            <div className="feature-card glass-card rounded-xl p-6 animate-slide-in-up" style={{ animationDelay: "0.3s" }}>
              <div className="bg-accent/10 p-3 rounded-lg w-fit mb-5">
                <GraduationCap className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Personalized Paths</h3>
              <p className="text-muted-foreground">
                Custom learning journeys that adapt to goals, knowledge gaps, and learning style for 
                maximum effectiveness.
              </p>
            </div>
            
            <div className="feature-card glass-card rounded-xl p-6 animate-slide-in-up" style={{ animationDelay: "0.4s" }}>
              <div className="bg-accent/10 p-3 rounded-lg w-fit mb-5">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Collaborative Learning</h3>
              <p className="text-muted-foreground">
                Connect with peers, join study groups, and participate in discussions to enhance 
                understanding through social learning.
              </p>
            </div>
            
            <div className="feature-card glass-card rounded-xl p-6 animate-slide-in-up" style={{ animationDelay: "0.5s" }}>
              <div className="bg-accent/10 p-3 rounded-lg w-fit mb-5">
                <LineChart className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Progress Analytics</h3>
              <p className="text-muted-foreground">
                Detailed insights into learning performance with actionable recommendations to 
                improve knowledge retention and outcomes.
              </p>
            </div>
            
            <div className="feature-card glass-card rounded-xl p-6 animate-slide-in-up" style={{ animationDelay: "0.6s" }}>
              <div className="bg-accent/10 p-3 rounded-lg w-fit mb-5">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure Platform</h3>
              <p className="text-muted-foreground">
                Enterprise-grade security ensures your data and learning progress are always 
                protected and private.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-20 md:py-32 bg-accent/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">What Our Users Say</h2>
            <p className="section-subtitle">
              Hear from educators and learners who have transformed their educational experience with EduAI.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Dr. Emma Rodriguez",
                role: "University Professor",
                quote: "EduAI has revolutionized how I teach complex subjects. The personalized learning paths ensure every student gets exactly what they need.",
                delay: "0.1s"
              },
              {
                name: "Jason Chen",
                role: "Computer Science Student",
                quote: "The AI tutoring is like having a personal instructor available 24/7. It helped me tackle difficult programming concepts at my own pace.",
                delay: "0.2s"
              },
              {
                name: "Sarah Johnson",
                role: "High School Teacher",
                quote: "The analytics dashboard gives me unprecedented insight into how my students are progressing, allowing me to intervene exactly when needed.",
                delay: "0.3s"
              }
            ].map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-background rounded-xl p-8 shadow-sm border border-border/50 animate-slide-in-up" 
                style={{ animationDelay: testimonial.delay }}
              >
                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <svg width="45" height="36" className="text-accent/30" viewBox="0 0 45 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13.4 36C9.4 36 6.2 34.6667 3.8 32C1.53333 29.2 0.4 25.8667 0.4 22C0.4 18.8 1.13333 15.8 2.6 13C4.06667 10.2 6 7.8 8.4 5.8C10.9333 3.66667 13.6 2 16.4 0.8L19 5.8C17.2667 6.6 15.6 7.66667 14 9C12.4 10.2 11.1333 11.6667 10.2 13.4C9.26667 15 8.8 16.8 8.8 18.8H11.4C15 18.8 17.8 19.6667 19.8 21.4C21.8 23.1333 22.8 25.4 22.8 28.2C22.8 30.8667 21.9333 32.9333 20.2 34.4C18.4667 35.4667 16.2 36 13.4 36ZM35 36C31 36 27.8 34.6667 25.4 32C23.1333 29.2 22 25.8667 22 22C22 18.8 22.7333 15.8 24.2 13C25.6667 10.2 27.6 7.8 30 5.8C32.5333 3.66667 35.2 2 38 0.8L40.6 5.8C38.8667 6.6 37.2 7.66667 35.6 9C34 10.2 32.7333 11.6667 31.8 13.4C30.8667 15 30.4 16.8 30.4 18.8H33C36.6 18.8 39.4 19.6667 41.4 21.4C43.4 23.1333 44.4 25.4 44.4 28.2C44.4 30.8667 43.5333 32.9333 41.8 34.4C40.0667 35.4667 37.8 36 35 36Z" fill="currentColor"/>
                    </svg>
                  </div>
                  <p className="text-lg mb-6 flex-grow">{testimonial.quote}</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-accent to-blue-600 animate-gradient-shift"></div>
            
            <div className="relative z-10 px-6 py-12 md:p-16 lg:p-20 text-white">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Learning?</h2>
                <p className="text-xl mb-8 text-white/80">
                  Join thousands of educators and learners who are already using EduAI to revolutionize their educational experience.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link to="/signup">
                    <Button size="lg" className="bg-white text-accent hover:bg-white/90 rounded-lg px-8 transition-all duration-300 hover:scale-105">
                      Get Started
                    </Button>
                  </Link>
                  <Link to="/contact">
                    <Button variant="outline" size="lg" className="text-white border-white hover:bg-white/10 rounded-lg px-8 transition-all duration-300 hover:scale-105">
                      Contact Sales
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
