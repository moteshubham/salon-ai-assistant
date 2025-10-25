import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { NotificationService } from './services/NotificationService';
import { HelpRequestService } from './services/HelpRequestService';
import { LiveKitService } from './services/LiveKitService';
import apiRoutes, { setNotificationService } from './routes/api';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const WS_PORT = parseInt(process.env.WS_PORT || '4001');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const notificationService = new NotificationService(WS_PORT);
const helpRequestService = new HelpRequestService();
const liveKitService = new LiveKitService();

// Set notification service reference for routes
setNotificationService(notificationService);

// Routes
app.use('/api', apiRoutes);

// Timeout scheduler
const startTimeoutScheduler = () => {
  const checkInterval = 30000; // Check every 30 seconds
  
  setInterval(async () => {
    try {
      const expiredRequests = await helpRequestService.getExpiredRequests();
      
      for (const request of expiredRequests) {
        console.log(`⏰ Help request ${request.id} timed out`);
        
        // Mark as unresolved
        await helpRequestService.markUnresolved(request.id);
        
        // Notify customer with fallback message
        if (request.agentSessionId) {
          await liveKitService.notifyCustomer(
            request.agentSessionId, 
            "I apologize, but I wasn't able to get an answer for you right now. Please try calling back later or visit our website for more information."
          );
        }
        
        // Notify supervisor UI
        const updatedRequest = await helpRequestService.getHelpRequest(request.id);
        notificationService.notifyHelpRequestUpdated(updatedRequest);
      }
    } catch (error) {
      console.error('Error in timeout scheduler:', error);
    }
  }, checkInterval);
  
  console.log('⏰ Timeout scheduler started');
};

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server running on port ${WS_PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`Health check at http://localhost:${PORT}/api/health`);
  
  // Start timeout scheduler
  startTimeoutScheduler();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});
