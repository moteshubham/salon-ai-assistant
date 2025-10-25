import { LiveKitCallEvent } from '../models';
import { AccessToken } from 'livekit-server-sdk';

export class LiveKitService {
  private apiKey: string;
  private apiSecret: string;
  private livekitUrl: string;

  constructor() {
    this.apiKey = process.env.LIVEKIT_API_KEY || '';
    this.apiSecret = process.env.LIVEKIT_API_SECRET || '';
    this.livekitUrl = process.env.LIVEKIT_URL || 'wss://your-livekit-server';
  }

  // Generate access token for room access
  async generateAccessToken(roomName: string, participantName: string, participantIdentity: string): Promise<string> {
    const token = new AccessToken(this.apiKey, this.apiSecret, {
      identity: participantIdentity,
      name: participantName,
    });

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    return await token.toJwt();
  }

  // Create a room for the call session
  async createRoom(roomName: string): Promise<void> {
    console.log(`🏠 Creating LiveKit room: ${roomName}`);
    // In production, you'd use the LiveKit REST API to create rooms
    // For now, rooms are created automatically when first participant joins
  }

  // Handle incoming call with real LiveKit integration
  async simulateCallReceived(callEvent: LiveKitCallEvent): Promise<void> {
    console.log('📞 LiveKit call received:', {
      sessionId: callEvent.sessionId,
      customer: callEvent.customerInfo,
      question: callEvent.question
    });

    // Create room for this call session
    const roomName = `call-${callEvent.sessionId}`;
    await this.createRoom(roomName);

    // Generate tokens for AI agent and customer
    const agentToken = await this.generateAccessToken(roomName, 'AI Agent', 'agent');
    const customerToken = await this.generateAccessToken(roomName, callEvent.customerInfo.name || 'Customer', 'customer');

    console.log(`🔑 Generated tokens for room: ${roomName}`);
    console.log(`🤖 Agent token: ${agentToken.substring(0, 20)}...`);
    console.log(`👤 Customer token: ${customerToken.substring(0, 20)}...`);
  }

  // Send TTS message to customer
  async notifyCustomer(sessionId: string, message: string): Promise<void> {
    console.log(`📢 TTS to customer ${sessionId}: ${message}`);
    
    // In production, this would:
    // 1. Connect to LiveKit room
    // 2. Use TTS service to convert text to speech
    // 3. Send audio to customer's audio track
    // 4. Update customer's UI with the message
    
    // For now, we'll simulate this with a WebSocket message
    const roomName = `call-${sessionId}`;
    console.log(`🎵 Playing TTS in room ${roomName}: "${message}"`);
  }

  // Escalate to supervisor with LiveKit room info
  async escalateToSupervisor(sessionId: string, question: string): Promise<void> {
    const escalationMessage = "Let me check with my supervisor and get back to you.";
    await this.notifyCustomer(sessionId, escalationMessage);
    console.log(`🔄 Escalated question to supervisor: ${question}`);
    console.log(`📞 LiveKit room: call-${sessionId}`);
  }

  // Send follow-up with TTS
  async sendFollowUp(sessionId: string, answer: string): Promise<void> {
    const followUpMessage = `Thank you for your patience. ${answer}`;
    await this.notifyCustomer(sessionId, followUpMessage);
    console.log(`✅ Sent TTS follow-up to customer ${sessionId}`);
  }

  // Get room information for frontend
  getRoomInfo(sessionId: string) {
    return {
      roomName: `call-${sessionId}`,
      livekitUrl: this.livekitUrl,
      apiKey: this.apiKey,
    };
  }
}
