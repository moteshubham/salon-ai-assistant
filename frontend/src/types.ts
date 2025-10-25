export interface HelpRequest {
  id: string;
  question: string;
  customerInfo: {
    name?: string;
    phone?: string;
    email?: string;
  };
  status: 'PENDING' | 'RESOLVED' | 'UNRESOLVED';
  createdAt: string;
  resolvedAt?: string;
  supervisorResponse?: string;
  timeoutAt: string;
  agentSessionId?: string;
}

export interface KnowledgeEntry {
  id: string;
  questionKey: string;
  questionText: string;
  answerText: string;
  createdAt: string;
  sourceHelpRequestId?: string;
  confidence: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  createdAt: string;
  lastContactAt?: string;
}
