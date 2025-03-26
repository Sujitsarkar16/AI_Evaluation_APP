
import { useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, MapPin, Phone, Send } from "lucide-react";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Message sent!",
        description: "Thank you for reaching out. We'll get back to you soon.",
      });
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: ""
      });
      setIsSubmitting(false);
    }, 1500);
  };
  
  return (
    <div className="page-transition">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-accent/10 z-0"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">Get in Touch</h1>
            <p className="text-xl text-muted-foreground mb-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Have questions about EduAI? Our team is here to help. Reach out to us and we'll respond as soon as possible.
            </p>
          </div>
        </div>
      </section>
      
      {/* Contact Details Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-background rounded-xl p-8 shadow-sm border border-border/50 text-center animate-slide-in-up">
              <div className="inline-flex items-center justify-center bg-accent/10 p-4 rounded-full mb-6">
                <MapPin className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Our Office</h3>
              <p className="text-muted-foreground">
                123 Innovation Way<br />
                Tech City, TC 10101<br />
                United States
              </p>
            </div>
            
            <div className="bg-background rounded-xl p-8 shadow-sm border border-border/50 text-center animate-slide-in-up" style={{ animationDelay: "0.2s" }}>
              <div className="inline-flex items-center justify-center bg-accent/10 p-4 rounded-full mb-6">
                <Mail className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Email Us</h3>
              <p className="text-muted-foreground mb-2">
                General Inquiries:<br />
                <a href="mailto:hello@eduai.com" className="text-accent hover:underline">hello@eduai.com</a>
              </p>
              <p className="text-muted-foreground">
                Support:<br />
                <a href="mailto:support@eduai.com" className="text-accent hover:underline">support@eduai.com</a>
              </p>
            </div>
            
            <div className="bg-background rounded-xl p-8 shadow-sm border border-border/50 text-center animate-slide-in-up" style={{ animationDelay: "0.4s" }}>
              <div className="inline-flex items-center justify-center bg-accent/10 p-4 rounded-full mb-6">
                <Phone className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Call Us</h3>
              <p className="text-muted-foreground mb-2">
                Main Office:<br />
                <a href="tel:+15551234567" className="text-accent hover:underline">+1 (555) 123-4567</a>
              </p>
              <p className="text-muted-foreground">
                Customer Support:<br />
                <a href="tel:+15557891234" className="text-accent hover:underline">+1 (555) 789-1234</a>
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Contact Form Section */}
      <section className="py-16 bg-accent/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-background rounded-xl p-8 md:p-12 shadow-sm border border-border/50 animate-slide-in-up">
              <h2 className="text-3xl font-bold mb-8 text-center">Send Us a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Your Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      required
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Your Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      required
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-2">
                    Subject
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="How can we help you?"
                    required
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us more about your inquiry..."
                    rows={6}
                    required
                    className="w-full"
                  />
                </div>
                
                <div>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-accent hover:bg-accent/90 text-white"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
      
      {/* Map Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl overflow-hidden shadow-sm border border-border/50 animate-slide-in-up h-[400px]">
            {/* Placeholder for map - in a real app, you'd use Google Maps or similar */}
            <div className="bg-accent/10 w-full h-full flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-accent mb-4 mx-auto" />
                <p className="text-lg font-medium">Interactive Map Would Be Here</p>
                <p className="text-muted-foreground">123 Innovation Way, Tech City, TC 10101</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
