import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/Button";
import { Check, HelpCircle, X } from "lucide-react";

const PricingTier = ({ 
  name, 
  price, 
  description, 
  features, 
  notIncluded,
  cta,
  popular = false,
  yearly = false
}: { 
  name: string; 
  price: { monthly: number; yearly: number; }; 
  description: string; 
  features: string[]; 
  notIncluded?: string[];
  cta: string;
  popular?: boolean;
  yearly?: boolean;
}) => {
  const annualDiscount = Math.round((1 - (price.yearly / 12) / price.monthly) * 100);
  
  return (
    <div className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
      popular ? 'animate-scale-in' : 'animate-slide-in-up'
    }`}>
      {popular && (
        <>
          <div className="absolute -inset-0.5 bg-gradient-to-r from-accent to-blue-500 blur opacity-30"></div>
          <div className="absolute left-0 right-0 -top-0.5 h-1 bg-gradient-to-r from-accent to-blue-400"></div>
        </>
      )}
      <div className={`relative h-full flex flex-col bg-background p-8 border ${
        popular ? 'border-accent/50 shadow-lg' : 'border-border'
      }`}>
        {popular && (
          <div className="absolute top-0 right-6 transform -translate-y-1/2 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
            Most Popular
          </div>
        )}
        
        <div className="mb-6">
          <h3 className="text-xl font-bold">{name}</h3>
          <p className="text-muted-foreground mt-2">{description}</p>
        </div>
        
        <div className="mb-6">
          <div className="flex items-end">
            <span className="text-4xl font-bold">${yearly ? (price.yearly / 12).toFixed(2) : price.monthly}</span>
            <span className="text-muted-foreground ml-2">/ month</span>
          </div>
          {yearly && (
            <div className="mt-2">
              <span className="text-sm bg-accent/10 text-accent px-2 py-1 rounded-full">
                ${price.yearly} billed annually (Save {annualDiscount}%)
              </span>
            </div>
          )}
        </div>
        
        <div className="flex-grow">
          <ul className="space-y-3 mb-8">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <Check className="h-5 w-5 text-accent flex-shrink-0 mr-3 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
            {notIncluded && notIncluded.map((feature, index) => (
              <li key={index} className="flex items-start text-muted-foreground">
                <X className="h-5 w-5 flex-shrink-0 mr-3 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <Link to="/signup" className="w-full">
          <Button 
            className={`w-full ${
              popular 
                ? 'bg-accent hover:bg-accent/90 text-white' 
                : 'bg-background border border-border hover:bg-accent/5'
            }`}
          >
            {cta}
          </Button>
        </Link>
      </div>
    </div>
  );
};

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  
  return (
    <div className="page-transition">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-accent/10 z-0"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">Simple, Transparent Pricing</h1>
            <p className="text-xl text-muted-foreground mb-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Choose the plan that's right for your educational needs. All plans include core AI features with flexible options as you grow.
            </p>
            
            <div className="inline-flex items-center p-1 bg-accent/5 border border-border rounded-lg animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingCycle === 'monthly' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly
              </button>
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center ${
                  billingCycle === 'yearly' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setBillingCycle('yearly')}
              >
                Annual
                <span className="ml-2 bg-accent/10 text-accent text-xs px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Pricing Tiers */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingTier
              name="Starter"
              price={{ monthly: 9.99, yearly: 95.88 }}
              description="Perfect for individual students and self-learners."
              features={[
                "AI-powered content recommendations",
                "Basic personalized learning paths",
                "Access to core content library",
                "Progress tracking dashboard",
                "Mobile app access"
              ]}
              notIncluded={[
                "Advanced analytics",
                "Custom learning modules",
                "Group management features"
              ]}
              cta="Get Started"
              yearly={billingCycle === 'yearly'}
            />
            
            <PricingTier
              name="Professional"
              price={{ monthly: 29.99, yearly: 287.88 }}
              description="Designed for educators and small classrooms."
              features={[
                "Everything in Starter, plus:",
                "Advanced learning analytics",
                "Custom learning module creation",
                "Up to 30 student accounts",
                "Priority support",
                "Content sharing and collaboration",
                "Integration with common LMS platforms"
              ]}
              cta="Sign Up Now"
              popular={true}
              yearly={billingCycle === 'yearly'}
            />
            
            <PricingTier
              name="Enterprise"
              price={{ monthly: 79.99, yearly: 767.88 }}
              description="For schools, districts, and educational institutions."
              features={[
                "Everything in Professional, plus:",
                "Unlimited student accounts",
                "Advanced admin controls",
                "Custom integration support",
                "Dedicated account manager",
                "Data migration assistance",
                "API access",
                "Custom branding options",
                "24/7 priority support"
              ]}
              cta="Contact Sales"
              yearly={billingCycle === 'yearly'}
            />
          </div>
        </div>
      </section>
      
      {/* FAQs */}
      <section className="py-16 bg-accent/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-16 text-center">Frequently Asked Questions</h2>
            
            <div className="space-y-8">
              {[
                {
                  question: "How does the trial work?",
                  answer: "All plans come with a 14-day free trial with full access to features. No credit card required to start. You can upgrade, downgrade, or cancel at any time during your trial period."
                },
                {
                  question: "Can I switch plans later?",
                  answer: "Yes, you can upgrade, downgrade, or cancel your plan at any time. If you upgrade, the new features will be available immediately. If you downgrade, the changes will take effect at the end of your current billing cycle."
                },
                {
                  question: "Is there a discount for educational institutions?",
                  answer: "Yes, we offer special pricing for K-12 schools, colleges, and universities. Contact our sales team for more information about our educational discounts and volume pricing options."
                },
                {
                  question: "What payment methods do you accept?",
                  answer: "We accept all major credit cards, including Visa, Mastercard, American Express, and Discover. For Enterprise plans, we also offer invoicing and purchase orders."
                },
                {
                  question: "Can I cancel my subscription anytime?",
                  answer: "Yes, you can cancel your subscription at any time. If you cancel, you'll still have access to your account until the end of your current billing period."
                }
              ].map((faq, index) => (
                <div 
                  key={index} 
                  className="bg-background rounded-lg p-6 shadow-sm border border-border animate-slide-in-up"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div className="flex items-start">
                    <HelpCircle className="h-6 w-6 text-accent mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-16 text-center">
              <p className="mb-6 text-lg">Still have questions?</p>
              <Link to="/contact">
                <Button variant="outline" size="lg">
                  Contact Our Team
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
