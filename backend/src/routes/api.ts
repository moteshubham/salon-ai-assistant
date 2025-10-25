import { Router, Request, Response } from 'express';
import { HelpRequestService } from '../services/HelpRequestService';
import { KnowledgeBaseService } from '../services/KnowledgeBaseService';
import { LiveKitService } from '../services/LiveKitService';
import { NotificationService } from '../services/NotificationService';
import { HelpRequest, LiveKitCallEvent } from '../models';

const router = Router();
const helpRequestService = new HelpRequestService();
const knowledgeBaseService = new KnowledgeBaseService();
const liveKitService = new LiveKitService();

// Store notification service reference for use in routes
let notificationService: NotificationService;

export const setNotificationService = (service: NotificationService) => {
  notificationService = service;
};

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date(),
    connectedClients: notificationService?.getConnectedClientsCount() || 0
  });
});

// LiveKit endpoints
router.post('/livekit/token', async (req: Request, res: Response) => {
  try {
    const { roomName, participantName, participantIdentity } = req.body;
    
    if (!roomName || !participantName || !participantIdentity) {
      return res.status(400).json({ error: 'Missing required fields: roomName, participantName, participantIdentity' });
    }
    
    const token = await liveKitService.generateAccessToken(roomName, participantName, participantIdentity);
    const roomInfo = liveKitService.getRoomInfo(roomName.replace('call-', ''));
    
    res.json({
      token,
      livekitUrl: roomInfo.livekitUrl,
      roomName
    });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/livekit/room/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const roomInfo = liveKitService.getRoomInfo(sessionId);
    
    res.json(roomInfo);
  } catch (error) {
    console.error('Error getting room info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Agent endpoints
router.post('/agent/call-received', async (req: Request, res: Response) => {
  try {
    const callEvent: LiveKitCallEvent = req.body;
    
    // First, check if we have a knowledge base answer
    const knowledgeMatch = await knowledgeBaseService.findMatch(callEvent.question);
    
    if (knowledgeMatch) {
      // We have an answer, respond directly
      await liveKitService.notifyCustomer(callEvent.sessionId, knowledgeMatch.answerText);
      res.json({ 
        success: true, 
        response: knowledgeMatch.answerText,
        source: 'knowledge_base'
      });
    } else {
      // No answer found, escalate to supervisor
      await liveKitService.escalateToSupervisor(callEvent.sessionId, callEvent.question);
      
      // Create help request
      const helpRequest = await helpRequestService.createHelpRequest({
        question: callEvent.question,
        customerInfo: callEvent.customerInfo,
        status: 'PENDING',
        agentSessionId: callEvent.sessionId
      });

      // Notify supervisor
      notificationService.notifyHelpRequestCreated(helpRequest);

      res.json({ 
        success: true, 
        response: "Let me check with my supervisor and get back to you.",
        helpRequestId: helpRequest.id,
        source: 'escalated'
      });
    }
  } catch (error) {
    console.error('Error processing call:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Help request endpoints
router.get('/help-requests', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    
    let requests: HelpRequest[];
    if (status === 'pending') {
      requests = await helpRequestService.getPendingRequests();
    } else {
      requests = await helpRequestService.getAllRequests();
    }
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching help requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/help-requests/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const request = await helpRequestService.getHelpRequest(id);
    
    if (!request) {
      return res.status(404).json({ error: 'Help request not found' });
    }
    
    res.json(request);
  } catch (error) {
    console.error('Error fetching help request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/help-requests/:id/respond', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { supervisorResponse } = req.body;
    
    if (!supervisorResponse) {
      return res.status(400).json({ error: 'Supervisor response is required' });
    }
    
    const helpRequest = await helpRequestService.getHelpRequest(id);
    if (!helpRequest) {
      return res.status(404).json({ error: 'Help request not found' });
    }
    
    // Mark as resolved
    await helpRequestService.markResolved(id, supervisorResponse);
    
    // Add to knowledge base
    const knowledgeEntry = await knowledgeBaseService.addEntry({
      questionKey: knowledgeBaseService.normalizeQuestion(helpRequest.question),
      questionText: helpRequest.question,
      answerText: supervisorResponse,
      sourceHelpRequestId: id,
      confidence: 1.0
    });
    
    // Notify customer with follow-up
    if (helpRequest.agentSessionId) {
      await liveKitService.sendFollowUp(helpRequest.agentSessionId, supervisorResponse);
      
      // Also send follow-up message via WebSocket for frontend display
      const followUpMessage = `Thank you for your patience. ${supervisorResponse}`;
      notificationService.notifyCustomerFollowUp(helpRequest.agentSessionId, followUpMessage);
    }
    
    // Notify supervisor UI
    const updatedRequest = await helpRequestService.getHelpRequest(id);
    notificationService.notifyHelpRequestUpdated(updatedRequest);
    notificationService.notifyKnowledgeUpdated(knowledgeEntry);
    
    res.json({ 
      success: true, 
      helpRequest: updatedRequest,
      knowledgeEntry 
    });
  } catch (error) {
    console.error('Error responding to help request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Knowledge base endpoints
router.get('/knowledge', async (req: Request, res: Response) => {
  try {
    const entries = await knowledgeBaseService.getAllEntries();
    res.json(entries);
  } catch (error) {
    console.error('Error fetching knowledge entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/knowledge/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await knowledgeBaseService.deleteEntry(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting knowledge entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
