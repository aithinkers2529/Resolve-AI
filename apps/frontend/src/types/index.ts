export type DisputeStatus = 'SUBMITTED' | 'New' | 'Analyzing' | 'WAITING_FOR_ADMIN' | 'Fraud_Hold' | 'Policy_Validation' | 'Requires_Review' | 'Approved' | 'Rejected' | 'Resolved' | 'RESOLVED';

export interface Dispute {
  id: string;
  title?: string;
  customerName: string;
  customerEmail: string;
  orderId: string;
  claimAmount: number;
  complaintText: string;
  status: DisputeStatus;
  fraudScore: number;
  fraudRiskLevel?: string;
  policyNotes?: string;
  evidenceUrls: string[];
  resolutionAction?: string;
  resolutionReason?: string;
  createdAt: string;
  updatedAt: string;
  category?: string;
  confidence?: number;
}

export interface AgentLog {
  id: string;
  disputeId: string;
  agentName: string;
  actionTaken: string;
  logDetails: string;
  createdAt: string;
}

export interface Message {
  id: string;
  sender: 'customer' | 'agent' | 'system';
  text: string;
  timestamp: string;
}
