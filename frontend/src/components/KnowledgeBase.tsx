import React, { useState } from 'react';
import type { KnowledgeEntry } from '../types';

interface KnowledgeBaseProps {
  entries: KnowledgeEntry[];
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ entries, onDelete, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);

  const filteredEntries = entries.filter(entry =>
    entry.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.answerText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Knowledge Base</h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search knowledge base..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Knowledge Entries */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Knowledge Entries ({filteredEntries.length})
          </h3>
        </div>
        
        {filteredEntries.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {searchTerm ? 'No entries match your search' : 'No knowledge entries yet'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(entry.confidence)}`}>
                        {Math.round(entry.confidence * 100)}% confidence
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(entry.createdAt)}
                      </span>
                    </div>
                    <div className="mb-3">
                      <p className="text-gray-900 font-medium mb-1">
                        <strong>Question:</strong> {entry.questionText}
                      </p>
                      <p className="text-gray-700">
                        <strong>Answer:</strong> {entry.answerText}
                      </p>
                    </div>
                    {entry.sourceHelpRequestId && (
                      <p className="text-sm text-gray-500">
                        <strong>Source:</strong> Help Request #{entry.sourceHelpRequestId.slice(-8)}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => setSelectedEntry(entry)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onDelete(entry.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Knowledge Entry Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {selectedEntry.questionText}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Answer
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {selectedEntry.answerText}
                  </p>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Confidence: {Math.round(selectedEntry.confidence * 100)}%</span>
                  <span>Created: {formatDate(selectedEntry.createdAt)}</span>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
