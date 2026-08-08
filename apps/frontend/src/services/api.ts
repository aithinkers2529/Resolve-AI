import axios from 'axios';
import { Dispute, AgentLog } from '../types';

const baseUrl = ((import.meta as any).env?.VITE_API_BASE_URL || '') + '/api/v1';

const client = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT access token into all outgoing requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function normalizeDispute(item: any): Dispute {
  if (!item) return {} as Dispute;
  return {
    id: String(item.id || ''),
    title: item.title || item.category || 'Dispute Claim',
    customerName: item.customerName || item.customer_name || 'Customer',
    customerEmail: item.customerEmail || item.customer_email || '',
    orderId: item.orderId || item.order_id || 'N/A',
    claimAmount: typeof item.claimAmount === 'number' ? item.claimAmount : parseFloat(item.claim_amount || '0') || 0,
    complaintText: item.complaintText || item.complaint_text || '',
    status: item.status || 'SUBMITTED',
    fraudScore: typeof item.fraudScore === 'number' ? item.fraudScore : parseFloat(item.fraud_score || '0') || 0,
    fraudRiskLevel: item.fraudRiskLevel || item.fraud_risk_level || (parseFloat(item.fraud_score || '0') >= 0.6 ? 'High' : 'Low'),
    policyNotes: item.policyNotes || item.policy_notes || '',
    evidenceUrls: Array.isArray(item.evidenceUrls) ? item.evidenceUrls : Array.isArray(item.evidence_urls) ? item.evidence_urls : [],
    resolutionAction: item.resolutionAction || item.resolution_action || 'Pending Investigation',
    resolutionReason: item.resolutionReason || item.resolution_reason || '',
    createdAt: item.createdAt || item.created_at || new Date().toISOString(),
    updatedAt: item.updatedAt || item.updated_at || new Date().toISOString(),
    category: item.category || 'General Dispute',
    confidence: typeof item.confidence === 'number' ? item.confidence : parseFloat(item.confidence || '0.95') || 0.95,
  };
}

export const api = {
  // Authentication
  login: async (email: string, password: string) => {
    const res = await client.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (data: any) => {
    const res = await client.post('/auth/register', data);
    return res.data;
  },
  getMe: async () => {
    const res = await client.get('/auth/me');
    return res.data;
  },

  // Disputes & Cases
  getDisputes: async (): Promise<Dispute[]> => {
    const res = await client.get('/disputes');
    const items = Array.isArray(res.data) ? res.data : res.data?.items || res.data?.disputes || [];
    return items.map(normalizeDispute);
  },
  getDispute: async (id: string): Promise<Dispute> => {
    const res = await client.get(`/disputes/${id}`);
    return normalizeDispute(res.data);
  },
  createDispute: async (data: any): Promise<any> => {
    const res = await client.post('/disputes', data);
    return normalizeDispute(res.data);
  },
  approveDispute: async (id: string): Promise<Dispute> => {
    const res = await client.post(`/cases/${id}/approve`);
    return normalizeDispute(res.data);
  },
  rejectDispute: async (id: string): Promise<Dispute> => {
    const res = await client.post(`/cases/${id}/reject`);
    return normalizeDispute(res.data);
  },
  investigateDispute: async (id: string): Promise<Dispute> => {
    const res = await client.post(`/cases/${id}/investigate`);
    return normalizeDispute(res.data);
  },
  getAgentLogs: async (disputeId: string): Promise<AgentLog[]> => {
    const res = await client.get(`/cases/${disputeId}/trace`);
    return res.data.map((item: any) => ({
      id: String(item.id),
      disputeId: item.dispute_id,
      agentName: item.agent_name,
      actionTaken: item.action_taken,
      logDetails: item.log_details,
      createdAt: item.created_at || new Date().toISOString(),
    }));
  },
  getDecisionPassport: async (id: string): Promise<any> => {
    const res = await client.get(`/cases/${id}/decision-passport`);
    return res.data;
  },
  getSystemHealth: async (): Promise<any> => {
    const res = await client.get('/admin/system/health');
    return res.data;
  },
  getSystemErrors: async (): Promise<any> => {
    const res = await client.get('/admin/system/errors');
    return res.data;
  },

  // Agentic Support Assistant Chat
  chatWithAssistant: async (message: string, caseId?: string, orderId?: string, evidenceUrl?: string): Promise<any> => {
    const res = await client.post('/assistant/chat', {
      message,
      case_id: caseId,
      order_id: orderId,
      evidence_url: evidenceUrl
    });
    return res.data;
  },

  // File Upload
  uploadFile: async (file: File): Promise<{ file_url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await client.post('/disputes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  // Timeline
  getDisputeTimeline: async (id: string): Promise<any> => {
    const res = await client.get(`/disputes/${id}/timeline`);
    return res.data;
  },

  // Appeals & Human Escalation
  submitAppeal: async (caseId: string, reason: string): Promise<any> => {
    const res = await client.post(`/escalations/${caseId}/appeal`, { reason });
    return res.data;
  },
  requestHumanSupport: async (caseId: string): Promise<any> => {
    const res = await client.post(`/escalations/${caseId}/escalate`);
    return res.data;
  },
};

export default api;

