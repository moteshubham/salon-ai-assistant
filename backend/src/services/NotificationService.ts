import { WebSocketMessage } from '../models';
import WebSocket from 'ws';

export class NotificationService {
  private wss: WebSocket.Server;
  private clients: Set<WebSocket> = new Set();

  constructor(port: number) {
    this.wss = new WebSocket.Server({ port });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New supervisor client connected');
      this.clients.add(ws);

      ws.on('message', (message: string) => {
        try {
          const data: WebSocketMessage = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('Supervisor client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    console.log(`WebSocket server running on port ${this.wss.options.port}`);
  }

  private handleMessage(ws: WebSocket, message: WebSocketMessage) {
    switch (message.type) {
      case 'subscribe':
        console.log('Client subscribed to notifications');
        ws.send(JSON.stringify({
          type: 'subscribed',
          data: { message: 'Successfully subscribed to notifications' },
          timestamp: new Date()
        }));
        break;
      case 'respond_help_request':
        // This will be handled by the main application
        console.log('Help request response received:', message.data);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  notifyHelpRequestCreated(helpRequest: any) {
    const message: WebSocketMessage = {
      type: 'help_request_created',
      data: helpRequest,
      timestamp: new Date()
    };

    this.broadcast(message);
    console.log('📞 New help request created:', helpRequest.question);
  }

  notifyHelpRequestUpdated(helpRequest: any) {
    const message: WebSocketMessage = {
      type: 'help_request_updated',
      data: helpRequest,
      timestamp: new Date()
    };

    this.broadcast(message);
    console.log('📝 Help request updated:', helpRequest.id);
  }

  notifyKnowledgeUpdated(knowledgeEntry: any) {
    const message: WebSocketMessage = {
      type: 'knowledge_updated',
      data: knowledgeEntry,
      timestamp: new Date()
    };

    this.broadcast(message);
    console.log('🧠 Knowledge base updated:', knowledgeEntry.questionText);
  }

  notifyCustomerFollowUp(sessionId: string, message: string) {
    const followUpMessage: WebSocketMessage = {
      type: 'customer_followup',
      data: {
        sessionId,
        message,
        timestamp: new Date()
      },
      timestamp: new Date()
    };

    this.broadcast(followUpMessage);
    console.log('📢 Customer follow-up sent:', message);
  }

  private broadcast(message: WebSocketMessage) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  getConnectedClientsCount(): number {
    return this.clients.size;
  }
}
