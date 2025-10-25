export interface HelpRequest {
  id: string;
  question: string;
  customerInfo: {
    name?: string;
    phone?: string;
    email?: string;
  };
  status: 'PENDING' | 'RESOLVED' | 'UNRESOLVED';
  createdAt: Date;
  resolvedAt?: Date;
  supervisorResponse?: string;
  timeoutAt: Date;
  agentSessionId?: string;
}

export interface KnowledgeEntry {
  id: string;
  questionKey: string;
  questionText: string;
  answerText: string;
  createdAt: Date;
  sourceHelpRequestId?: string;
  confidence: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  createdAt: Date;
  lastContactAt?: Date;
}

export interface WebSocketMessage {
  type: 'help_request_created' | 'help_request_updated' | 'knowledge_updated' | 'subscribe' | 'respond_help_request' | 'customer_followup';
  data: any;
  timestamp: Date;
}

export interface LiveKitCallEvent {
  sessionId: string;
  customerInfo: {
    name?: string;
    phone?: string;
  };
  question: string;
  timestamp: Date;
}
