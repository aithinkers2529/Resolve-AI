export type DisputeStatus = 'New' | 'Analyzing' | 'Fraud_Hold' | 'Policy_Validation' | 'Requires_Review' | 'Approved' | 'Rejected' | 'Resolved';

export interface Dispute {
  id: string;
  customerName: string;
  customerEmail: string;
  orderId: string;
  claimAmount: number;
  complaintText: string;
  status: DisputeStatus;
  fraudScore: number;
  policyNotes?: string;
  evidenceUrls: string[];
  resolutionAction?: string;
  createdAt: string;
  updatedAt: string;
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
