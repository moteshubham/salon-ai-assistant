import React, { useState } from 'react';
import type { HelpRequest } from '../types';

interface RequestListProps {
  requests: HelpRequest[];
  onRespond: (requestId: string, response: string) => void;
  onRefresh: () => void;
}

const RequestList: React.FC<RequestListProps> = ({ requests, onRespond, onRefresh }) => {
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
  const [responseText, setResponseText] = useState('');

  const handleRespond = () => {
    if (selectedRequest && responseText.trim()) {
      onRespond(selectedRequest.id, responseText);
      setResponseText('');
      setSelectedRequest(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'UNRESOLVED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const resolvedRequests = requests.filter(r => r.status === 'RESOLVED');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Help Requests</h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Refresh
        </button>
      </div>

      {/* Pending Requests */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Pending Requests ({pendingRequests.length})
        </h3>
        <div className="bg-white shadow rounded-lg">
          {pendingRequests.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No pending requests
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pendingRequests.map((request) => (
                <div key={request.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(request.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-900 font-medium mb-2">{request.question}</p>
                      <div className="text-sm text-gray-600">
                        <p><strong>Customer:</strong> {request.customerInfo.name || 'Unknown'}</p>
                        {request.customerInfo.phone && (
                          <p><strong>Phone:</strong> {request.customerInfo.phone}</p>
                        )}
                        {request.customerInfo.email && (
                          <p><strong>Email:</strong> {request.customerInfo.email}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Respond
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resolved Requests */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Resolved Requests ({resolvedRequests.length})
        </h3>
        <div className="bg-white shadow rounded-lg">
          {resolvedRequests.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No resolved requests
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {resolvedRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(request.resolvedAt || request.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium mb-2">{request.question}</p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Response:</strong> {request.supervisorResponse}
                  </p>
                  <div className="text-sm text-gray-500">
                    <p><strong>Customer:</strong> {request.customerInfo.name || 'Unknown'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Response Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Respond to Request
              </h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Question:</strong> {selectedRequest.question}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Customer:</strong> {selectedRequest.customerInfo.name || 'Unknown'}
                </p>
              </div>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Enter your response..."
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setResponseText('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRespond}
                  disabled={!responseText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Response
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestList;
