import axios from 'axios';
import { Dispute, AgentLog } from '../types';

const client = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  getDisputes: async (): Promise<Dispute[]> => {
    const res = await client.get('/disputes');
    return res.data;
  },
  getDispute: async (id: string): Promise<Dispute> => {
    const res = await client.get(`/disputes/${id}`);
    return res.data;
  },
  createDispute: async (data: Partial<Dispute>): Promise<Dispute> => {
    const res = await client.post('/disputes', data);
    return res.data;
  },
  approveDispute: async (id: string): Promise<Dispute> => {
    const res = await client.post(`/disputes/${id}/approve`);
    return res.data;
  },
  rejectDispute: async (id: string): Promise<Dispute> => {
    const res = await client.post(`/disputes/${id}/reject`);
    return res.data;
  },
  getAgentLogs: async (disputeId: string): Promise<AgentLog[]> => {
    const res = await client.get(`/disputes/${disputeId}/logs`);
    return res.data;
  },
};
export default api;
