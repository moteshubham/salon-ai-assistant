import { KnowledgeEntry } from '../models';
import { db } from '../config/firebase';

export class KnowledgeBaseService {
  private collection = db.collection('knowledge_base');

  normalizeQuestion(question: string): string {
    return question
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  async addEntry(entry: Omit<KnowledgeEntry, 'id' | 'createdAt'>): Promise<KnowledgeEntry> {
    const knowledgeEntry: KnowledgeEntry = {
      ...entry,
      id: '',
      createdAt: new Date(),
    };

    const docRef = await this.collection.add(knowledgeEntry);
    knowledgeEntry.id = docRef.id;

    // Update the document with the generated ID
    await docRef.update({ id: docRef.id });

    return knowledgeEntry;
  }

  async findMatch(question: string): Promise<KnowledgeEntry | null> {
    const normalizedQuestion = this.normalizeQuestion(question);
    
    // First try exact match
    const exactMatch = await this.collection
      .where('questionKey', '==', normalizedQuestion)
      .limit(1)
      .get();

    if (!exactMatch.empty) {
      const doc = exactMatch.docs[0];
      return { id: doc.id, ...doc.data() } as KnowledgeEntry;
    }

    // Then try fuzzy matching (simple contains check)
    const snapshot = await this.collection.get();
    const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KnowledgeEntry));

    for (const entry of entries) {
      if (this.calculateSimilarity(normalizedQuestion, entry.questionKey) > 0.7) {
        return entry;
      }
    }

    return null;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    
    let matches = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2) {
          matches++;
          break;
        }
      }
    }
    
    return matches / Math.max(words1.length, words2.length);
  }

  async getAllEntries(): Promise<KnowledgeEntry[]> {
    const snapshot = await this.collection
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KnowledgeEntry));
  }

  async deleteEntry(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }
}
