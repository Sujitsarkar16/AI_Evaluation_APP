
import { Brain, Cpu, Lightbulb, Users, Award, Rocket } from "lucide-react";

const About = () => {
  return (
    <div className="page-transition">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-accent/10 z-0"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">About Autograder AI</h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              We're on a mission to transform assessment through artificial intelligence, making grading more accurate, efficient, and insightful for educators.
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
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                Founded in 2022 by a team of educators, technologists, and AI researchers, Autograder AI was born from a shared vision: to harness the power of artificial intelligence to overcome the limitations of traditional assessment and grading.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                We recognized that despite advances in educational technology, grading and assessment remained time-consuming, inconsistent, and often failed to provide meaningful feedback to students.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                After two years of intense research and development, we launched Autograder AI with our proprietary AI evaluation algorithm that automates grading, provides detailed feedback, and ensures consistent assessment across all submissions.
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
                <Lightbulb className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                To democratize quality assessment by creating an AI-powered autograding platform that provides consistent, detailed, and timely feedback for every student submission.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                We believe that effective assessment should be accessible to all educators, regardless of class size, resources, or time constraints. Our platform is designed to break down barriers and create opportunities for meaningful evaluation.
              </p>
            </div>
            
            <div className="animate-slide-in-up" style={{ animationDelay: "0.2s" }}>
              <div className="bg-accent/10 p-3 rounded-lg w-fit mb-5">
                <Rocket className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold mb-6">Our Vision</h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                A world where AI-enhanced assessment enables every educator to provide timely, detailed, and constructive feedback that helps students reach their full potential.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                We envision a future where grading is truly intelligent, where feedback is meaningful and actionable, and where technology serves as a bridge between educators and effective assessment rather than a burden.
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
            <p className="text-lg text-gray-700 dark:text-gray-300">
              These core principles guide everything we do, from product development to customer support.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Brain className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
                title: "Innovation",
                description: "We continuously push the boundaries of what's possible in assessment technology, leveraging cutting-edge AI research to improve our autograding platform."
              },
              {
                icon: <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
                title: "Inclusivity",
                description: "We design for diversity, ensuring our platform is accessible and effective for educators and students of all backgrounds, subjects, and assessment needs."
              },
              {
                icon: <Award className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
                title: "Excellence",
                description: "We hold ourselves to the highest standards in everything we do, from the quality of our content to the reliability of our technology."
              },
              {
                icon: <Cpu className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
                title: "Ethics",
                description: "We are committed to the responsible use of AI, ensuring privacy, transparency, and fairness in all our algorithms and data practices."
              },
              {
                icon: <Lightbulb className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
                title: "Empowerment",
                description: "We believe in giving educators the tools and insights they need to take control of their assessment and grading processes."
              },
              {
                icon: <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
                title: "Collaboration",
                description: "We foster partnerships with educators, institutions, and researchers to continually improve our understanding of effective assessment and feedback."
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
                <p className="text-gray-700 dark:text-gray-300">{value.description}</p>
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
            <p className="text-lg text-gray-700 dark:text-gray-300">
              Meet the passionate experts leading our mission to transform assessment and grading through AI.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Dr. Neha Sharma",
                role: "Founder & CEO",
                image: "https://placehold.co/300x300/2563eb/FFFFFF/png?text=NS&font=montserrat",
                delay: "0.1s"
              },
              {
                name: "Mrityunjoy Pandey",
                role: "Co-Founder & CTO",
                image: "https://placehold.co/300x300/2563eb/FFFFFF/png?text=MP&font=montserrat",
                delay: "0.2s"
              },
              {
                name: "Sujit Sarkar",
                role: "Co-Founder & COO",
                image: "https://placehold.co/300x300/2563eb/FFFFFF/png?text=SS&font=montserrat",
                delay: "0.3s"
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
                <p className="text-gray-700 dark:text-gray-300">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
