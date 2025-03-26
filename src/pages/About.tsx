
import { Brain, Cpu, Lightbulb, Users, Award, Rocket } from "lucide-react";

const About = () => {
  return (
    <div className="page-transition">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-accent/10 z-0"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">About EduAI</h1>
            <p className="text-xl text-muted-foreground mb-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              We're on a mission to transform education through artificial intelligence, making learning more accessible, personalized, and effective for everyone.
            </p>
          </div>
        </div>
      </section>
      
      {/* Our Story Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 animate-slide-in-up">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-accent/30 to-blue-500/30 rounded-2xl blur opacity-30"></div>
                <div className="relative rounded-xl overflow-hidden">
                  <img 
                    src="https://placehold.co/600x400/2563eb/FFFFFF/png?text=Our+Story&font=montserrat" 
                    alt="Team collaborating" 
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 animate-slide-in-up" style={{ animationDelay: "0.2s" }}>
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <p className="text-lg text-muted-foreground mb-4">
                Founded in 2022 by a team of educators, technologists, and AI researchers, EduAI was born from a shared vision: to harness the power of artificial intelligence to overcome the limitations of traditional education.
              </p>
              <p className="text-lg text-muted-foreground mb-4">
                We recognized that despite advances in educational technology, most platforms still followed a one-size-fits-all approach that failed to address the unique needs of each learner.
              </p>
              <p className="text-lg text-muted-foreground">
                After two years of intense research and development, we launched EduAI with our proprietary adaptive learning algorithm that personalizes content delivery, pace, and assessment for each individual student.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Our Mission & Vision Section */}
      <section className="py-16 md:py-24 bg-accent/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="animate-slide-in-up">
              <div className="bg-accent/10 p-3 rounded-lg w-fit mb-5">
                <Lightbulb className="h-6 w-6 text-accent" />
              </div>
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground mb-4">
                To democratize quality education by creating an AI-powered learning platform that adapts to each student's unique needs, learning style, and pace.
              </p>
              <p className="text-lg text-muted-foreground">
                We believe that personalized education should be accessible to everyone, regardless of background, location, or resources. Our platform is designed to break down barriers and create opportunities for lifelong learning.
              </p>
            </div>
            
            <div className="animate-slide-in-up" style={{ animationDelay: "0.2s" }}>
              <div className="bg-accent/10 p-3 rounded-lg w-fit mb-5">
                <Rocket className="h-6 w-6 text-accent" />
              </div>
              <h2 className="text-3xl font-bold mb-6">Our Vision</h2>
              <p className="text-lg text-muted-foreground mb-4">
                A world where AI-enhanced education enables everyone to reach their full potential by learning in ways that are optimized for their individual strengths and preferences.
              </p>
              <p className="text-lg text-muted-foreground">
                We envision a future where education is truly personalized, where learning is engaging and effective, and where technology serves as a bridge between students and knowledge rather than a barrier.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Our Values Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Values</h2>
            <p className="text-lg text-muted-foreground">
              These core principles guide everything we do, from product development to customer support.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Brain className="h-8 w-8 text-accent" />,
                title: "Innovation",
                description: "We continuously push the boundaries of what's possible in educational technology, leveraging cutting-edge AI research to improve our platform."
              },
              {
                icon: <Users className="h-8 w-8 text-accent" />,
                title: "Inclusivity",
                description: "We design for diversity, ensuring our platform is accessible and effective for learners of all backgrounds, abilities, and learning preferences."
              },
              {
                icon: <Award className="h-8 w-8 text-accent" />,
                title: "Excellence",
                description: "We hold ourselves to the highest standards in everything we do, from the quality of our content to the reliability of our technology."
              },
              {
                icon: <Cpu className="h-8 w-8 text-accent" />,
                title: "Ethics",
                description: "We are committed to the responsible use of AI, ensuring privacy, transparency, and fairness in all our algorithms and data practices."
              },
              {
                icon: <Lightbulb className="h-8 w-8 text-accent" />,
                title: "Empowerment",
                description: "We believe in giving learners and educators the tools and insights they need to take control of their educational journey."
              },
              {
                icon: <Users className="h-8 w-8 text-accent" />,
                title: "Collaboration",
                description: "We foster partnerships with educators, institutions, and researchers to continually improve our understanding of effective learning."
              }
            ].map((value, index) => (
              <div 
                key={index} 
                className="bg-background rounded-xl p-8 shadow-sm border border-border/50 animate-slide-in-up" 
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="bg-accent/10 p-4 rounded-lg w-fit mb-6">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Team Section */}
      <section className="py-16 md:py-24 bg-accent/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Leadership Team</h2>
            <p className="text-lg text-muted-foreground">
              Meet the passionate experts leading our mission to transform education through AI.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: "Dr. Maya Patel",
                role: "Co-Founder & CEO",
                image: "https://placehold.co/300x300/2563eb/FFFFFF/png?text=MP&font=montserrat",
                delay: "0.1s"
              },
              {
                name: "Alex Chen",
                role: "Co-Founder & CTO",
                image: "https://placehold.co/300x300/2563eb/FFFFFF/png?text=AC&font=montserrat",
                delay: "0.2s"
              },
              {
                name: "Sarah Johnson",
                role: "Chief Learning Officer",
                image: "https://placehold.co/300x300/2563eb/FFFFFF/png?text=SJ&font=montserrat",
                delay: "0.3s"
              },
              {
                name: "David Kim",
                role: "Chief Product Officer",
                image: "https://placehold.co/300x300/2563eb/FFFFFF/png?text=DK&font=montserrat",
                delay: "0.4s"
              }
            ].map((member, index) => (
              <div 
                key={index} 
                className="flex flex-col items-center animate-slide-in-up" 
                style={{ animationDelay: member.delay }}
              >
                <div className="relative mb-5 w-48 h-48 rounded-full overflow-hidden">
                  <div className="absolute -inset-1 bg-gradient-to-r from-accent/50 to-blue-500/50 rounded-full blur opacity-30"></div>
                  <div className="relative w-full h-full rounded-full overflow-hidden">
                    <img 
                      src={member.image} 
                      alt={member.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                <p className="text-muted-foreground">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
