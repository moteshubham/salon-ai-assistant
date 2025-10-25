import { useState, useEffect } from 'react';
import axios from 'axios';
import { type HelpRequest, type KnowledgeEntry } from './types';
import RequestList from './components/RequestList.tsx';
import KnowledgeBase from './components/KnowledgeBase.tsx';
import CallSimulator from './components/CallSimulator.tsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface WebSocketMessage {
  type: 'help_request_created' | 'help_request_updated' | 'knowledge_updated' | 'customer_followup';
  data: HelpRequest | KnowledgeEntry | { sessionId: string; message: string; timestamp: string };
  timestamp: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<'requests' | 'knowledge' | 'simulator'>('requests');
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [callLog, setCallLog] = useState<string[]>([]);
  const [pendingHelpRequests, setPendingHelpRequests] = useState<{[key: string]: string}>({});

  const addToCallLog = (message: string) => {
    setCallLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearCallLog = () => {
    setCallLog([]);
  };

  useEffect(() => {
    // Initialize WebSocket connection
    const websocket = new WebSocket('ws://localhost:4001');
    
    websocket.onopen = () => {
      console.log('Connected to WebSocket');
      setConnected(true);
      websocket.send(JSON.stringify({
        type: 'subscribe',
        data: {},
        timestamp: new Date()
      }));
    };

    websocket.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };

    // Store websocket reference for cleanup

    // Load initial data
    loadHelpRequests();
    loadKnowledgeEntries();

    return () => {
      websocket.close();
    };
  }, []);

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'help_request_created':
        setHelpRequests(prev => [message.data as HelpRequest, ...prev]);
        break;
      case 'help_request_updated': {
        const updatedRequest = message.data as HelpRequest;
        setHelpRequests(prev => 
          prev.map(req => req.id === updatedRequest.id ? updatedRequest : req)
        );
        
        // Check if this is a supervisor response to a pending request
        if (updatedRequest.status === 'RESOLVED' && pendingHelpRequests[updatedRequest.id]) {
          addToCallLog(`👨‍💼 Supervisor Response: "${updatedRequest.supervisorResponse}"`);
          addToCallLog(`✅ Question resolved!`);
          
          // Remove from pending requests
          setPendingHelpRequests(prev => {
            const updated = { ...prev };
            delete updated[updatedRequest.id];
            return updated;
          });
        }
        break;
      }
      case 'knowledge_updated':
        setKnowledgeEntries(prev => [message.data as KnowledgeEntry, ...prev]);
        break;
      case 'customer_followup': {
        const followUpData = message.data as { sessionId: string; message: string; timestamp: string };
        addToCallLog(`🤖 AI Follow-up: "${followUpData.message}"`);
        break;
      }
    }
  };

  const loadHelpRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/help-requests`);
      setHelpRequests(response.data);
    } catch (error) {
      console.error('Error loading help requests:', error);
    }
  };

  const loadKnowledgeEntries = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/knowledge`);
      setKnowledgeEntries(response.data);
    } catch (error) {
      console.error('Error loading knowledge entries:', error);
    }
  };

  const respondToRequest = async (requestId: string, response: string) => {
    try {
      await axios.post(`${API_URL}/api/help-requests/${requestId}/respond`, {
        supervisorResponse: response
      });
      loadHelpRequests();
    } catch (error) {
      console.error('Error responding to request:', error);
    }
  };

  const deleteKnowledgeEntry = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/api/knowledge/${id}`);
      setKnowledgeEntries(prev => prev.filter(entry => entry.id !== id));
    } catch (error) {
      console.error('Error deleting knowledge entry:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              AI Receptionist Supervisor Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${connected ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
          
          <nav className="flex space-x-8">
            {[
              { id: 'requests', label: 'Help Requests', count: helpRequests.filter(r => r.status === 'PENDING').length },
              { id: 'knowledge', label: 'Knowledge Base', count: knowledgeEntries.length },
              { id: 'simulator', label: 'Call Simulator', count: null }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'requests' | 'knowledge' | 'simulator')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'requests' && (
          <RequestList 
            requests={helpRequests} 
            onRespond={respondToRequest}
            onRefresh={loadHelpRequests}
          />
        )}
        {activeTab === 'knowledge' && (
          <KnowledgeBase 
            entries={knowledgeEntries}
            onDelete={deleteKnowledgeEntry}
            onRefresh={loadKnowledgeEntries}
          />
        )}
        {activeTab === 'simulator' && (
          <CallSimulator 
            callLog={callLog}
            addToCallLog={addToCallLog}
            clearCallLog={clearCallLog}
            pendingHelpRequests={pendingHelpRequests}
            setPendingHelpRequests={setPendingHelpRequests}
            connected={connected}
          />
        )}
      </div>
    </div>
  );
}

export default App;