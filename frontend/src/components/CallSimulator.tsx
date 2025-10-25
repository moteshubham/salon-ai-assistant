import React, { useState } from 'react';
import axios from 'axios';

interface CallSimulatorProps {
  callLog: string[];
  addToCallLog: (message: string) => void;
  clearCallLog: () => void;
  pendingHelpRequests: {[key: string]: string};
  setPendingHelpRequests: React.Dispatch<React.SetStateAction<{[key: string]: string}>>;
  connected: boolean;
}

const CallSimulator: React.FC<CallSimulatorProps> = ({
  callLog,
  addToCallLog,
  clearCallLog,
  pendingHelpRequests,
  setPendingHelpRequests,
  connected
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [question, setQuestion] = useState('');
  const [isCalling, setIsCalling] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const simulateCall = async () => {
    if (!question.trim()) {
      alert('Please enter a question');
      return;
    }

    setIsCalling(true);
    addToCallLog(`📞 Simulating call from ${customerName || 'Customer'}`);
    addToCallLog(`❓ Question: "${question}"`);

    try {
      const response = await axios.post(`${API_URL}/api/agent/call-received`, {
        sessionId: `sim-${Date.now()}`,
        customerInfo: {
          name: customerName || 'Anonymous Customer',
          phone: customerPhone || 'Unknown'
        },
        question: question,
        timestamp: new Date()
      });

      addToCallLog(`🤖 AI Response: "${response.data.response}"`);
      
      if (response.data.source === 'escalated') {
        addToCallLog(`🔄 Question escalated to supervisor (Request ID: ${response.data.helpRequestId})`);
        addToCallLog(`⏳ Waiting for supervisor response...`);
        
        // Track this help request to listen for supervisor response
        setPendingHelpRequests(prev => ({
          ...prev,
          [response.data.helpRequestId]: question
        }));
      } else {
        addToCallLog(`✅ Answered from knowledge base`);
      }

    } catch (error) {
      addToCallLog(`❌ Error: ${error}`);
      console.error('Call simulation error:', error);
    } finally {
      setIsCalling(false);
    }
  };

  const checkForMissedResponses = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/help-requests`);
      const resolvedRequests = response.data.filter((req: any) => 
        req.status === 'RESOLVED' && pendingHelpRequests[req.id]
      );

      resolvedRequests.forEach((req: any) => {
        addToCallLog(`👨‍💼 Supervisor Response: "${req.supervisorResponse}"`);
        addToCallLog(`✅ Question resolved!`);
        
        setPendingHelpRequests(prev => {
          const updated = { ...prev };
          delete updated[req.id];
          return updated;
        });
      });

      if (resolvedRequests.length > 0) {
        addToCallLog(`🔄 Found ${resolvedRequests.length} missed response(s)`);
      }
    } catch (error) {
      console.error('Error checking for missed responses:', error);
    }
  };


  const predefinedQuestions = [
    "What are your salon hours?",
    "Do you take walk-ins?",
    "How much does a haircut cost?",
    "Do you offer hair coloring services?",
    "Can I book an appointment online?",
    "What payment methods do you accept?",
    "Do you have parking available?",
    "Can I cancel my appointment?",
    "Do you offer wedding hair services?",
    "What products do you sell?"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold text-grey-900">Call Simulator</h1>
            <p className="text-gray-600 mt-1">Test AI receptionist interactions</p>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Connection Status */}
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'} shadow-sm`}></div>
              <span className="text-sm text-gray-600 font-medium">
                {connected ? 'Live' : 'Offline'}
              </span>
            </div>
            
            {/* Pending Requests */}
            {Object.keys(pendingHelpRequests).length > 0 && (
              <div className="flex items-center space-x-2 bg-amber-50 px-3 py-2 rounded-full border border-amber-200">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-amber-700 font-medium">
                  {Object.keys(pendingHelpRequests).length} pending
                </span>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={checkForMissedResponses}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
              >
                Refresh
              </button>
              <button
                onClick={clearCallLog}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Call Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Start New Call</h2>
                <p className="text-gray-600 text-sm">Simulate customer interactions with the AI receptionist</p>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter customer name"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initial Question
                  </label>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="What would you like to ask the AI receptionist?"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 resize-none"
                  />
                </div>

                <div>
                  <button
                    onClick={simulateCall}
                    disabled={isCalling || !question.trim()}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                  >
                    {isCalling ? 'Processing...' : '💬 Start Call Simulation'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Questions Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Questions</h3>
                <p className="text-gray-600 text-sm">Click to use common questions</p>
              </div>
              
              <div className="space-y-3">
                {predefinedQuestions.map((q, index) => (
                  <button
                    key={index}
                    onClick={() => setQuestion(q)}
                    className="w-full text-left p-4 text-sm bg-white/50 hover:bg-white/80 rounded-xl border border-gray-200 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 group"
                  >
                    <span className="text-gray-700 group-hover:text-blue-600 transition-colors duration-200">
                      {q}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Call Log */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl">
          <div className="px-8 py-6 border-b border-gray-200/50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Call Log</h3>
                <p className="text-gray-600 text-sm mt-1">Real-time conversation history</p>
              </div>
              {Object.keys(pendingHelpRequests).length > 0 && (
                <div className="flex items-center space-x-2 bg-amber-50 px-4 py-2 rounded-full border border-amber-200">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-amber-700 font-medium">
                    Waiting for {Object.keys(pendingHelpRequests).length} response(s)
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-8">
            {callLog.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl text-gray-400">💬</span>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No calls yet</h4>
                <p className="text-gray-600">Start a call to see the conversation log here</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {callLog.map((log, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-white/50 rounded-xl border border-gray-200/50">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm font-mono text-gray-700 leading-relaxed">{log}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallSimulator;
