import { HelpRequest, KnowledgeEntry } from '../models';
import { db } from '../config/firebase';

export class HelpRequestService {
  private collection = db.collection('help_requests');

  async createHelpRequest(request: Omit<HelpRequest, 'id' | 'createdAt' | 'timeoutAt'>): Promise<HelpRequest> {
    const timeoutAt = new Date(Date.now() + parseInt(process.env.HELPREQUEST_TIMEOUT || '600000'));
    
    const helpRequest: HelpRequest = {
      ...request,
      id: '',
      createdAt: new Date(),
      timeoutAt,
    };

    const docRef = await this.collection.add(helpRequest);
    helpRequest.id = docRef.id;

    // Update the document with the generated ID
    await docRef.update({ id: docRef.id });

    return helpRequest;
  }

  async getHelpRequest(id: string): Promise<HelpRequest | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() } as HelpRequest;
  }

  async getPendingRequests(): Promise<HelpRequest[]> {
    const snapshot = await this.collection
      .where('status', '==', 'PENDING')
      .orderBy('createdAt', 'asc')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HelpRequest));
  }

  async getAllRequests(): Promise<HelpRequest[]> {
    const snapshot = await this.collection
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HelpRequest));
  }

  async markResolved(id: string, supervisorResponse: string): Promise<void> {
    await this.collection.doc(id).update({
      status: 'RESOLVED',
      supervisorResponse,
      resolvedAt: new Date(),
    });
  }

  async markUnresolved(id: string): Promise<void> {
    await this.collection.doc(id).update({
      status: 'UNRESOLVED',
      resolvedAt: new Date(),
    });
  }

  async getExpiredRequests(): Promise<HelpRequest[]> {
    const now = new Date();
    const snapshot = await this.collection
      .where('status', '==', 'PENDING')
      .where('timeoutAt', '<=', now)
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HelpRequest));
  }
}
