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

export interface OrderItem {
  id: string;
  customer_id: string;
  product_id?: string;
  product_name: string;
  order_amount: number;
  currency?: string;
  status: string;
  delivery_date?: string;
  created_at?: string;
}

export interface WalletData {
  id: string;
  customer_id: string;
  customer_email: string;
  balance: number;
  pending_refunds: number;
  total_refunded: number;
  currency: string;
  transactions: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  order_id?: string;
  dispute_id?: string;
  created_at?: string;
}

export interface NotificationItem {
  id: string;
  customer_id: string;
  customer_email: string;
  dispute_id?: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at?: string;
}

export interface ReplacementData {
  id: string;
  dispute_id: string;
  order_id: string;
  product_name: string;
  tracking_number: string;
  carrier: string;
  status: string;
  delivery_address?: string;
  estimated_delivery?: string;
  created_at?: string;
}

export interface DecisionPassportData {
  id: string;
  dispute_id: string;
  decision: string;
  confidence_score: number;
  fraud_risk_score: number;
  verified_evidence: any;
  policy_matched: string;
  policy_clause: string;
  customer_context: any;
  alternatives_evaluated: any[];
  final_reasoning: string;
  execution_proof: any;
  created_at?: string;
}

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

  // Customer Orders
  getOrders: async (): Promise<OrderItem[]> => {
    const res = await client.get('/orders');
    return Array.isArray(res.data) ? res.data : [];
  },
  getOrder: async (id: string): Promise<OrderItem> => {
    const res = await client.get(`/orders/${id}`);
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
  createDispute: async (data: any): Promise<Dispute> => {
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
  requestEvidence: async (id: string): Promise<Dispute> => {
    const res = await client.post(`/cases/${id}/request-evidence`);
    return normalizeDispute(res.data);
  },
  investigateDispute: async (id: string): Promise<Dispute> => {
    const res = await client.post(`/cases/${id}/investigate`);
    return normalizeDispute(res.data);
  },
  getAgentLogs: async (disputeId: string): Promise<AgentLog[]> => {
    const res = await client.get(`/cases/${disputeId}/trace`);
    return (res.data || []).map((item: any) => ({
      id: String(item.id || Math.random()),
      disputeId: item.dispute_id || disputeId,
      agentName: item.agent_name || item.agent || 'Agent',
      actionTaken: item.action_taken || item.step || 'Processed',
      logDetails: item.log_details || item.details || '',
      createdAt: item.created_at || new Date().toISOString(),
    }));
  },
  getDecisionPassport: async (id: string): Promise<DecisionPassportData> => {
    const res = await client.get(`/disputes/${id}/decision-passport`);
    return res.data;
  },

  // Digital Wallet & Transactions
  getWallet: async (): Promise<WalletData> => {
    const res = await client.get('/wallet');
    return res.data;
  },
  getTransactions: async (): Promise<TransactionItem[]> => {
    const res = await client.get('/wallet/transactions');
    return Array.isArray(res.data) ? res.data : [];
  },

  // Notifications
  getNotifications: async (): Promise<NotificationItem[]> => {
    const res = await client.get('/notifications');
    return Array.isArray(res.data) ? res.data : [];
  },
  markNotificationRead: async (id: string): Promise<any> => {
    const res = await client.post(`/notifications/${id}/read`);
    return res.data;
  },
  markAllNotificationsRead: async (): Promise<any> => {
    const res = await client.post('/notifications/read-all');
    return res.data;
  },

  // Replacements
  getReplacement: async (disputeId: string): Promise<ReplacementData> => {
    const res = await client.get(`/replacements/${disputeId}`);
    return res.data;
  },

  // Admin Health & Errors
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
