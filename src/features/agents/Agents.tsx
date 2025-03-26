import React from 'react';
import { Brain, HelpCircle } from 'lucide-react';
import { Button } from '@/components/Button';

const Agents = () => {
  const agents = [
    { id: 1, name: "WritingAssistant", type: "Writing", description: "Helps with essay writing and composition", status: "Active" },
    { id: 2, name: "MathSolver", type: "Mathematics", description: "Solves and explains math problems", status: "Active" },
    { id: 3, name: "ResearchHelper", type: "Research", description: "Assists with research tasks and citation", status: "Inactive" },
    { id: 4, name: "CodeTutor", type: "Programming", description: "Explains programming concepts and debugs code", status: "Active" },
  ];
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">AI Agents</h2>
      
      <div className="mb-8">
        <p className="text-gray-600 mb-4">Use our specialized AI agents to help with various aspects of your studies.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-gray-50 rounded-xl shadow-sm p-6 border border-gray-200 transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Brain className="text-blue-600" size={24} />
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  agent.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                }`}>
                  {agent.status}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-1">{agent.name}</h3>
              <p className="text-sm text-blue-600 mb-2">{agent.type}</p>
              <p className="text-sm text-gray-600 mb-4">{agent.description}</p>
              
              <Button 
                className={`w-full ${
                  agent.status === "Active" 
                    ? "bg-blue-600 hover:bg-blue-700" 
                    : "bg-gray-300 cursor-not-allowed"
                }`}
                disabled={agent.status !== "Active"}
              >
                Use Agent
              </Button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
        <div className="flex flex-col md:flex-row items-center">
          <div className="mb-4 md:mb-0 md:mr-6">
            <div className="p-3 bg-blue-100 rounded-full inline-block">
              <HelpCircle className="text-blue-600 h-8 w-8" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-800 mb-1">Need a custom agent?</h3>
            <p className="text-blue-600 mb-4">We can develop specialized AI agents tailored to your specific academic needs.</p>
            <Button variant="outline" className="bg-white border-blue-300 text-blue-600 hover:bg-blue-50">
              Request Custom Agent
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agents; 