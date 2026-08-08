import React, { useState, useEffect, useRef } from 'react';
import { 
  BrainCircuit, 
  Search, 
  AlertOctagon, 
  FileText, 
  CheckCircle, 
  XCircle, 
  User, 
  PlusCircle,
  Upload,
  ShieldAlert,
  RefreshCw,
  LogOut,
  ChevronRight,
  Image as ImageIcon,
  Trash2,
  Send,
  Sparkles,
  ExternalLink,
  Clock,
  Layers,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { Dispute, DisputeStatus } from './types';
import { api } from './services/api';

function intToPct(num: any): string {
  if (num === undefined || num === null) return "95%";
  const floatVal = typeof num === 'number' ? num : parseFloat(num);
  if (isNaN(floatVal)) return "95%";
  if (floatVal <= 1.0) {
    return `${(floatVal * 100).toFixed(0)}%`;
  }
  return `${floatVal.toFixed(0)}%`;
}

export default function App() {
  // Navigation & Routing state
  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  // Layout & Navigation active tab
  const [adminFilter, setAdminFilter] = useState<'ALL' | 'WAITING_FOR_ADMIN' | 'HIGH_RISK' | 'RESOLVED' | 'REJECTED'>('ALL');

  // Authentication form states
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuccessState, setLoginSuccessState] = useState(false);
  const [shakeCardState, setShakeCardState] = useState(false);

  // Dispute Creation Form states
  const [createTitle, setCreateTitle] = useState("");
  const [wizardCategory, setWizardCategory] = useState("Damaged Product");
  const [wizardText, setWizardText] = useState("");
  const [wizardClaimAmount, setWizardClaimAmount] = useState("450.00");
  const [wizardOrderId, setWizardOrderId] = useState("ORD-58493-29");
  
  // Real Upload State
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreviewUrl, setEvidencePreviewUrl] = useState<string>("");
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("");

  const [wizardLoading, setWizardLoading] = useState(false);

  // Disputes state
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [casesLoading, setCasesLoading] = useState(false);

  // Agentic Chatbot State
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    sender: 'user' | 'agent';
    text: string;
    timestamp: string;
    agentActivity?: any[];
    actionCard?: any;
    dispute?: any;
    imagePreviewUrl?: string;
  }>>([
    {
      id: 'init-1',
      sender: 'agent',
      text: "Hello! I am ResolveAI Assistant. I am an autonomous agentic dispute resolver. You can describe your problem, provide your order ID, or upload evidence photos right here in our chat to resolve your issue.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionCard: {
        type: 'QuickActions',
        actions: ['Report Damaged Item', 'Track Case DISP-9842', 'Talk to Human Support']
      }
    }
  ]);
  const [chatInputText, setChatInputText] = useState('');
  const [chatOrderId] = useState('');
  const [chatEvidenceFile, setChatEvidenceFile] = useState<File | null>(null);
  const [chatEvidencePreview, setChatEvidencePreview] = useState<string>('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Real-time Agent logs & passport
  const [agentLogs, setAgentLogs] = useState<any[]>([]);

  // Initialize: Load token and user if saved
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
    }
  }, []);

  // Sync route based on hash or state
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setCurrentRoute(hash);
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (route: string) => {
    setCurrentRoute(route);
    window.location.hash = route;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch disputes
  const fetchDisputes = async () => {
    if (!token) return;
    try {
      setCasesLoading(true);
      
      let data: any[] = [];
      try {
        data = await api.getDisputes();
      } catch (err) {
        console.warn("API getDisputes failed, falling back to mock data if demo.", err);
      }
      
      if (data.length === 0 && (token === 'demo-mock-token-sarah' || token === 'demo-mock-token-admin')) {
        // Mock Demo Data
        data = [
          {
            id: 'DISP-9842',
            title: 'Damaged iPhone 15 Pro Max',
            category: 'Damaged Product',
            amount: 1199.00,
            claimAmount: 1199.00,
            customerName: 'Sarah Jenkins',
            customerEmail: 'sarah.j@example.com',
            status: 'WAITING_FOR_ADMIN',
            fraudScore: 0.85,
            fraudRiskLevel: 'HIGH',
            confidence: 0.92,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            orderId: 'ORD-773-102',
            complaintText: "The package arrived completely crushed. The phone screen is shattered and the back glass is cracked. This was supposed to be a gift and now I'm extremely frustrated. I need a full refund immediately.",
            evidenceUrls: ['https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=800'],
            policyNotes: 'Electronics Refund Policy Sec 4.1: High-value electronics damaged in transit require manual investigation of carrier tracking and unboxing weight.',
            risk_signals: [
               { signal_name: 'Velocity Risk', score: 0.9, details: 'User filed 3 damaged item claims in last 30 days.' },
               { signal_name: 'Address Match', score: 0.2, details: 'Delivery address differs from billing address.' }
            ]
          },
          {
            id: 'DISP-8831',
            title: 'Wrong Item Received (Shoes)',
            category: 'Incorrect Item',
            amount: 145.50,
            claimAmount: 145.50,
            customerName: 'Alex Mercer',
            customerEmail: 'alex.m@example.com',
            status: 'Approved',
            fraudScore: 0.12,
            fraudRiskLevel: 'LOW',
            confidence: 0.98,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            orderId: 'ORD-551-908',
            complaintText: "I ordered the running shoes in size 10, but I received sandals in size 8. Please refund me so I can place the correct order.",
            evidenceUrls: ['https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&q=80&w=800'],
            policyNotes: 'Apparel Exchange Policy Sec 2.1: Incorrect items are eligible for immediate automated refund upon visual verification of incorrect SKU.',
            risk_signals: []
          },
          {
            id: 'DISP-7729',
            title: 'Lost Package - Premium Watch',
            category: 'Did Not Receive',
            amount: 450.00,
            claimAmount: 450.00,
            customerName: 'Jordan Lee',
            customerEmail: 'jlee99@example.com',
            status: 'Analyzing',
            fraudScore: 0.45,
            fraudRiskLevel: 'MEDIUM',
            confidence: 0.88,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
            orderId: 'ORD-112-444',
            complaintText: "Tracking says delivered, but I never received the package. I've checked with my neighbors and the leasing office. Nothing.",
            evidenceUrls: [],
            policyNotes: 'Carrier Claims Policy Sec 3.3: "Delivered but not received" claims over $200 require carrier geofence verification and signature check.',
            risk_signals: [
               { signal_name: 'Carrier Geotag', score: 0.6, details: 'Carrier marked delivered 1.2 miles from destination coordinate.' }
            ]
          }
        ];
      }

      setDisputes(data);
      if (data.length > 0 && !selectedDispute) {
        setSelectedDispute(data[0]);
      }
    } catch (err) {
      console.error("Failed to load disputes", err);
    } finally {
      setCasesLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDisputes();
    }
  }, [token]);

  // Load selected dispute timeline & details
  useEffect(() => {
    const loadDisputeDetails = async () => {
      if (!selectedDispute || !token) return;
      try {
        let logs: any[] = [];
        let timeline: any = { events: [] };
        
        try {
          logs = await api.getAgentLogs(selectedDispute.id);
          timeline = await api.getDisputeTimeline(selectedDispute.id);
        } catch (err) {
          console.warn("API getDisputeTimeline failed, falling back to mock data if demo.");
        }

        if (logs.length === 0 && (token === 'demo-mock-token-sarah' || token === 'demo-mock-token-admin')) {
           logs = [
             { id: 1, action: "OCR Extracted", details: "Found shattered screen patterns on iPhone 15 Pro Max image.", timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString() },
             { id: 2, action: "Fraud Engine API", details: "Triggered High Velocity rule for account.", timestamp: new Date(Date.now() - 1000 * 60 * 48).toISOString() }
           ];
           timeline.events = [
             { action_taken: "Customer Submitted Claim", agent_name: "System", log_details: "Claim received with 1 image.", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
             { action_taken: "AI Evidence Analysis", agent_name: "VisionAgent", log_details: "Detected structural damage (Confidence: 0.92).", timestamp: new Date(Date.now() - 1000 * 60 * 59).toISOString() },
             { action_taken: "Fraud Policy Check", agent_name: "RiskAgent", log_details: "Flagged High Risk: Velocity > 3 claims/30d.", timestamp: new Date(Date.now() - 1000 * 60 * 58).toISOString() },
             { action_taken: "Escalated to Human Admin", agent_name: "RouterAgent", log_details: "Placed in WAITING_FOR_ADMIN queue due to risk score 0.85.", timestamp: new Date(Date.now() - 1000 * 60 * 57).toISOString() }
           ];
        }

        setAgentLogs(logs);
        setTimelineEvents(timeline.events || []);
      } catch (err) {
        console.error("Error loading case details", err);
      }
    };
    loadDisputeDetails();
  }, [selectedDispute, token]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Auth Handlers
  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthError('Email and password are required.');
      setShakeCardState(true);
      setTimeout(() => setShakeCardState(false), 500);
      toast.error("Please enter email and password.", {
        style: { border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: '13px', borderRadius: '12px' }
      });
      return;
    }
    try {
      setAuthLoading(true);
      setAuthError('');
      let data;
      try {
        data = await api.login(authEmail, authPassword);
      } catch (backendErr) {
        if (authEmail.includes('sarah') || authEmail.includes('customer') || authPassword === 'password123') {
          data = {
            access_token: 'demo-mock-token-sarah',
            user: { id: 'usr-1', email: authEmail || 'sarah.j@example.com', full_name: 'Sarah Jenkins', role: 'CUSTOMER' }
          };
        } else {
          throw backendErr;
        }
      }

      // Smooth 1s delay for loading animation
      await new Promise(resolve => setTimeout(resolve, 1000));

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      
      // Success State & Confetti
      setLoginSuccessState(true);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      toast.success("Login Successful! Welcome back.", {
        style: { border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#16A34A', fontSize: '13px', borderRadius: '12px' }
      });

      setTimeout(() => {
        setLoginSuccessState(false);
        navigateTo('/user/dashboard');
      }, 1000);
    } catch (err: any) {
      setAuthLoading(false);
      setAuthPassword('');
      setAuthError(err.response?.data?.detail || 'Invalid Email or Password.');
      setShakeCardState(true);
      setTimeout(() => setShakeCardState(false), 500);
      toast.error("Invalid Credentials. Please check your email and password.", {
        style: { border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: '13px', borderRadius: '12px' }
      });
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthError('Email and password are required.');
      setShakeCardState(true);
      setTimeout(() => setShakeCardState(false), 500);
      toast.error("Please enter admin credentials.", {
        style: { border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: '13px', borderRadius: '12px' }
      });
      return;
    }
    try {
      setAuthLoading(true);
      setAuthError('');
      let data;
      try {
        data = await api.login(authEmail, authPassword);
      } catch (backendErr) {
        if (authEmail.includes('admin') || authPassword === 'password123') {
          data = {
            access_token: 'demo-mock-token-admin',
            user: { id: 'adm-1', email: authEmail || 'admin@resolveai.demo', full_name: 'System Administrator', role: 'ADMIN' }
          };
        } else {
          throw backendErr;
        }
      }
      
      const role = str(data.user.role).toUpperCase();
      if (role !== 'ADMIN' && role !== 'SUPPORT_AGENT' && role !== 'RESOLUTION_MANAGER' && role !== 'FRAUD_ANALYST') {
        setAuthLoading(false);
        setAuthPassword('');
        setAuthError('Access Denied: User account is not authorized for Admin access.');
        setShakeCardState(true);
        setTimeout(() => setShakeCardState(false), 500);
        toast.error("Access Denied for Admin Portal", {
          style: { border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: '13px', borderRadius: '12px' }
        });
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);

      setLoginSuccessState(true);
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      toast.success("Admin Authentication Successful!", {
        style: { border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#16A34A', fontSize: '13px', borderRadius: '12px' }
      });

      setTimeout(() => {
        setLoginSuccessState(false);
        navigateTo('/admin/dashboard');
      }, 1000);
    } catch (err: any) {
      setAuthLoading(false);
      setAuthPassword('');
      setAuthError(err.response?.data?.detail || 'Invalid Admin Credentials.');
      setShakeCardState(true);
      setTimeout(() => setShakeCardState(false), 500);
      toast.error("Invalid Admin Credentials.", {
        style: { border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: '13px', borderRadius: '12px' }
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authName || !authEmail || !authPassword) {
      setAuthError('Full Name, email, and password are required.');
      return;
    }
    try {
      setAuthLoading(true);
      setAuthError('');
      await api.register({
        email: authEmail,
        password: authPassword,
        full_name: authName
      });
      toast.success('Account created successfully! You can now log in.', {
        style: { border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#16A34A', fontSize: '13px', borderRadius: '12px' }
      });
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
      setTimeout(() => navigateTo('/user/login'), 1200);
    } catch (err: any) {
      setAuthError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setDisputes([]);
    setSelectedDispute(null);
    setAgentLogs([]);
    navigateTo('/');
  };

  const handleQuickLogin = (email: string, targetRoute: string = '/user/login') => {
    setAuthEmail(email);
    setAuthPassword('password123');
    setAuthError('');
    navigateTo(targetRoute);
  };

  // Real Image Upload Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'pdf'];
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    if (!validExtensions.includes(fileExt)) {
      setUploadError(`Invalid file format (.${fileExt}). Allowed formats: JPG, PNG, WEBP, GIF, PDF.`);
      setEvidenceFile(null);
      setEvidencePreviewUrl('');
      return;
    }

    setUploadError('');
    setEvidenceFile(file);

    // Create local preview URL
    const localUrl = URL.createObjectURL(file);
    setEvidencePreviewUrl(localUrl);

    // Automatically upload file to backend
    try {
      setUploadingEvidence(true);
      const res = await api.uploadFile(file);
      setUploadedFileUrl(res.file_url);
    } catch (err: any) {
      console.error("Upload failed", err);
      setUploadError(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setUploadingEvidence(false);
    }
  };

  const handleRemoveFile = () => {
    setEvidenceFile(null);
    setEvidencePreviewUrl('');
    setUploadedFileUrl('');
    setUploadError('');
  };

  // Dispute Submission
  const handleCreateDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wizardText.trim()) {
      setUploadError("Please enter complaint details.");
      return;
    }

    try {
      setWizardLoading(true);
      setUploadError('');

      // Finalize upload if not completed
      let finalUrl = uploadedFileUrl;
      if (!finalUrl && evidenceFile) {
        const uploadRes = await api.uploadFile(evidenceFile);
        finalUrl = uploadRes.file_url;
      }

      const payload = {
        title: createTitle || `${wizardCategory} Claim for ${wizardOrderId}`,
        order_id: wizardOrderId,
        claim_amount: parseFloat(wizardClaimAmount) || 150.00,
        complaint_text: wizardText,
        category: wizardCategory,
        evidence_urls: finalUrl ? [finalUrl] : ["/uploads/demo_item.jpg"],
        customer_name: user?.full_name || "Customer"
      };

      let newDispute: Dispute;
      try {
        newDispute = await api.createDispute(payload);
      } catch (backendErr) {
        newDispute = {
          id: `DISP-${Math.floor(1000 + Math.random() * 9000)}`,
          title: payload.title,
          orderId: payload.order_id,
          claimAmount: payload.claim_amount,
          complaintText: payload.complaint_text,
          category: payload.category,
          evidenceUrls: payload.evidence_urls,
          customerName: payload.customer_name,
          customerEmail: user?.email || 'sarah.j@example.com',
          status: 'WAITING_FOR_ADMIN',
          fraudScore: 0.15,
          fraudRiskLevel: 'Low',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setDisputes(prev => [newDispute, ...prev]);
      }
      
      // Refresh disputes list
      setSelectedDispute(newDispute);

      // Navigate to dispute details page
      navigateTo(`/disputes/${newDispute.id}`);

      // Reset form
      setCreateTitle("");
      setWizardText("");
      setEvidenceFile(null);
      setEvidencePreviewUrl("");
      setUploadedFileUrl("");
    } catch (err: any) {
      console.error("Dispute creation error", err);
      setUploadError(err.response?.data?.detail || "Failed to create dispute. Please try again.");
    } finally {
      setWizardLoading(false);
    }
  };

  // Admin Approval & Rejection Actions
  const handleAdminDecision = async (disputeId: string, action: 'approve' | 'reject') => {
    try {
      let updated: Dispute | null = null;
      try {
        if (action === 'approve') {
          updated = await api.approveDispute(disputeId);
        } else {
          updated = await api.rejectDispute(disputeId);
        }
      } catch (err) {
        console.warn(`API ${action} failed, applying locally for demo mode`, err);
      }
      
      if (!updated && (token === 'demo-mock-token-sarah' || token === 'demo-mock-token-admin')) {
         const newStatus: DisputeStatus = action === 'approve' ? 'Approved' : 'Rejected';
         const localDisputes = disputes.map(d => 
           d.id === disputeId ? { ...d, status: newStatus } : d
         );
         setDisputes(localDisputes);
         const targetDispute = localDisputes.find(d => d.id === disputeId);
         if (targetDispute) {
           updated = targetDispute;
         }
      }

      if (updated) {
        setSelectedDispute(updated);
        toast.success(`Dispute ${action === 'approve' ? 'Approved' : 'Rejected'} successfully!`, {
          style: { border: action === 'approve' ? '1px solid #BBF7D0' : '1px solid #FECACA', background: action === 'approve' ? '#F0FDF4' : '#FEF2F2', color: action === 'approve' ? '#16A34A' : '#DC2626', fontSize: '13px', borderRadius: '12px' }
        });
      }

      if (token !== 'demo-mock-token-admin' && token !== 'demo-mock-token-sarah') {
         await fetchDisputes();
      }
    } catch (err) {
      console.error(`Failed to ${action} dispute`, err);
      toast.error(`Failed to ${action} dispute`, {
        style: { border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: '13px', borderRadius: '12px' }
      });
    }
  };

  // Agentic Chatbot Upload Handler
  const handleChatFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setChatEvidenceFile(file);
    setChatEvidencePreview(URL.createObjectURL(file));
  };

  // Agentic Chatbot Message Submission
  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInputText.trim() && !chatEvidenceFile) return;

    let chatUploadUrl = '';
    if (chatEvidenceFile) {
      try {
        const uploadRes = await api.uploadFile(chatEvidenceFile);
        chatUploadUrl = uploadRes.file_url;
      } catch (err) {
        console.error("Chat upload failed", err);
      }
    }

    const userMessageText = chatInputText;
    const userMsgObj = {
      id: `usr-${Date.now()}`,
      sender: 'user' as const,
      text: userMessageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imagePreviewUrl: chatEvidencePreview || undefined
    };

    setChatMessages(prev => [...prev, userMsgObj]);
    setChatInputText('');
    setChatEvidenceFile(null);
    setChatEvidencePreview('');
    setChatLoading(true);

    try {
      const res = await api.chatWithAssistant(userMessageText, undefined, chatOrderId || undefined, chatUploadUrl || undefined);
      
      const agentMsgObj = {
        id: `agt-${Date.now()}`,
        sender: 'agent' as const,
        text: res.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentActivity: res.agent_activity,
        actionCard: res.action_card,
        dispute: res.dispute
      };

      setChatMessages(prev => [...prev, agentMsgObj]);
      if (res.dispute) {
        fetchDisputes();
      }
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'agent' as const,
          text: "I encountered an issue processing your request. Please ensure you are logged in or try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const getStatusColor = (status: DisputeStatus | string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]';
      case 'Analyzing': return 'bg-[#F0F9FF] text-[#0284C7] border-[#BAE6FD]';
      case 'WAITING_FOR_ADMIN':
      case 'Requires_Review': return 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A] animate-pulse';
      case 'Approved':
      case 'RESOLVED':
      case 'Resolved': return 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]';
      case 'Rejected': return 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]';
      default: return 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]';
    }
  };

  function str(val: any): string {
    return String(val || '');
  }

  // Filtered disputes for Admin view
  const filteredAdminDisputes = disputes.filter(d => {
    const searchMatch = d.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        d.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    if (!searchMatch) return false;

    if (adminFilter === 'WAITING_FOR_ADMIN') {
      return d.status === 'WAITING_FOR_ADMIN' || d.status === 'Requires_Review';
    }
    if (adminFilter === 'HIGH_RISK') {
      return d.fraudScore >= 0.6 || d.fraudRiskLevel === 'High';
    }
    if (adminFilter === 'RESOLVED') {
      return d.status === 'Approved' || d.status === 'RESOLVED' || d.status === 'Resolved';
    }
    if (adminFilter === 'REJECTED') {
      return d.status === 'Rejected';
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-enterprise-radial text-[#0F172A] flex flex-col font-sans selection:bg-[#5B5EF7] selection:text-white relative overflow-hidden">
      
      {/* ── GLOBAL ENTERPRISE AI BACKGROUND LAYERS (SHARED ACROSS ALL ROUTES) ── */}
      {/* ── GLOBAL ENTERPRISE AI BACKGROUND LAYERS (CLEAN MINIMAL SAAS STYLE) ── */}
      {/* LAYER 7 – ULTRA-SOFT TOP GLOW */}
      <div className="fixed top-[-20%] left-[-10%] w-[120%] h-[900px] bg-gradient-to-br from-white/60 via-[#F6F8FF]/40 to-transparent blur-[180px] opacity-40 pointer-events-none z-0 transform -rotate-12" />

      {/* LAYER 1 – SOFT LAVENDER & PASTEL BLUE BLURRED CIRCLES (2-3% OPACITY) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-50px] left-[-80px] w-[350px] h-[350px] bg-[#F3F0FF]/30 rounded-full blur-[160px] animate-blob-1" />
        <div className="absolute top-[12%] right-[-60px] w-[350px] h-[350px] bg-[#EAF2FF]/35 rounded-full blur-[160px] animate-blob-2" />
        <div className="absolute top-[40%] left-[-40px] w-[300px] h-[300px] bg-[#E8E5FF]/25 rounded-full blur-[160px] animate-blob-1" />
        <div className="absolute top-[55%] right-[-40px] w-[300px] h-[300px] bg-[#EEF4FF]/30 rounded-full blur-[160px] animate-blob-2" />
        <div className="absolute bottom-[15%] left-[5%] w-[350px] h-[350px] bg-[#F3F0FF]/25 rounded-full blur-[160px] animate-blob-1" />
        <div className="absolute bottom-[-30px] right-[5%] w-[350px] h-[350px] bg-[#EAF2FF]/30 rounded-full blur-[160px] animate-blob-2" />
      </div>

      {/* LAYER 2 – TRANSLUCENT PASTEL BUBBLES (OPACITY 8-12%) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {[
          { top: '5%', left: '4%', size: 180, type: 'large-bubble', dur: '26s', delay: '0s', color1: 'rgba(255,255,255,0.98)', color2: 'rgba(246,248,255,0.12)' },
          { top: '12%', left: '86%', size: 220, type: 'glow-bubble', dur: '28s', delay: '-3s', color1: 'rgba(255,255,255,0.98)', color2: 'rgba(243,240,255,0.10)' },
          { top: '22%', left: '10%', size: 90, type: 'medium-bubble', dur: '22s', delay: '-7s', color1: 'rgba(255,255,255,0.98)', color2: 'rgba(234,242,255,0.12)' },
          { top: '32%', left: '90%', size: 110, type: 'medium-bubble', dur: '25s', delay: '-2s', color1: 'rgba(255,255,255,0.98)', color2: 'rgba(238,244,255,0.10)' },
          { top: '42%', left: '5%', size: 240, type: 'glow-bubble', dur: '30s', delay: '-5s', color1: 'rgba(255,255,255,0.98)', color2: 'rgba(232,229,255,0.08)' },
          { top: '52%', left: '88%', size: 60, type: 'small-bubble', dur: '20s', delay: '-1s', color1: 'rgba(255,255,255,0.98)', color2: 'rgba(243,240,255,0.12)' },
          { top: '62%', left: '12%', size: 130, type: 'medium-bubble', dur: '27s', delay: '-8s', color1: 'rgba(255,255,255,0.98)', color2: 'rgba(234,242,255,0.11)' },
          { top: '72%', left: '92%', size: 80, type: 'small-bubble', dur: '23s', delay: '-4s', color1: 'rgba(255,255,255,0.98)', color2: 'rgba(246,248,255,0.12)' },
          { top: '82%', left: '6%', size: 200, type: 'large-bubble', dur: '29s', delay: '-6s', color1: 'rgba(255,255,255,0.98)', color2: 'rgba(232,229,255,0.10)' },
          { top: '90%', left: '84%', size: 100, type: 'medium-bubble', dur: '24s', delay: '-10s', color1: 'rgba(255,255,255,0.98)', color2: 'rgba(238,244,255,0.10)' },
          { top: '10%', left: '42%', size: 110, type: 'medium-bubble', dur: '21s', delay: '-2.5s', color1: 'rgba(255,255,255,0.98)', color2: 'rgba(234,242,255,0.12)' },
          { top: '38%', left: '46%', size: 50, type: 'small-bubble', dur: '24s', delay: '-9s', color1: 'rgba(255,255,255,0.98)', color2: 'rgba(246,248,255,0.12)' },
          { top: '68%', left: '50%', size: 170, type: 'large-bubble', dur: '26s', delay: '-3.5s', color1: 'rgba(255,255,255,0.98)', color2: 'rgba(243,240,255,0.09)' },
          { top: '86%', left: '40%', size: 85, type: 'medium-bubble', dur: '22s', delay: '-7.5s', color1: 'rgba(255,255,255,0.98)', color2: 'rgba(234,242,255,0.11)' },
          { top: '18%', left: '76%', size: 160, type: 'large-bubble', dur: '27s', delay: '-11s', color1: 'rgba(255,255,255,0.98)', color2: 'rgba(246,248,255,0.10)' },
          { top: '48%', left: '20%', size: 45, type: 'small-bubble', dur: '19s', delay: '-1.5s', color1: 'rgba(255,255,255,0.98)', color2: 'rgba(243,240,255,0.12)' }
        ].map((b, i) => (
          <div 
            key={i}
            className={`absolute rounded-full animate-bubble-float pointer-events-none ${b.type}`}
            style={{
              top: b.top,
              left: b.left,
              width: `${b.size}px`,
              height: `${b.size}px`,
              background: `radial-gradient(circle, ${b.color1} 0%, ${b.color2} 55%, rgba(234,242,255,0.04) 100%)`,
              animationDuration: b.dur,
              animationDelay: b.delay
            }}
          />
        ))}
      </div>

      {/* LAYER 3 – SUBTLE AI NETWORK (12% OPACITY) */}
      <div className="fixed inset-0 pointer-events-none z-0 hidden md:block opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <line x1="5%" y1="12%" x2="25%" y2="25%" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="25%" y1="25%" x2="15%" y2="55%" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="85%" y1="18%" x2="70%" y2="35%" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="70%" y1="35%" x2="90%" y2="60%" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="10%" y1="70%" x2="30%" y2="85%" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="75%" y1="75%" x2="95%" y2="88%" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
        <div className="absolute top-[12%] left-[5%] w-2 h-2 bg-[#94A3B8] rounded-full animate-node-pulse opacity-25" style={{ animationDelay: '0s' }} />
        <div className="absolute top-[25%] left-[25%] w-2 h-2 bg-[#94A3B8] rounded-full animate-node-pulse opacity-25" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[55%] left-[15%] w-2 h-2 bg-[#94A3B8] rounded-full animate-node-pulse opacity-25" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[18%] right-[15%] w-2 h-2 bg-[#94A3B8] rounded-full animate-node-pulse opacity-25" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[35%] right-[30%] w-2 h-2 bg-[#94A3B8] rounded-full animate-node-pulse opacity-25" style={{ animationDelay: '2.5s' }} />
        <div className="absolute top-[60%] right-[10%] w-2 h-2 bg-[#94A3B8] rounded-full animate-node-pulse opacity-25" style={{ animationDelay: '0.8s' }} />
        <div className="absolute top-[70%] left-[10%] w-2 h-2 bg-[#94A3B8] rounded-full animate-node-pulse opacity-25" style={{ animationDelay: '1.8s' }} />
        <div className="absolute top-[85%] left-[30%] w-2 h-2 bg-[#94A3B8] rounded-full animate-node-pulse opacity-25" style={{ animationDelay: '2.8s' }} />
      </div>

      {/* LAYER 4 – TINY GLOWING PARTICLES */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {[
          { top: '5%', left: '8%', size: 3, color: '#FFFFFF', delay: '0s', dur: '4s' },
          { top: '14%', left: '22%', size: 3, color: '#EAF2FF', delay: '-1s', dur: '5s' },
          { top: '22%', left: '6%', size: 2, color: '#F3F0FF', delay: '-2.5s', dur: '3.5s' },
          { top: '32%', left: '16%', size: 3, color: '#FFFFFF', delay: '-0.8s', dur: '4.5s' },
          { top: '44%', left: '9%', size: 2, color: '#E8E5FF', delay: '-3.1s', dur: '3.8s' },
          { top: '54%', left: '20%', size: 3, color: '#EAF2FF', delay: '-1.5s', dur: '4.2s' },
          { top: '65%', left: '5%', size: 2, color: '#FFFFFF', delay: '-2.2s', dur: '3.6s' },
          { top: '75%', left: '14%', size: 3, color: '#F3F0FF', delay: '-0.5s', dur: '4.8s' },
          { top: '85%', left: '22%', size: 2, color: '#E8E5FF', delay: '-3.8s', dur: '3.4s' },
          { top: '94%', left: '10%', size: 3, color: '#FFFFFF', delay: '-1.8s', dur: '4.1s' }
        ].map((p, i) => (
          <div 
            key={i}
            className="absolute rounded-full animate-particle-twinkle pointer-events-none opacity-25"
            style={{
              top: p.top,
              left: p.left,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              animationDelay: p.delay,
              animationDuration: p.dur
            }}
          />
        ))}
      </div>

      {/* LAYER 5 – SUBTLE MESH WAVE PATTERN NEAR BOTTOM (2% OPACITY) */}
      <div className="fixed bottom-0 left-0 w-96 h-96 opacity-[0.02] blur-[30px] pointer-events-none z-0 text-[#E2E8F0]">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path fill="currentColor" d="M42.7,-62.9C53.9,-54.1,60.6,-40.5,65.8,-26.4C71,-12.3,74.7,2.3,71.2,15.7C67.7,29.1,57,41.3,44.7,50.7C32.4,60.1,18.5,66.7,3.6,61.7C-11.3,56.7,-27.2,40.1,-38.9,29.5C-50.6,18.9,-58.1,14.3,-62.1,6.9C-66.1,-0.5,-66.6,-10.7,-62.4,-20.5C-58.2,-30.3,-49.3,-39.7,-38.7,-48.7C-28.1,-57.7,-15.8,-66.3,-0.9,-65.1C14,-63.8,28.1,-52.7,42.7,-62.9Z" transform="translate(100 100)" />
        </svg>
      </div>
      <div className="fixed bottom-0 right-0 w-96 h-96 opacity-[0.02] blur-[30px] pointer-events-none z-0 text-[#E0E7FF]">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path fill="currentColor" d="M47.7,-58.2C60.2,-48.9,67.7,-33.2,71.1,-17.1C74.5,-1,73.8,15.5,66.7,29.3C59.6,43.1,46.1,54.2,30.8,61.9C15.5,69.6,-1.6,73.9,-17.7,70.5C-33.8,67.1,-48.9,56,-58.7,41.8C-68.5,27.6,-73,10.3,-71,-5.8C-69,-21.9,-60.5,-36.8,-48.7,-46.4C-36.9,-56,-21.8,-60.3,-4.8,-53.7C12.2,-47.1,24.4,-57.5,47.7,-58.2Z" transform="translate(100 100)" />
        </svg>
      </div>
      
      {/* ─── GLOBAL FLOATING ENTERPRISE NAVBAR (76% WIDTH, 68PX, CSS GRID auto/1fr/auto) ─── */}
      <motion.header 
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-5 z-50 flex justify-center px-4 mb-6"
      >
        <div className="navbar-glass">
          
          {/* ── LEFT: LOGO + SUBTITLE (MATCHING PHOTO) ── */}
          <div 
            tabIndex={0}
            role="button"
            aria-label="Resolve AI Homepage"
            onClick={() => { navigateTo('/'); setMobileMenuOpen(false); }} 
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { navigateTo('/'); setMobileMenuOpen(false); } }}
            className="navbar-logo-section focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-offset-2 flex items-center gap-3"
          >
            {/* Logo Icon Box */}
            <div className="w-10 h-10 bg-gradient-to-tr from-[#4F46E5] to-[#6366F1] rounded-2xl flex items-center justify-center text-white shadow-md shadow-[#4F46E5]/25 flex-shrink-0 transition-transform duration-300 hover:scale-105">
              <BrainCircuit className="h-5 w-5" />
            </div>
            {/* Title + Subtitle */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="text-[22px] font-extrabold tracking-tight text-[#0F172A] font-['Plus_Jakarta_Sans'] leading-none">
                  Resolve-AI
                </span>
                <span className="inline-flex items-center px-2 py-0.5 bg-[#EEF2FF] border border-[#E0E7FF] rounded-full text-[10px] font-mono font-bold text-[#4F46E5]">
                  MVP v1.0
                </span>
              </div>
              <span className="text-[10px] text-[#64748B] font-medium tracking-tight mt-0.5 hidden xl:block">
                Autonomous & Human-in-the-Loop Dispute Intelligence
              </span>
            </div>
          </div>


          {/* ── CENTER: CAPSULE PILL NAV MENU (MATCHING PHOTO) ── */}
          <nav className="navbar-center hidden lg:flex">
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="nav-capsule-container"
            >
              {[
                { label: 'Home', route: '/', hasIcon: false },
                { label: 'User Dashboard', route: '/user/dashboard', hasIcon: false },
                { label: 'Admin Portal', route: '/admin', hasIcon: false },
                { label: 'AI Chatbot', route: '/chatbot', hasIcon: true }
              ].map((item) => {
                const isActive = item.route === '/' 
                  ? currentRoute === '/' 
                  : item.route === '/admin' 
                    ? (currentRoute === '/admin' || currentRoute.startsWith('/admin/dashboard')) 
                    : item.route === '/chatbot'
                      ? (currentRoute === '/chatbot' || currentRoute === '/agent')
                      : (currentRoute === '/user/dashboard' || currentRoute === '/user/create-dispute' || currentRoute.startsWith('/disputes'));

                return (
                  <button 
                    key={item.label}
                    onClick={() => navigateTo(item.route)} 
                    className={`nav-capsule-item${isActive ? ' active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.hasIcon && <Sparkles className="h-3.5 w-3.5 shrink-0" />}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </motion.div>
          </nav>

          {/* ── RIGHT: BUTTONS (auto column) ── */}
          <div className="navbar-right">
            {token && user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-[#0F172A] whitespace-nowrap">{user.full_name || user.email}</p>
                  <span className="text-[9px] text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded-md font-mono font-bold uppercase">{user.role}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="btn-user-login flex items-center gap-1.5 border border-[#E2E8F0] rounded-xl text-sm"
                >
                  <LogOut className="h-4 w-4" /> Log Out
                </button>
              </div>
            ) : (
              <>
                {/* User Login — minimal text link style */}
                <button 
                  onClick={() => navigateTo('/user/login')} 
                  className={`btn-user-login hidden sm:block${currentRoute === '/user/login' ? ' active' : ''}`}
                >
                  User Login
                </button>

                {/* Admin Sign In — gradient pill button */}
                <motion.button 
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigateTo('/admin/login')} 
                  className="btn-admin-signin focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-offset-2"
                >
                  <User className="h-[15px] w-[15px]" />
                  <span className="hidden sm:inline">Admin Sign In</span>
                  <span className="sm:hidden">Admin</span>
                </motion.button>
              </>
            )}

            {/* Hamburger — visible only below lg breakpoint */}
            <button 
              aria-label="Toggle Navigation Drawer"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#475569] hover:text-[#4F46E5] hover:bg-[rgba(99,102,241,0.06)] rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* MOBILE ANIMATED SIDE DRAWER (SLIDES FROM LEFT WITH BLURRED BACKGROUND) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 xl:hidden"
            />

            {/* Left Side Drawer */}
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-white/95 backdrop-blur-2xl z-50 p-6 flex flex-col justify-between shadow-2xl border-r border-[#EEF2FF] xl:hidden"
            >
              <div className="space-y-8">
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-[#4F46E5] to-[#6366F1] rounded-xl flex items-center justify-center text-white">
                      <BrainCircuit className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-extrabold text-[#0F172A] font-['Plus_Jakarta_Sans']">Resolve-AI</span>
                  </div>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-[#64748B] hover:text-[#0F172A] rounded-xl"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Staggered Navigation Items */}
                <nav className="flex flex-col gap-2">
                  {[
                    { label: 'Home', route: '/' },
                    { label: 'User Dashboard', route: '/user/dashboard' },
                    { label: 'Admin Portal', route: '/admin' },
                    { label: 'AI Chatbot', route: '/chatbot' },
                    { label: 'User Login', route: '/user/login' },
                    { label: 'Admin Sign In', route: '/admin/login' }
                  ].map((item, idx) => {
                    const isActive = currentRoute === item.route;
                    return (
                      <motion.button 
                        key={item.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => { navigateTo(item.route); setMobileMenuOpen(false); }}
                        className={`w-full text-left px-4 py-3 rounded-2xl text-base font-semibold transition-all flex items-center justify-between ${
                          isActive 
                            ? 'bg-[#EEF2FF] text-[#4F46E5] font-bold border border-[#C7D2FE]' 
                            : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                        }`}
                      >
                        <span>{item.label}</span>
                        <ChevronRight className="h-4 w-4 opacity-60" />
                      </motion.button>
                    );
                  })}
                </nav>
              </div>

              {/* Drawer Bottom Badge */}
              <div className="pt-6 border-t border-[#F1F5F9] text-center">
                <span className="px-3 py-1 bg-[#EEF2FF] border border-[#E0E7FF] rounded-full text-xs font-bold text-[#4F46E5]">
                  Enterprise Platform v0.1.0
                </span>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ─── ROUTER VIEWS ─── */}

      {/* 1. LANDING PAGE */}
      {currentRoute === '/' && (
        <div className="flex-1 flex flex-col justify-center mt-20 relative overflow-hidden">
          


          {/* LAYER 4 - 60 TINY PARTICLES (2px-5px white/purple/blue fading in/out) */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            {[
              { top: '5%', left: '12%', size: 3, color: '#FFFFFF', delay: '0s', dur: '4s' },
              { top: '15%', left: '25%', size: 4, color: '#6366F1', delay: '-1s', dur: '5s' },
              { top: '25%', left: '8%', size: 2, color: '#3B82F6', delay: '-2.5s', dur: '3.5s' },
              { top: '35%', left: '18%', size: 5, color: '#FFFFFF', delay: '-0.8s', dur: '4.5s' },
              { top: '48%', left: '10%', size: 3, color: '#A78BFA', delay: '-3.1s', dur: '3.8s' },
              { top: '58%', left: '22%', size: 4, color: '#6366F1', delay: '-1.5s', dur: '4.2s' },
              { top: '68%', left: '6%', size: 2, color: '#3B82F6', delay: '-2.2s', dur: '3.6s' },
              { top: '78%', left: '15%', size: 5, color: '#FFFFFF', delay: '-0.5s', dur: '4.8s' },
              { top: '88%', left: '24%', size: 3, color: '#A78BFA', delay: '-3.8s', dur: '3.4s' },
              { top: '95%', left: '12%', size: 4, color: '#6366F1', delay: '-1.8s', dur: '4.1s' },
              
              { top: '8%', left: '88%', size: 4, color: '#3B82F6', delay: '-2.9s', dur: '3.9s' },
              { top: '18%', left: '78%', size: 2, color: '#FFFFFF', delay: '-0.3s', dur: '4.4s' },
              { top: '28%', left: '92%', size: 5, color: '#A78BFA', delay: '-1.2s', dur: '4.7s' },
              { top: '38%', left: '82%', size: 3, color: '#6366F1', delay: '-3.4s', dur: '3.7s' },
              { top: '48%', left: '95%', size: 4, color: '#3B82F6', delay: '-0.6s', dur: '4.3s' },
              { top: '58%', left: '75%', size: 2, color: '#FFFFFF', delay: '-2.8s', dur: '3.3s' },
              { top: '68%', left: '85%', size: 5, color: '#A78BFA', delay: '-1.9s', dur: '4.9s' },
              { top: '78%', left: '94%', size: 3, color: '#6366F1', delay: '-0.2s', dur: '3.9s' },
              { top: '88%', left: '80%', size: 4, color: '#3B82F6', delay: '-3.3s', dur: '4.6s' },
              { top: '96%', left: '86%', size: 2, color: '#FFFFFF', delay: '-1.6s', dur: '4.0s' },

              { top: '12%', left: '48%', size: 3, color: '#A78BFA', delay: '-2.1s', dur: '3.8s' },
              { top: '22%', left: '55%', size: 4, color: '#6366F1', delay: '-0.7s', dur: '4.1s' },
              { top: '32%', left: '42%', size: 2, color: '#3B82F6', delay: '-3.6s', dur: '3.5s' },
              { top: '42%', left: '60%', size: 5, color: '#FFFFFF', delay: '-1.4s', dur: '4.8s' },
              { top: '52%', left: '38%', size: 3, color: '#A78BFA', delay: '-2.3s', dur: '3.7s' },
              { top: '62%', left: '62%', size: 4, color: '#6366F1', delay: '-0.9s', dur: '4.4s' },
              { top: '72%', left: '45%', size: 2, color: '#3B82F6', delay: '-3.0s', dur: '3.9s' },
              { top: '82%', left: '58%', size: 5, color: '#FFFFFF', delay: '-1.7s', dur: '4.2s' },
              { top: '92%', left: '50%', size: 3, color: '#A78BFA', delay: '-2.7s', dur: '3.6s' },
              { top: '3%', left: '35%', size: 4, color: '#6366F1', delay: '-0.4s', dur: '4.5s' },

              { top: '16%', left: '32%', size: 2, color: '#3B82F6', delay: '-2.0s', dur: '3.4s' },
              { top: '26%', left: '68%', size: 5, color: '#FFFFFF', delay: '-1.1s', dur: '4.6s' },
              { top: '36%', left: '28%', size: 3, color: '#A78BFA', delay: '-3.7s', dur: '4.0s' },
              { top: '46%', left: '72%', size: 4, color: '#6366F1', delay: '-0.5s', dur: '4.3s' },
              { top: '56%', left: '30%', size: 2, color: '#3B82F6', delay: '-2.4s', dur: '3.8s' },
              { top: '66%', left: '66%', size: 5, color: '#FFFFFF', delay: '-1.3s', dur: '4.7s' },
              { top: '76%', left: '26%', size: 3, color: '#A78BFA', delay: '-3.2s', dur: '3.9s' },
              { top: '86%', left: '70%', size: 4, color: '#6366F1', delay: '-0.8s', dur: '4.1s' },
              { top: '94%', left: '32%', size: 2, color: '#3B82F6', delay: '-2.6s', dur: '3.5s' },
              { top: '2%', left: '65%', size: 5, color: '#FFFFFF', delay: '-1.5s', dur: '4.8s' },

              { top: '10%', left: '20%', size: 3, color: '#A78BFA', delay: '-3.5s', dur: '4.0s' },
              { top: '20%', left: '80%', size: 4, color: '#6366F1', delay: '-0.1s', dur: '4.2s' },
              { top: '30%', left: '15%', size: 2, color: '#3B82F6', delay: '-2.2s', dur: '3.6s' },
              { top: '40%', left: '85%', size: 5, color: '#FFFFFF', delay: '-1.6s', dur: '4.9s' },
              { top: '50%', left: '25%', size: 3, color: '#A78BFA', delay: '-3.9s', dur: '3.7s' },
              { top: '60%', left: '75%', size: 4, color: '#6366F1', delay: '-0.3s', dur: '4.5s' },
              { top: '70%', left: '20%', size: 2, color: '#3B82F6', delay: '-2.8s', dur: '3.3s' },
              { top: '80%', left: '82%', size: 5, color: '#FFFFFF', delay: '-1.0s', dur: '4.6s' },
              { top: '90%', left: '16%', size: 3, color: '#A78BFA', delay: '-3.3s', dur: '3.8s' },
              { top: '98%', left: '60%', size: 4, color: '#6366F1', delay: '-1.7s', dur: '4.4s' }
            ].map((p, i) => (
              <div 
                key={i}
                className="absolute rounded-full animate-sparkle"
                style={{
                  top: p.top,
                  left: p.left,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  backgroundColor: p.color,
                  boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                  animationDuration: p.dur,
                  animationDelay: p.delay
                }}
              />
            ))}
          </div>

          {/* LAYER 6 - BOTTOM SOFT PASTEL GLOW TRANSITION */}
          <div className="absolute bottom-0 left-0 right-0 h-96 pointer-events-none opacity-5 blur-[120px] z-0 overflow-hidden bg-gradient-to-t from-[#EEF4FF] via-transparent to-transparent" />

          <motion.section 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative px-6 py-12 lg:py-20 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-20 items-center z-10"
          >
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#EEF2FF] border border-[#E0E7FF] text-[#4F46E5] rounded-full text-[12px] font-semibold shadow-sm">
                <Sparkles className="h-4 w-4 text-[#3B82F6]" /> Autonomous Dispute Resolution Platform
              </div>
              
              <h2 className="text-[48px] sm:text-[56px] lg:text-[72px] font-extrabold text-[#0F172A] tracking-[-2px] leading-[1.05] font-['Plus_Jakarta_Sans']">
                Autonomous Dispute Resolution.<br/>
                <span className="text-heading-gradient font-extrabold text-[48px] sm:text-[56px] lg:text-[72px]">
                  Backed by Multi-Agent AI.
                </span>
              </h2>
              
              <p className="text-[#64748B] text-[20px] max-w-[600px] mx-auto lg:mx-0 leading-[1.8] font-normal">
                Submit claims with real evidence image uploads, automated multi-signal risk evaluations, policy citations, human approval gates, and interactive conversational assistance.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <motion.button 
                  whileHover={{ scale: 1.02, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigateTo('/user/dashboard')}
                  className="btn-primary-gradient w-full sm:w-auto px-8 py-4 text-white font-bold text-[16px] flex items-center justify-center gap-2 shadow-[0_20px_40px_rgba(79,70,229,0.25)]"
                >
                  Go to User Dashboard <ChevronRight className="h-4 w-4" />
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigateTo('/agent')}
                  className="w-full sm:w-auto px-8 py-4 bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#0F172A] border border-[#E5E7EB] font-semibold rounded-[14px] text-[16px] shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-4 w-4 text-[#3B82F6]" /> Open Agentic Chatbot
                </motion.button>
              </div>
            </div>

            {/* RIGHT SIDE WORKFLOW PANEL WITH LAYER 3 AI NETWORK (10px GLOWING NODES & 1px DASHED LINES AT 18% OPACITY) */}
            <div className="lg:col-span-5 relative">
              
              {/* LAYER 3 - AI NETWORK BEHIND WORKFLOW CARD */}
              <div className="absolute inset-[-40px] pointer-events-none z-0 hidden sm:block">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <line x1="10%" y1="15%" x2="40%" y2="25%" stroke="#DCE7FF" strokeWidth="1" strokeDasharray="4 4" opacity="0.18" />
                  <line x1="40%" y1="25%" x2="85%" y2="20%" stroke="#DCE7FF" strokeWidth="1" strokeDasharray="4 4" opacity="0.18" />
                  <line x1="85%" y1="20%" x2="70%" y2="60%" stroke="#DCE7FF" strokeWidth="1" strokeDasharray="4 4" opacity="0.18" />
                  <line x1="70%" y1="60%" x2="20%" y2="75%" stroke="#DCE7FF" strokeWidth="1" strokeDasharray="4 4" opacity="0.18" />
                  <line x1="20%" y1="75%" x2="10%" y2="15%" stroke="#DCE7FF" strokeWidth="1" strokeDasharray="4 4" opacity="0.18" />
                </svg>

                {/* 10px Pulsing Nodes */}
                <div className="absolute top-[15%] left-[10%] w-2.5 h-2.5 bg-[#4F46E5] rounded-full animate-node-pulse shadow-lg shadow-[#4F46E5]" />
                <div className="absolute top-[25%] left-[40%] w-2.5 h-2.5 bg-[#3B82F6] rounded-full animate-node-pulse shadow-lg shadow-[#3B82F6]" style={{ animationDelay: '1s' }} />
                <div className="absolute top-[20%] right-[15%] w-2.5 h-2.5 bg-[#A78BFA] rounded-full animate-node-pulse shadow-lg shadow-[#A78BFA]" style={{ animationDelay: '2s' }} />
                <div className="absolute top-[60%] right-[30%] w-2.5 h-2.5 bg-[#60A5FA] rounded-full animate-node-pulse shadow-lg shadow-[#60A5FA]" style={{ animationDelay: '1.5s' }} />
                <div className="absolute top-[75%] left-[20%] w-2.5 h-2.5 bg-[#6366F1] rounded-full animate-node-pulse shadow-lg shadow-[#6366F1]" style={{ animationDelay: '2.5s' }} />
              </div>

              {/* WORKFLOW CARD (SHADOW 0 25px 60px rgba(99,102,241,.12), HOVER LIFT 5px) */}
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="card-workflow-shadow p-6 sm:p-8 space-y-6 relative z-10"
              >
                <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-[#0F172A] text-lg font-['Plus_Jakarta_Sans']">Resolution Workflow</h3>
                    <p className="text-xs text-[#64748B]">Autonomous Dispute Processing Lifecycle</p>
                  </div>
                  <span className="px-3 py-1 bg-[#EEF2FF] border border-[#E0E7FF] text-[#4F46E5] rounded-full text-xs font-semibold">
                    Real-time AI
                  </span>
                </div>

                <div className="space-y-3.5">
                  <div className="bg-[#FAF9FE] p-4 rounded-xl border border-[#EEF2FF] flex items-center justify-between transition-all hover:border-[#C7D2FE]">
                    <div>
                      <p className="text-[#4F46E5] text-[12px] uppercase font-semibold tracking-wider">1. Intake & Signal Analysis</p>
                      <p className="text-[#0F172A] text-[15px] font-semibold mt-0.5">Evidence Validation & Parsing</p>
                    </div>
                    <div className="p-2.5 bg-[#EEF2FF] text-[#4F46E5] rounded-xl">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="text-center text-[#94A3B8] text-xs py-0.5">↓</div>

                  <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] flex items-center justify-between transition-all hover:border-[#CBD5E1]">
                    <div>
                      <p className="text-[#3B82F6] text-[12px] uppercase font-semibold tracking-wider">2. Multi-Agent Evaluation</p>
                      <p className="text-[#0F172A] text-[15px] font-semibold mt-0.5">Risk Score & Policy Match</p>
                    </div>
                    <div className="p-2.5 bg-[#EFF6FF] text-[#3B82F6] rounded-xl">
                      <BrainCircuit className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="text-center text-[#94A3B8] text-xs py-0.5">↓</div>

                  <div className="bg-[#F0FDF4] p-4 rounded-xl border border-[#DCFCE7] flex items-center justify-between transition-all hover:border-[#BBF7D0]">
                    <div>
                      <p className="text-[#166534] text-[12px] uppercase font-semibold tracking-wider">3. Database Resolution</p>
                      <p className="text-[#0F172A] text-[15px] font-semibold mt-0.5">Status: RESOLVED / APPROVED</p>
                    </div>
                    <div className="p-2.5 bg-[#DCFCE7] text-[#22C55E] rounded-xl">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.section>
        </div>
      )}

      {/* 2. AUTHENTICATION PAGES (560PX ENTERPRISE ADMIN / USER LOGIN PLATFORM) */}
      {(currentRoute === '/user/login' || currentRoute === '/user/register' || currentRoute === '/admin/login' || currentRoute === '/login') && (
        <div 
          onMouseMove={(e) => {
            const container = e.currentTarget;
            const rect = container.getBoundingClientRect();
            const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
            const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
            container.style.setProperty('--parallax-x', `${(x * 5).toFixed(1)}px`);
            container.style.setProperty('--parallax-y', `${(y * 5).toFixed(1)}px`);
          }}
          className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-6 relative overflow-hidden bg-gradient-to-b from-[#FCFCFE] via-[#F8FAFF] to-[#EEF4FF]"
        >
          
          {/* Toaster Container for Notifications */}
          <Toaster position="top-right" reverseOrder={false} />



          {/* BACKGROUND LAYER 2: AI NETWORK (8px BLUE NODES WITH 1px DASHED CONNECTORS) */}
          <div className="absolute inset-0 pointer-events-none z-0 hidden md:block">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <line x1="10%" y1="18%" x2="24%" y2="32%" stroke="#DCE7FF" strokeWidth="1" strokeDasharray="4 4" opacity="0.25" />
              <line x1="24%" y1="32%" x2="16%" y2="62%" stroke="#DCE7FF" strokeWidth="1" strokeDasharray="4 4" opacity="0.25" />
              <line x1="16%" y1="62%" x2="28%" y2="82%" stroke="#DCE7FF" strokeWidth="1" strokeDasharray="4 4" opacity="0.25" />
              
              <line x1="90%" y1="16%" x2="76%" y2="38%" stroke="#DCE7FF" strokeWidth="1" strokeDasharray="4 4" opacity="0.25" />
              <line x1="76%" y1="38%" x2="84%" y2="68%" stroke="#DCE7FF" strokeWidth="1" strokeDasharray="4 4" opacity="0.25" />
              <line x1="84%" y1="68%" x2="72%" y2="86%" stroke="#DCE7FF" strokeWidth="1" strokeDasharray="4 4" opacity="0.25" />
            </svg>

            {/* 8px Blue Glowing Nodes (35% opacity) */}
            <div className="absolute top-[18%] left-[10%] w-2 h-2 bg-[#3B82F6] opacity-35 rounded-full animate-node-pulse shadow-md shadow-[#3B82F6]" />
            <div className="absolute top-[32%] left-[24%] w-2 h-2 bg-[#3B82F6] opacity-35 rounded-full animate-node-pulse shadow-md shadow-[#3B82F6]" style={{ animationDelay: '1s' }} />
            <div className="absolute top-[62%] left-[16%] w-2 h-2 bg-[#3B82F6] opacity-35 rounded-full animate-node-pulse shadow-md shadow-[#3B82F6]" style={{ animationDelay: '2s' }} />
            <div className="absolute top-[82%] left-[28%] w-2 h-2 bg-[#3B82F6] opacity-35 rounded-full animate-node-pulse shadow-md shadow-[#3B82F6]" style={{ animationDelay: '1.5s' }} />

            <div className="absolute top-[16%] right-[10%] w-2 h-2 bg-[#3B82F6] opacity-35 rounded-full animate-node-pulse shadow-md shadow-[#3B82F6]" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-[38%] right-[24%] w-2 h-2 bg-[#3B82F6] opacity-35 rounded-full animate-node-pulse shadow-md shadow-[#3B82F6]" style={{ animationDelay: '2.5s' }} />
            <div className="absolute top-[68%] right-[16%] w-2 h-2 bg-[#3B82F6] opacity-35 rounded-full animate-node-pulse shadow-md shadow-[#3B82F6]" style={{ animationDelay: '1.2s' }} />
            <div className="absolute top-[86%] right-[28%] w-2 h-2 bg-[#3B82F6] opacity-35 rounded-full animate-node-pulse shadow-md shadow-[#3B82F6]" style={{ animationDelay: '3s' }} />
          </div>

          {/* BACKGROUND LAYER 3: SPARKLES (3px STARS) */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            {[
              { top: '12%', left: '10%', size: 3, delay: '0s', dur: '3.5s' },
              { top: '26%', left: '20%', size: 3, delay: '-1s', dur: '4.2s' },
              { top: '45%', left: '6%', size: 3, delay: '-2.5s', dur: '3.8s' },
              { top: '68%', left: '12%', size: 3, delay: '-0.8s', dur: '4.5s' },
              { top: '82%', left: '22%', size: 3, delay: '-3.1s', dur: '3.2s' },
              { top: '14%', left: '85%', size: 3, delay: '-1.5s', dur: '4.0s' },
              { top: '38%', left: '92%', size: 3, delay: '-2.2s', dur: '3.6s' },
              { top: '58%', left: '82%', size: 3, delay: '-0.5s', dur: '4.8s' },
              { top: '78%', left: '90%', size: 3, delay: '-3.8s', dur: '3.4s' },
              { top: '86%', left: '76%', size: 3, delay: '-1.8s', dur: '4.1s' }
            ].map((sp, i) => (
              <div 
                key={i}
                className="absolute animate-sparkle text-[#6366F1]"
                style={{
                  top: sp.top,
                  left: sp.left,
                  fontSize: `${sp.size * 4}px`,
                  animationDuration: sp.dur,
                  animationDelay: sp.delay
                }}
              >
                ✦
              </div>
            ))}
          </div>

          {/* BACKGROUND LAYER 4: SOFT PASTEL GLOW BEHIND LOGIN CARD */}
          <div className="absolute bottom-0 left-0 right-0 h-80 pointer-events-none opacity-10 blur-[90px] z-0 overflow-hidden bg-gradient-to-t from-[#EEF4FF] to-transparent" />

          {/* CENTERED 560PX LOGIN CARD (MIN-HEIGHT 720PX, PADDING 48PX, RADIUS 30PX, SHADOW 0 30px 70px rgba(15,23,42,.10)) */}
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={shakeCardState ? { x: [-10, 10, -8, 8, -4, 4, 0] } : { opacity: 1, y: 0, scale: 1 }}
            transition={shakeCardState ? { duration: 0.4 } : { duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-[560px] min-h-[720px] bg-[#FFFFFF] border border-[#EEF2FF] p-12 rounded-[30px] shadow-[0_30px_70px_rgba(15,23,42,0.10)] relative z-10 flex flex-col justify-between overflow-hidden my-6"
          >
            
            <AnimatePresence mode="wait">
              {loginSuccessState ? (
                /* LOGIN SUCCESS TRANSFORMATION CARD */
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-16 space-y-6 flex-1 flex flex-col justify-center items-center"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-24 h-24 bg-[#DCFCE7] border-2 border-[#BBF7D0] rounded-full flex items-center justify-center text-[#16A34A] shadow-xl shadow-[#16A34A]/20"
                  >
                    <CheckCircle className="h-12 w-12" />
                  </motion.div>

                  <div className="space-y-2">
                    <h3 className="text-3xl font-bold text-[#0F172A] font-['Plus_Jakarta_Sans']">Login Successful</h3>
                    <p className="text-sm text-[#64748B]">Redirecting to Dashboard...</p>
                  </div>

                  {/* Smooth Progress Bar */}
                  <div className="w-full max-w-md bg-[#F1F5F9] rounded-full h-2 overflow-hidden mt-4">
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.0, ease: "linear" }}
                      className="bg-gradient-to-r from-[#4F46E5] to-[#22C55E] h-full"
                    />
                  </div>
                </motion.div>
              ) : (
                /* STANDARD ENTERPRISE LOGIN FORM */
                <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8 flex-1 flex flex-col justify-between">
                  
                  {/* Top Logo & Title */}
                  <div className="text-center space-y-4">
                    {/* 72px Purple Rounded Square Icon */}
                    <div className="w-[72px] h-[72px] bg-gradient-to-tr from-[#4F46E5] to-[#6366F1] rounded-[22px] flex items-center justify-center mx-auto text-white shadow-lg shadow-[#4F46E5]/25">
                      <BrainCircuit className="h-9 w-9" />
                    </div>
                    
                    <div className="space-y-1">
                      <h1 className="text-[34px] font-extrabold text-[#0F172A] font-['Plus_Jakarta_Sans'] tracking-tight">Resolve-AI</h1>
                      <p className="text-[15px] text-[#64748B] font-normal">
                        {currentRoute === '/admin/login' ? 'Restricted Admin Authentication Portal' : currentRoute === '/user/register' ? 'Create Customer Account' : 'Autonomous Dispute Resolution Platform'}
                      </p>
                    </div>
                  </div>

                  {/* Error Banner */}
                  {authError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] px-5 py-4 rounded-2xl text-xs flex items-center gap-3 font-medium"
                    >
                      <AlertOctagon className="h-5 w-5 shrink-0 text-[#EF4444]" /> {authError}
                    </motion.div>
                  )}

                  {/* Form Fields (64px Height, 18px Radius) */}
                  <form onSubmit={currentRoute === '/admin/login' ? handleAdminLogin : currentRoute === '/user/register' ? handleRegister : handleUserLogin} className="space-y-5">
                    
                    {currentRoute === '/user/register' && (
                      <div className="space-y-2">
                        <label className="text-xs text-[#0F172A] font-semibold block">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-5 top-5 h-6 w-6 text-[#94A3B8]" />
                          <input 
                            type="text" 
                            disabled={authLoading}
                            placeholder="Sarah Jenkins" 
                            value={authName}
                            onChange={e => setAuthName(e.target.value)}
                            className={`w-full input-login-enterprise pl-14 pr-5 text-[16px] ${authError ? 'input-login-error' : ''}`}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs text-[#0F172A] font-semibold block">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-5 top-5 h-6 w-6 text-[#94A3B8]" />
                        <input 
                          type="email" 
                          disabled={authLoading}
                          placeholder={currentRoute === '/admin/login' ? "admin@resolveai.demo" : "sarah.j@example.com"} 
                          value={authEmail}
                          onChange={e => setAuthEmail(e.target.value)}
                          className={`w-full input-login-enterprise pl-14 pr-5 text-[16px] ${authError ? 'input-login-error' : ''}`}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-[#0F172A] font-semibold block">Password</label>
                        {currentRoute !== '/user/register' && (
                          <button type="button" onClick={() => toast("Contact administrator to reset password", { icon: "🔒" })} className="text-[12px] text-[#4F46E5] font-semibold hover:underline">
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-5 top-5 h-6 w-6 text-[#94A3B8]" />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          disabled={authLoading}
                          placeholder="••••••••" 
                          value={authPassword}
                          onChange={e => setAuthPassword(e.target.value)}
                          className={`w-full input-login-enterprise pl-14 pr-14 text-[16px] ${authError ? 'input-login-error' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-5 top-5 text-[#94A3B8] hover:text-[#0F172A] transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    {/* 64px Height Primary Button (Gradient #4F46E5 → #6366F1, Weight 700, 18px Radius, Hover Lift 3px) */}
                    <motion.button 
                      whileHover={{ scale: authLoading ? 1 : 1.015, y: authLoading ? 0 : -3 }}
                      whileTap={{ scale: authLoading ? 1 : 0.985 }}
                      type="submit" 
                      disabled={authLoading}
                      className="btn-primary-gradient w-full h-[64px] text-white rounded-[18px] text-[18px] font-bold transition-all flex items-center justify-center gap-2.5 shadow-[0_15px_35px_rgba(79,70,229,0.25)]"
                    >
                      {authLoading ? (
                        <>
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          <span>Authenticating...</span>
                        </>
                      ) : currentRoute === '/user/register' ? (
                        'Register Customer Account'
                      ) : currentRoute === '/admin/login' ? (
                        'Authenticate Admin'
                      ) : (
                        'Sign In'
                      )}
                    </motion.button>
                  </form>

                  {/* Demo Quick Accounts */}
                  <div className="border-t border-[#F1F5F9] pt-5 space-y-3">
                    <p className="text-[11px] text-[#94A3B8] uppercase tracking-wider text-center font-extrabold">QUICK DEMO LOGIN ACCOUNTS</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        disabled={authLoading}
                        onClick={() => handleQuickLogin('sarah.j@example.com', '/user/login')}
                        className="p-3 bg-[#FFFFFF] hover:bg-[#EEF2FF] border border-[#E2E8F0] hover:border-[#C7D2FE] rounded-full text-[12px] text-[#0F172A] hover:text-[#4F46E5] font-semibold text-center transition-all shadow-sm"
                      >
                        👤 Sarah (User / Customer)
                      </button>
                      <button 
                        disabled={authLoading}
                        onClick={() => handleQuickLogin('admin@resolveai.demo', '/admin/login')}
                        className="p-3 bg-[#FFFFFF] hover:bg-[#EEF2FF] border border-[#C7D2FE] rounded-full text-[12px] text-[#4F46E5] font-semibold text-center transition-all shadow-sm"
                      >
                        🛡️ Demo Admin User
                      </button>
                    </div>
                  </div>

                  {/* Switch Auth View (Bottom Link) */}
                  <div className="text-center text-xs pt-2">
                    {currentRoute === '/admin/login' ? (
                      <p className="text-[#64748B] text-[13px]">
                        Are you a customer?{' '}
                        <button onClick={() => navigateTo('/user/login')} className="text-[#4F46E5] font-bold hover:underline ml-1">
                          Switch to User Login
                        </button>
                      </p>
                    ) : currentRoute === '/user/register' ? (
                      <p className="text-[#64748B] text-[13px]">
                        Already have an account?{' '}
                        <button onClick={() => navigateTo('/user/login')} className="text-[#4F46E5] font-bold hover:underline ml-1">
                          Sign in here
                        </button>
                      </p>
                    ) : (
                      <p className="text-[#64748B] text-[13px]">
                        Need a new account?{' '}
                        <button onClick={() => navigateTo('/user/register')} className="text-[#4F46E5] font-bold hover:underline ml-1">
                          Register here
                        </button>
                      </p>
                    )}
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>

        </div>
      )}

      {/* 3. USER DASHBOARD & DISPUTE CREATION (`/user/dashboard` or `/user/create-dispute`) */}
      {(currentRoute === '/user/dashboard' || currentRoute === '/user/create-dispute') && (
        <div className="flex-1 min-h-[calc(100vh-100px)] w-full relative overflow-hidden">



          {/* LAYER 3 – AI NETWORK (8px nodes connected with 1px #DCE7FF lines, opacity 15%, slow pulse) */}
          <div className="absolute inset-0 pointer-events-none z-0 hidden md:block opacity-15">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <line x1="5%" y1="12%" x2="25%" y2="25%" stroke="#DCE7FF" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="25%" y1="25%" x2="15%" y2="55%" stroke="#DCE7FF" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="85%" y1="18%" x2="70%" y2="35%" stroke="#DCE7FF" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="70%" y1="35%" x2="90%" y2="60%" stroke="#DCE7FF" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="10%" y1="70%" x2="30%" y2="85%" stroke="#DCE7FF" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="75%" y1="75%" x2="95%" y2="88%" stroke="#DCE7FF" strokeWidth="1" strokeDasharray="4 4" />
            </svg>
            <div className="absolute top-[12%] left-[5%] w-2 h-2 bg-[#6366F1] rounded-full animate-node-pulse shadow-sm shadow-[#6366F1]" style={{ animationDelay: '0s' }} />
            <div className="absolute top-[25%] left-[25%] w-2 h-2 bg-[#3B82F6] rounded-full animate-node-pulse shadow-sm shadow-[#3B82F6]" style={{ animationDelay: '1s' }} />
            <div className="absolute top-[55%] left-[15%] w-2 h-2 bg-[#A78BFA] rounded-full animate-node-pulse shadow-sm shadow-[#A78BFA]" style={{ animationDelay: '2s' }} />
            <div className="absolute top-[18%] right-[15%] w-2 h-2 bg-[#60A5FA] rounded-full animate-node-pulse shadow-sm shadow-[#60A5FA]" style={{ animationDelay: '1.5s' }} />
            <div className="absolute top-[35%] right-[30%] w-2 h-2 bg-[#6366F1] rounded-full animate-node-pulse shadow-sm shadow-[#6366F1]" style={{ animationDelay: '2.5s' }} />
            <div className="absolute top-[60%] right-[10%] w-2 h-2 bg-[#3B82F6] rounded-full animate-node-pulse shadow-sm shadow-[#3B82F6]" style={{ animationDelay: '0.8s' }} />
            <div className="absolute top-[70%] left-[10%] w-2 h-2 bg-[#A78BFA] rounded-full animate-node-pulse shadow-sm shadow-[#A78BFA]" style={{ animationDelay: '1.8s' }} />
            <div className="absolute top-[85%] left-[30%] w-2 h-2 bg-[#60A5FA] rounded-full animate-node-pulse shadow-sm shadow-[#60A5FA]" style={{ animationDelay: '2.8s' }} />
            <div className="absolute top-[75%] right-[25%] w-2 h-2 bg-[#6366F1] rounded-full animate-node-pulse shadow-sm shadow-[#6366F1]" style={{ animationDelay: '1.2s' }} />
            <div className="absolute top-[88%] right-[5%] w-2 h-2 bg-[#3B82F6] rounded-full animate-node-pulse shadow-sm shadow-[#3B82F6]" style={{ animationDelay: '2.2s' }} />
          </div>

          {/* LAYER 4 – PARTICLES (50 tiny 2px-5px white/purple/blue particles fading in/out) */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            {[
              { top: '5%', left: '8%', size: 3, color: '#FFFFFF', delay: '0s', dur: '4s' },
              { top: '14%', left: '22%', size: 4, color: '#6366F1', delay: '-1s', dur: '5s' },
              { top: '22%', left: '6%', size: 2, color: '#3B82F6', delay: '-2.5s', dur: '3.5s' },
              { top: '32%', left: '16%', size: 5, color: '#FFFFFF', delay: '-0.8s', dur: '4.5s' },
              { top: '44%', left: '9%', size: 3, color: '#A78BFA', delay: '-3.1s', dur: '3.8s' },
              { top: '54%', left: '20%', size: 4, color: '#6366F1', delay: '-1.5s', dur: '4.2s' },
              { top: '65%', left: '5%', size: 2, color: '#3B82F6', delay: '-2.2s', dur: '3.6s' },
              { top: '75%', left: '14%', size: 5, color: '#FFFFFF', delay: '-0.5s', dur: '4.8s' },
              { top: '85%', left: '22%', size: 3, color: '#A78BFA', delay: '-3.8s', dur: '3.4s' },
              { top: '94%', left: '10%', size: 4, color: '#6366F1', delay: '-1.8s', dur: '4.1s' },
              { top: '7%', left: '90%', size: 4, color: '#3B82F6', delay: '-2.9s', dur: '3.9s' },
              { top: '16%', left: '80%', size: 2, color: '#FFFFFF', delay: '-0.3s', dur: '4.4s' },
              { top: '26%', left: '94%', size: 5, color: '#A78BFA', delay: '-1.2s', dur: '4.7s' },
              { top: '36%', left: '84%', size: 3, color: '#6366F1', delay: '-3.4s', dur: '3.7s' },
              { top: '46%', left: '96%', size: 4, color: '#3B82F6', delay: '-0.6s', dur: '4.3s' },
              { top: '56%', left: '78%', size: 2, color: '#FFFFFF', delay: '-2.8s', dur: '3.3s' },
              { top: '66%', left: '88%', size: 5, color: '#A78BFA', delay: '-1.9s', dur: '4.9s' },
              { top: '76%', left: '95%', size: 3, color: '#6366F1', delay: '-0.2s', dur: '3.9s' },
              { top: '86%', left: '82%', size: 4, color: '#3B82F6', delay: '-3.3s', dur: '4.6s' },
              { top: '95%', left: '88%', size: 2, color: '#FFFFFF', delay: '-1.6s', dur: '4.0s' },
              { top: '10%', left: '46%', size: 3, color: '#A78BFA', delay: '-2.1s', dur: '3.8s' },
              { top: '20%', left: '53%', size: 4, color: '#6366F1', delay: '-0.7s', dur: '4.1s' },
              { top: '30%', left: '40%', size: 2, color: '#3B82F6', delay: '-3.6s', dur: '3.5s' },
              { top: '40%', left: '58%', size: 5, color: '#FFFFFF', delay: '-1.4s', dur: '4.8s' },
              { top: '50%', left: '36%', size: 3, color: '#A78BFA', delay: '-2.3s', dur: '3.7s' },
              { top: '60%', left: '60%', size: 4, color: '#6366F1', delay: '-0.9s', dur: '4.4s' },
              { top: '70%', left: '43%', size: 2, color: '#3B82F6', delay: '-3.0s', dur: '3.9s' },
              { top: '80%', left: '56%', size: 5, color: '#FFFFFF', delay: '-1.7s', dur: '4.2s' },
              { top: '90%', left: '48%', size: 3, color: '#A78BFA', delay: '-2.7s', dur: '3.6s' },
              { top: '2%', left: '33%', size: 4, color: '#6366F1', delay: '-0.4s', dur: '4.5s' },
              { top: '15%', left: '30%', size: 2, color: '#3B82F6', delay: '-2.0s', dur: '3.4s' },
              { top: '25%', left: '66%', size: 5, color: '#FFFFFF', delay: '-1.1s', dur: '4.6s' },
              { top: '35%', left: '26%', size: 3, color: '#A78BFA', delay: '-3.7s', dur: '4.0s' },
              { top: '45%', left: '70%', size: 4, color: '#6366F1', delay: '-0.5s', dur: '4.3s' },
              { top: '55%', left: '28%', size: 2, color: '#3B82F6', delay: '-2.4s', dur: '3.8s' },
              { top: '65%', left: '64%', size: 5, color: '#FFFFFF', delay: '-1.3s', dur: '4.7s' },
              { top: '75%', left: '24%', size: 3, color: '#A78BFA', delay: '-3.2s', dur: '3.9s' },
              { top: '85%', left: '68%', size: 4, color: '#6366F1', delay: '-0.8s', dur: '4.1s' },
              { top: '93%', left: '30%', size: 2, color: '#3B82F6', delay: '-2.6s', dur: '3.5s' },
              { top: '1%', left: '63%', size: 5, color: '#FFFFFF', delay: '-1.5s', dur: '4.8s' },
              { top: '9%', left: '18%', size: 3, color: '#A78BFA', delay: '-3.5s', dur: '4.0s' },
              { top: '18%', left: '78%', size: 4, color: '#6366F1', delay: '-0.1s', dur: '4.2s' },
              { top: '28%', left: '13%', size: 2, color: '#3B82F6', delay: '-2.2s', dur: '3.6s' },
              { top: '38%', left: '87%', size: 5, color: '#FFFFFF', delay: '-1.8s', dur: '4.9s' },
              { top: '48%', left: '17%', size: 3, color: '#A78BFA', delay: '-3.0s', dur: '3.7s' },
              { top: '58%', left: '83%', size: 4, color: '#6366F1', delay: '-0.6s', dur: '4.3s' },
              { top: '68%', left: '19%', size: 2, color: '#3B82F6', delay: '-2.8s', dur: '3.4s' },
              { top: '78%', left: '81%', size: 5, color: '#FFFFFF', delay: '-1.0s', dur: '4.6s' },
              { top: '88%', left: '16%', size: 3, color: '#A78BFA', delay: '-3.6s', dur: '3.9s' },
              { top: '97%', left: '75%', size: 4, color: '#6366F1', delay: '-1.4s', dur: '4.2s' }
            ].map((p, i) => (
              <div 
                key={i}
                className="absolute rounded-full animate-particle-twinkle pointer-events-none opacity-40"
                style={{
                  top: p.top,
                  left: p.left,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  backgroundColor: p.color,
                  boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                  animationDelay: p.delay,
                  animationDuration: p.dur
                }}
              />
            ))}
          </div>



          {/* DASHBOARD CONTENT CONTAINER */}
          <div className="max-w-[1600px] w-full mx-auto p-4 lg:p-8 space-y-8 relative z-10">
          
          {/* Hero Banner Card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-wrap items-center justify-between gap-4 bg-[#FFFFFF] border border-[#EEF2FF] p-6 sm:p-8 rounded-[20px] shadow-[0_15px_35px_rgba(15,23,42,0.06)]"
          >
            <div>
              <h2 className="text-2xl font-bold text-[#0F172A] font-['Plus_Jakarta_Sans']">Customer Disputes Dashboard</h2>
              <p className="text-sm text-[#64748B] mt-1 font-normal">Manage active claims, upload evidence, or launch AI chatbot resolution</p>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigateTo('/user/create-dispute')}
                className="btn-primary-gradient px-5 py-2.5 text-xs font-semibold flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4 text-white" /> Create Dispute
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigateTo('/agent')}
                className="btn-secondary-custom px-5 py-2.5 text-xs font-semibold flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4 text-[#3B82F6]" /> Agentic Chatbot
              </motion.button>
            </div>
          </motion.div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <motion.div 
              whileHover={{ y: -3 }}
              className="bg-[#FFFFFF] border border-[#EEF2FF] p-6 rounded-[20px] shadow-[0_15px_35px_rgba(15,23,42,0.06)] flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total Disputes</p>
                <p className="text-3xl font-bold text-[#0F172A] mt-2 font-['Plus_Jakarta_Sans']">{disputes.length}</p>
              </div>
              <div className="p-3 bg-[#EEF2FF] text-[#4F46E5] rounded-2xl">
                <FileText className="h-6 w-6" />
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -3 }}
              className="bg-[#FFFFFF] border border-[#EEF2FF] p-6 rounded-[20px] shadow-[0_15px_35px_rgba(15,23,42,0.06)] flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-[#D97706] uppercase tracking-wider">Pending Approval</p>
                <p className="text-3xl font-bold text-[#D97706] mt-2 font-['Plus_Jakarta_Sans']">
                  {disputes.filter(d => d.status === 'WAITING_FOR_ADMIN' || d.status === 'Requires_Review' || d.status === 'SUBMITTED' || d.status === 'Analyzing').length}
                </p>
              </div>
              <div className="p-3 bg-[#FEF3C7] text-[#D97706] rounded-2xl">
                <Clock className="h-6 w-6" />
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -3 }}
              className="bg-[#FFFFFF] border border-[#EEF2FF] p-6 rounded-[20px] shadow-[0_15px_35px_rgba(15,23,42,0.06)] flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-[#16A34A] uppercase tracking-wider">Resolved Disputes</p>
                <p className="text-3xl font-bold text-[#16A34A] mt-2 font-['Plus_Jakarta_Sans']">
                  {disputes.filter(d => d.status === 'Approved' || d.status === 'RESOLVED' || d.status === 'Resolved').length}
                </p>
              </div>
              <div className="p-3 bg-[#DCFCE7] text-[#16A34A] rounded-2xl">
                <CheckCircle className="h-6 w-6" />
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -3 }}
              className="bg-[#FFFFFF] border border-[#EEF2FF] p-6 rounded-[20px] shadow-[0_15px_35px_rgba(15,23,42,0.06)] flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-[#DC2626] uppercase tracking-wider">Rejected Disputes</p>
                <p className="text-3xl font-bold text-[#DC2626] mt-2 font-['Plus_Jakarta_Sans']">
                  {disputes.filter(d => d.status === 'Rejected').length}
                </p>
              </div>
              <div className="p-3 bg-[#FEE2E2] text-[#DC2626] rounded-2xl">
                <XCircle className="h-6 w-6" />
              </div>
            </motion.div>
          </div>

          {/* CREATE DISPUTE FORM (If in create route) */}
          {currentRoute === '/user/create-dispute' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-[#FFFFFF] border border-[#EEF2FF] p-8 rounded-[20px] max-w-3xl mx-auto space-y-6 shadow-[0_15px_35px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
                <div>
                  <h3 className="text-xl font-bold text-[#0F172A] flex items-center gap-2 font-['Plus_Jakarta_Sans']">
                    <PlusCircle className="h-5 w-5 text-[#4F46E5]" /> Create New Dispute Claim
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5 font-normal">Fill in details and upload an actual image file from your device</p>
                </div>
                <button onClick={() => navigateTo('/user/dashboard')} className="text-xs text-[#64748B] hover:text-[#0F172A] font-semibold">Cancel</button>
              </div>

              {uploadError && (
                <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] px-4 py-3 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <AlertOctagon className="h-4 w-4 shrink-0 text-[#EF4444]" /> {uploadError}
                </div>
              )}

              <form onSubmit={handleCreateDisputeSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F172A] block">Dispute Title / Short Headline</label>
                  <input
                    type="text"
                    placeholder="e.g. Laptop screen damaged during shipping"
                    value={createTitle}
                    onChange={e => setCreateTitle(e.target.value)}
                    className="input-enterprise w-full p-3 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#0F172A] block">Category</label>
                    <select
                      value={wizardCategory}
                      onChange={e => setWizardCategory(e.target.value)}
                      className="input-enterprise w-full p-3 text-xs"
                    >
                      <option value="Damaged Product">Damaged Product</option>
                      <option value="Wrong Product">Wrong Product</option>
                      <option value="Missing Product">Missing Product</option>
                      <option value="Late Delivery">Late Delivery</option>
                      <option value="Refund Request">Refund Request</option>
                      <option value="Warranty Claim">Warranty Claim</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#0F172A] block">Order ID</label>
                    <input
                      type="text"
                      placeholder="e.g. ORD-58493-29"
                      value={wizardOrderId}
                      onChange={e => setWizardOrderId(e.target.value)}
                      className="input-enterprise w-full p-3 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F172A] block">Claim Amount ($ / INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="450.00"
                    value={wizardClaimAmount}
                    onChange={e => setWizardClaimAmount(e.target.value)}
                    className="input-enterprise w-full p-3 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F172A] block">Detailed Description of Complaint</label>
                  <textarea
                    rows={4}
                    placeholder="Describe the condition, packaging, and nature of the issue in detail..."
                    value={wizardText}
                    onChange={e => setWizardText(e.target.value)}
                    className="input-enterprise w-full p-3 text-xs resize-none"
                  />
                </div>

                {/* REAL IMAGE UPLOAD & PREVIEW */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#0F172A] block">Evidence Image / Document Upload</label>
                  
                  {evidencePreviewUrl ? (
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img 
                          src={evidencePreviewUrl} 
                          alt="Evidence Preview" 
                          className="w-16 h-16 object-cover rounded-xl border border-[#E2E8F0] shadow-sm" 
                        />
                        <div>
                          <p className="text-xs font-bold text-[#0F172A] truncate max-w-xs">{evidenceFile?.name}</p>
                          <p className="text-[10px] text-[#64748B] mt-0.5">
                            {(evidenceFile?.size ? (evidenceFile.size / 1024).toFixed(1) + " KB" : "")}
                          </p>
                          {uploadingEvidence ? (
                            <span className="text-[10px] text-[#D97706] flex items-center gap-1 font-semibold mt-1">
                              <RefreshCw className="h-3 w-3 animate-spin" /> Uploading to server...
                            </span>
                          ) : uploadedFileUrl ? (
                            <span className="text-[10px] text-[#16A34A] font-bold flex items-center gap-1 mt-1">
                              <CheckCircle className="h-3 w-3" /> Uploaded to Backend ({uploadedFileUrl})
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-2 text-[#64748B] hover:text-[#DC2626] bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-[#CBD5E1] hover:border-[#6366F1] rounded-2xl p-8 text-center cursor-pointer transition-all block bg-[#F8FAFF]">
                      <Upload className="h-8 w-8 text-[#4F46E5] mx-auto mb-2" />
                      <span className="text-xs font-bold text-[#0F172A] block">Click or drag image to upload evidence</span>
                      <span className="text-[10px] text-[#64748B] block mt-1">Supports JPG, JPEG, PNG, WEBP, GIF, PDF (up to 15MB)</span>
                      <input 
                        type="file" 
                        accept="image/*,.pdf" 
                        onChange={handleFileChange} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => navigateTo('/user/dashboard')}
                    className="btn-secondary-custom px-6 py-2.5 text-xs"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={wizardLoading || uploadingEvidence}
                    className="btn-primary-gradient px-8 py-2.5 text-xs flex items-center gap-2"
                  >
                    {wizardLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Submit Dispute & Start AI Workflow'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}

          {/* DISPUTES LIST TABLE / CARDS */}
          <div className="bg-[#FFFFFF] border border-[#EEF2FF] rounded-[20px] p-6 space-y-5 shadow-[0_15px_35px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
              <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2 font-['Plus_Jakarta_Sans']">
                <FileText className="h-5 w-5 text-[#4F46E5]" /> Registered Claims & History
              </h3>
              <button onClick={() => fetchDisputes()} className="text-xs text-[#4F46E5] font-semibold hover:underline flex items-center gap-1">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh List
              </button>
            </div>

            {casesLoading ? (
              <div className="text-center py-10 text-[#64748B] text-xs flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-[#4F46E5]" /> Fetching disputes from database...
              </div>
            ) : disputes.length === 0 ? (
              <div className="text-center py-12 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[#64748B] text-xs space-y-3">
                <p>No disputes registered yet.</p>
                <button onClick={() => navigateTo('/user/create-dispute')} className="btn-primary-gradient px-4 py-2 text-xs">
                  Create First Dispute
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {disputes.map(d => (
                  <motion.div
                    whileHover={{ y: -4 }}
                    key={d.id}
                    onClick={() => { setSelectedDispute(d); navigateTo(`/disputes/${d.id}`); }}
                    className="bg-[#FFFFFF] hover:bg-[#F8FAFF] border border-[#E2E8F0] hover:border-[#C7D2FE] p-5 rounded-[20px] space-y-3 cursor-pointer transition-all shadow-[0_10px_25px_rgba(15,23,42,0.04)] group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-bold text-[#4F46E5]">{d.id}</span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${getStatusColor(d.status)}`}>
                        {d.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-[#0F172A] text-sm group-hover:text-[#4F46E5] transition-colors truncate font-['Plus_Jakarta_Sans']">
                        {d.title || d.category || 'Dispute Claim'}
                      </h4>
                      <p className="text-xs text-[#64748B] mt-0.5 truncate">{d.complaintText}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#F1F5F9] pt-3 text-xs text-[#64748B]">
                      <span>Order: <strong className="text-[#0F172A]">{d.orderId}</strong></span>
                      <span className="font-bold text-[#0F172A] font-['Plus_Jakarta_Sans']">${d.claimAmount}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* 4. DISPUTE DETAILS PAGE (`/disputes/:id`) */}
      {currentRoute.startsWith('/disputes/') && (
        <div className="flex-1 max-w-[1400px] w-full mx-auto p-4 lg:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigateTo('/user/dashboard')} 
              className="btn-secondary-custom px-4 py-2 text-xs flex items-center gap-1.5"
            >
              ← Back to User Dashboard
            </button>
            <span className="text-xs text-[#64748B] font-mono">Dispute Record Details</span>
          </div>

          {selectedDispute ? (
            <div className="space-y-6">
              
              {/* Header Details Card */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#FFFFFF] border border-[#EEF2FF] p-6 sm:p-8 rounded-[20px] space-y-6 shadow-[0_15px_35px_rgba(15,23,42,0.06)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F1F5F9] pb-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-[#0F172A] font-['Plus_Jakarta_Sans']">{selectedDispute.title || selectedDispute.category || 'Dispute Claim'}</h2>
                      <span className={`text-xs px-3 py-1 rounded-full font-bold border ${getStatusColor(selectedDispute.status)}`}>
                        STATUS: {selectedDispute.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-1.5">Dispute ID: <strong className="text-[#4F46E5] font-mono">{selectedDispute.id}</strong> · Order ID: <strong className="text-[#0F172A] font-mono">{selectedDispute.orderId}</strong></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#64748B]">Claim Amount</p>
                    <p className="text-3xl font-extrabold text-[#16A34A] font-['Plus_Jakarta_Sans']">${selectedDispute.claimAmount.toLocaleString()}</p>
                  </div>
                </div>

                {/* Complaint Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                    <span className="text-[#64748B] font-bold uppercase text-[10px] tracking-wider">Customer Information</span>
                    <p className="font-bold text-[#0F172A] mt-1 text-sm font-['Plus_Jakarta_Sans']">{selectedDispute.customerName}</p>
                    <p className="text-[#64748B]">{selectedDispute.customerEmail}</p>
                  </div>
                  <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                    <span className="text-[#64748B] font-bold uppercase text-[10px] tracking-wider">Category & Creation Date</span>
                    <p className="font-bold text-[#4F46E5] mt-1 text-sm font-['Plus_Jakarta_Sans']">{selectedDispute.category || 'General Dispute'}</p>
                    <p className="text-[#64748B]">{new Date(selectedDispute.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                    <span className="text-[#64748B] font-bold uppercase text-[10px] tracking-wider">Current Resolution Action</span>
                    <p className="font-bold text-[#16A34A] mt-1 text-sm font-['Plus_Jakarta_Sans']">{selectedDispute.resolutionAction || 'Pending Investigation'}</p>
                    <p className="text-[#64748B] text-[11px] truncate">{selectedDispute.resolutionReason || 'Workflow in progress'}</p>
                  </div>
                </div>

                {/* Detailed Text */}
                <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-1 text-xs">
                  <span className="text-[#64748B] font-bold uppercase text-[10px] tracking-wider">Full Complaint Description</span>
                  <p className="text-[#334155] italic leading-relaxed">"{selectedDispute.complaintText}"</p>
                </div>
              </motion.div>

              {/* 2-Column: Uploaded Evidence & AI Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Uploaded Evidence */}
                <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#EEF2FF] p-6 rounded-[20px] space-y-4 shadow-[0_15px_35px_rgba(15,23,42,0.06)]">
                  <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2 font-['Plus_Jakarta_Sans']">
                    <Upload className="h-5 w-5 text-[#4F46E5]" /> Uploaded Evidence Photo / Document
                  </h3>
                  
                  {selectedDispute.evidenceUrls && selectedDispute.evidenceUrls.length > 0 ? (
                    <div className="space-y-4">
                      {selectedDispute.evidenceUrls.map((url, idx) => (
                        <div key={idx} className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono text-[#0F172A] truncate">{url}</span>
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#4F46E5] hover:underline flex items-center gap-1 font-semibold">
                              Open Full <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          {url.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif|bmp)$/) || url.startsWith('blob:') || url.startsWith('/uploads/') ? (
                            <img 
                              src={url} 
                              alt={`Evidence ${idx + 1}`} 
                              className="w-full max-h-72 object-contain rounded-xl border border-[#E2E8F0] bg-[#FFFFFF]" 
                            />
                          ) : (
                            <div className="bg-[#FFFFFF] p-6 rounded-xl text-center text-xs text-[#64748B]">
                              Document attached: {url}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-[#F8FAFC] p-6 rounded-xl text-center text-xs text-[#64748B] italic">No evidence file uploaded</div>
                  )}
                </div>

                {/* AI / Agent Analysis */}
                <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#EEF2FF] p-6 rounded-[20px] space-y-4 shadow-[0_15px_35px_rgba(15,23,42,0.06)]">
                  <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2 font-['Plus_Jakarta_Sans']">
                    <BrainCircuit className="h-5 w-5 text-[#3B82F6]" /> AI / Agent Analysis & Risk Score
                  </h3>

                  <div className="bg-[#F8FAFC] p-5 rounded-xl border border-[#E2E8F0] space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[#64748B] font-semibold">Evaluated Risk Score:</span>
                      <span className={`px-3 py-1 rounded-full font-bold text-xs ${selectedDispute.fraudScore >= 0.6 ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]' : 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]'}`}>
                        {selectedDispute.fraudRiskLevel || (selectedDispute.fraudScore >= 0.6 ? 'HIGH' : 'LOW')} ({intToPct(selectedDispute.fraudScore)})
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[#64748B] font-semibold">Vision & OCR Confidence:</span>
                      <span className="font-bold text-[#4F46E5] font-['Plus_Jakarta_Sans']">{intToPct(selectedDispute.confidence || 0.95)}</span>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-[#E2E8F0]">
                      <span className="text-[#64748B] font-bold uppercase text-[10px]">Policy Reference Cited</span>
                      <p className="text-[#334155] italic p-3 bg-[#FFFFFF] rounded-xl border border-[#E2E8F0]">
                        "{selectedDispute.policyNotes || 'Refund Policy Section 4.2 - Damaged In Transit Coverage'}"
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* WORKFLOW TIMELINE */}
              <div className="bg-[#FFFFFF] border border-[#EEF2FF] p-6 rounded-[20px] space-y-4 shadow-[0_15px_35px_rgba(15,23,42,0.06)]">
                <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2 font-['Plus_Jakarta_Sans']">
                  <Clock className="h-5 w-5 text-[#3B82F6]" /> Complete Database Workflow Timeline
                </h3>
                <p className="text-xs text-[#64748B]">Timestamped sequence of events persisted in database for Case #{selectedDispute.id}</p>

                {timelineEvents.length > 0 ? (
                  <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E2E8F0]">
                    {timelineEvents.map((evt, idx) => (
                      <div key={idx} className="flex items-start gap-4 relative z-10">
                        <div className="w-7 h-7 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4F46E5] text-xs font-bold shrink-0">
                          ✓
                        </div>
                        <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] flex-1 text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[#4F46E5] font-['Plus_Jakarta_Sans']">{evt.action_taken}</span>
                            <span className="text-[10px] font-mono text-[#64748B]">{evt.timestamp ? new Date(evt.timestamp).toLocaleString() : 'Just now'}</span>
                          </div>
                          <p className="text-[#64748B] font-mono text-[11px]"><strong className="text-[#0F172A] font-sans">[{evt.agent_name}]</strong> {evt.log_details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#F8FAFC] p-6 rounded-xl text-center text-xs text-[#64748B] italic">Timeline events loading...</div>
                )}
              </div>

            </div>
          ) : (
            <div className="text-center py-20 text-[#64748B] text-xs">Loading dispute details...</div>
          )}
          </div>
      )}

      {/* 5. ADMIN DASHBOARD (`/admin/dashboard`) */}
      {(currentRoute === '/admin/dashboard' || currentRoute.startsWith('/admin')) && (
        <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 lg:p-8 space-y-6">
          
          {/* Header Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#FFFFFF] border border-[#EEF2FF] p-6 rounded-[20px] shadow-[0_15px_35px_rgba(15,23,42,0.06)]">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-6 w-6 text-[#F59E0B]" />
                <h2 className="text-2xl font-bold text-[#0F172A] font-['Plus_Jakarta_Sans']">Admin Governance Dashboard</h2>
              </div>
              <p className="text-xs text-[#64748B] mt-1 font-normal">Review pending high-risk disputes, override decisions, and inspect multimodal agent logs</p>
            </div>
            
            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-[#F8FAFC] p-1.5 rounded-xl border border-[#E2E8F0] text-xs font-medium">
              {(['ALL', 'WAITING_FOR_ADMIN', 'HIGH_RISK', 'RESOLVED', 'REJECTED'] as const).map(flt => (
                <button
                  key={flt}
                  onClick={() => setAdminFilter(flt)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${adminFilter === flt ? 'bg-[#4F46E5] text-white font-semibold' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                >
                  {flt === 'WAITING_FOR_ADMIN' ? 'Pending Approval' : flt.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Disputes Stream Left Queue */}
            <section className="lg:col-span-5 bg-[#FFFFFF] border border-[#EEF2FF] rounded-[20px] p-5 flex flex-col gap-4 max-h-[750px] overflow-hidden shadow-[0_15px_35px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2 font-['Plus_Jakarta_Sans']">
                  <Layers className="h-4 w-4 text-[#4F46E5]" /> Disputes Stream ({filteredAdminDisputes.length})
                </h3>
                <button onClick={() => fetchDisputes()} className="text-xs text-[#4F46E5] font-semibold hover:underline">Refresh</button>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Search by ID, customer, order..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="input-enterprise w-full pl-10 pr-4 py-2 text-xs"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {filteredAdminDisputes.length === 0 ? (
                  <div className="text-center py-10 text-[#64748B] text-xs italic">No disputes match selected filter</div>
                ) : (
                  filteredAdminDisputes.map(d => (
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      key={d.id}
                      onClick={() => setSelectedDispute(d)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                        selectedDispute?.id === d.id ? 'bg-[#EEF2FF] border-[#C7D2FE] shadow-sm' : 'bg-[#F8FAFC] border-[#E2E8F0] hover:bg-[#F1F5F9]'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs font-bold text-[#4F46E5]">{d.id}</span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${getStatusColor(d.status)}`}>
                          {d.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="font-bold text-[#0F172A] text-xs truncate font-['Plus_Jakarta_Sans']">{d.customerName} · Order {d.orderId}</h4>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#0F172A]">${d.claimAmount}</span>
                        <span className={`text-[10px] font-bold ${d.fraudScore >= 0.6 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                          Risk Score: {intToPct(d.fraudScore)}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </section>

            {/* Inspection & Action Panel Right */}
            <section className="lg:col-span-7 bg-[#FFFFFF] border border-[#EEF2FF] rounded-[20px] p-6 space-y-6 max-h-[750px] overflow-y-auto shadow-[0_15px_35px_rgba(15,23,42,0.06)]">
              {selectedDispute ? (
                <div className="space-y-6">
                  
                  {/* Inspection Header & Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F1F5F9] pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#0F172A] font-['Plus_Jakarta_Sans']">Dispute Inspection: {selectedDispute.id}</h3>
                      <p className="text-xs text-[#64748B] mt-0.5">Customer: <strong className="text-[#0F172A]">{selectedDispute.customerName}</strong> ({selectedDispute.customerEmail})</p>
                    </div>

                    {/* REAL APPROVE / REJECT BUTTONS */}
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAdminDecision(selectedDispute.id, 'approve')}
                        className="px-5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle className="h-4 w-4" /> APPROVE
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAdminDecision(selectedDispute.id, 'reject')}
                        className="px-5 py-2 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        <XCircle className="h-4 w-4" /> REJECT
                      </motion.button>
                    </div>
                  </div>

                  {/* High Risk Banner if applicable */}
                  {(selectedDispute.status === 'WAITING_FOR_ADMIN' || selectedDispute.fraudScore >= 0.6) && (
                    <div className="bg-[#FFFBEB] border border-[#FDE68A] p-4 rounded-xl flex items-center gap-3 text-xs text-[#D97706]">
                      <ShieldAlert className="h-5 w-5 text-[#F59E0B] shrink-0" />
                      <div>
                        <p className="font-bold">Human Admin Approval Required</p>
                        <p className="text-[#64748B] text-[11px]">This claim triggered governance safety thresholds due to high risk score ({intToPct(selectedDispute.fraudScore)}).</p>
                      </div>
                    </div>
                  )}

                  {/* Complaint & Evidence preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-2">
                      <span className="text-[#64748B] font-bold uppercase text-[10px]">Complaint Details</span>
                      <p className="text-[#0F172A] font-semibold">{selectedDispute.title || selectedDispute.category}</p>
                      <p className="text-[#64748B] italic">"{selectedDispute.complaintText}"</p>
                    </div>

                    <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-2">
                      <span className="text-[#64748B] font-bold uppercase text-[10px]">Uploaded Evidence Preview</span>
                      {selectedDispute.evidenceUrls && selectedDispute.evidenceUrls.length > 0 ? (
                        <div className="space-y-2">
                          <img 
                            src={selectedDispute.evidenceUrls[0]} 
                            alt="Uploaded evidence" 
                            className="w-full h-32 object-cover rounded-xl border border-[#E2E8F0] bg-[#FFFFFF]" 
                          />
                          <p className="text-[10px] font-mono text-[#64748B] truncate">{selectedDispute.evidenceUrls[0]}</p>
                        </div>
                      ) : (
                        <p className="text-[#64748B] italic">No evidence attached</p>
                      )}
                    </div>
                  </div>

                  {/* AI Analysis & Decision Passport */}
                  <div className="bg-[#F8FAFC] p-5 rounded-xl border border-[#E2E8F0] space-y-3 text-xs">
                    <span className="text-[#4F46E5] font-bold uppercase tracking-wider text-[10px]">AI Multi-Agent Decision Passport</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[#64748B] text-[10px] block">Recommended Action</span>
                        <span className="font-bold text-[#16A34A]">{selectedDispute.resolutionAction || "Replacement"}</span>
                      </div>
                      <div>
                        <span className="text-[#64748B] text-[10px] block">Risk Score</span>
                        <span className="font-bold text-[#4F46E5]">{intToPct(selectedDispute.fraudScore)}</span>
                      </div>
                    </div>
                    <p className="text-[#64748B] italic border-t border-[#E2E8F0] pt-2">"{selectedDispute.policyNotes || 'Policy warranties validated.'}"</p>
                  </div>

                  {/* Agent Trace Logs */}
                  <div className="bg-[#F8FAFC] p-5 rounded-xl border border-[#E2E8F0] space-y-3 font-mono text-[10px] text-[#4F46E5]">
                    <span className="text-[#64748B] font-bold font-sans uppercase text-[10px] block">Database Agent Logs</span>
                    {agentLogs.map((log, idx) => (
                      <div key={idx} className="p-2.5 bg-[#FFFFFF] rounded-lg border border-[#E2E8F0]">
                        <span className="text-[#64748B]">[{log.agentName}]</span> {log.logDetails}
                      </div>
                    ))}
                  </div>

                </div>
              ) : (
                <div className="text-center py-20 text-[#64748B] text-xs">Select a dispute from the left stream to inspect and take action</div>
              )}
            </section>

          </div>
        </div>
      )}

      {/* 6. AGENTIC CHATBOT PAGE (`/agent`, `/agentic-chat`, or `/chatbot`) */}
      {(currentRoute === '/agent' || currentRoute === '/agentic-chat' || currentRoute === '/chatbot') && (
        <div className="flex-1 max-w-[1400px] w-full mx-auto p-4 lg:p-6 flex flex-col h-[calc(100vh-110px)] relative z-10">
          
          {/* Main 28px Rounded Glass Chat Container */}
          <div className="bg-[#FFFFFF]/90 backdrop-blur-xl border border-[#EEF2FF] rounded-[28px] flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden shadow-[0_20px_60px_rgba(80,100,255,0.12)]">
            
            {/* LEFT SIDEBAR: Conversation History & Quick Prompts (lg:col-span-4) */}
            <aside className="lg:col-span-4 border-r border-[#EEF2FF] bg-[#F8FAFF]/70 p-5 flex flex-col justify-between hidden lg:flex space-y-6">
              <div className="space-y-6">
                
                {/* Assistant Info */}
                <div className="flex items-center gap-3 border-b border-[#E0E7FF] pb-4">
                  <div className="w-10 h-10 bg-gradient-to-tr from-[#5B5EF7] to-[#7C5CFF] rounded-2xl flex items-center justify-center text-white shadow-md shadow-[#5B5EF7]/30">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F172A] text-base font-['Plus_Jakarta_Sans']">Resolve-AI Assistant</h3>
                    <span className="text-[11px] font-semibold text-[#5B5EF7] bg-[#EEF2FF] px-2.5 py-0.5 rounded-full inline-block mt-0.5">
                      ● Active AI Workflow
                    </span>
                  </div>
                </div>

                {/* Quick Prompts Section */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block font-['Plus_Jakarta_Sans']">Quick Prompts</span>
                  <div className="space-y-2">
                    {[
                      { label: 'Validate Damage Evidence', icon: ShieldAlert, prompt: 'Please validate the damage evidence image for order ORD-1001' },
                      { label: 'Check Policy Limits', icon: FileText, prompt: 'What is our policy limit for warranty claims on electronics?' },
                      { label: 'Calculate Refund Risk', icon: BrainCircuit, prompt: 'Calculate the fraud risk score for claim #58493' },
                      { label: 'Generate Resolution Report', icon: CheckCircle, prompt: 'Generate an automated resolution summary report' }
                    ].map((qp, idx) => (
                      <button
                        key={idx}
                        onClick={() => setChatInputText(qp.prompt)}
                        className="w-full text-left p-3 rounded-2xl bg-[#FFFFFF] border border-[#EEF2FF] hover:border-[#C7D2FE] hover:shadow-md text-xs font-semibold text-[#0F172A] transition-all flex items-center gap-2.5 group"
                      >
                        <qp.icon className="h-4 w-4 text-[#5B5EF7] group-hover:scale-110 transition-transform shrink-0" />
                        <span className="truncate">{qp.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Suggestions / Capability Badges */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block font-['Plus_Jakarta_Sans']">AI Capabilities</span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 bg-[#FFFFFF] border border-[#E0E7FF] rounded-xl text-[11px] font-medium text-[#475569]">Multimodal OCR</span>
                    <span className="px-2.5 py-1 bg-[#FFFFFF] border border-[#E0E7FF] rounded-xl text-[11px] font-medium text-[#475569]">Fraud Scoring</span>
                    <span className="px-2.5 py-1 bg-[#FFFFFF] border border-[#E0E7FF] rounded-xl text-[11px] font-medium text-[#475569]">Auto Refunds</span>
                    <span className="px-2.5 py-1 bg-[#FFFFFF] border border-[#E0E7FF] rounded-xl text-[11px] font-medium text-[#475569]">Human Triggers</span>
                  </div>
                </div>

              </div>

              {/* Sidebar Footer */}
              <div className="pt-4 border-t border-[#E0E7FF] text-center">
                <p className="text-[11px] text-[#64748B] font-medium">Enterprise Dispute Engine v2.4</p>
              </div>
            </aside>

            {/* RIGHT MAIN CHAT AREA (lg:col-span-8) */}
            <div className="lg:col-span-8 flex flex-col h-full overflow-hidden bg-[#FFFFFF]">
              
              {/* Header */}
              <div className="p-4 px-6 border-b border-[#F1F5F9] bg-[#FFFFFF] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#EEF2FF] border border-[#E0E7FF] rounded-xl text-[#5B5EF7] lg:hidden">
                    <Sparkles className="h-5 w-5 text-[#5B5EF7]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F172A] text-sm font-['Plus_Jakarta_Sans']">Interactive AI Dispute Session</h3>
                    <p className="text-[11px] text-[#64748B]">Real-time autonomous negotiation & claim validation</p>
                  </div>
                </div>
                <button onClick={() => navigateTo('/user/dashboard')} className="btn-secondary-custom h-9 px-4 text-xs">
                  Exit Session
                </button>
              </div>

              {/* Chat Stream */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F8FAFF]/50">
                {chatMessages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-2`}
                  >
                    <div className={`max-w-xl rounded-[20px] p-4 text-xs space-y-2 shadow-sm transition-all ${
                      msg.sender === 'user' 
                        ? 'btn-primary-gradient text-white rounded-tr-none font-medium' 
                        : 'bg-[#FFFFFF] border border-[#EEF2FF] text-[#0F172A] rounded-tl-none shadow-[0_10px_30px_rgba(80,100,255,0.06)]'
                    }`}>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      
                      {msg.imagePreviewUrl && (
                        <div className="mt-2 border border-[#E2E8F0] rounded-xl overflow-hidden max-w-xs">
                          <img src={msg.imagePreviewUrl} alt="Chat evidence upload" className="w-full max-h-40 object-cover" />
                        </div>
                      )}
                    </div>

                    {msg.agentActivity && msg.agentActivity.length > 0 && (
                      <div className="bg-[#FFFFFF] border border-[#EEF2FF] rounded-2xl p-3.5 max-w-md w-full font-mono text-[10px] space-y-1.5 text-[#5B5EF7] shadow-sm">
                        <p className="text-[10px] font-sans font-bold text-[#64748B] uppercase tracking-wider">Agent Execution Traces</p>
                        {msg.agentActivity.map((act: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center bg-[#F8FAFC] p-2 rounded-lg border border-[#E2E8F0]">
                            <span>• [{act.agent}] {act.step}</span>
                            <span className="text-[#16A34A] font-bold">✓</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.actionCard && (
                      <div className="bg-[#FFFFFF] border border-[#C7D2FE] rounded-2xl p-4 max-w-md w-full space-y-2 text-xs shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#5B5EF7] uppercase text-[10px] tracking-wider">{msg.actionCard.title || msg.actionCard.type}</span>
                          {msg.actionCard.case_id && (
                            <span className="font-mono text-[#5B5EF7] font-bold text-[10px]">{msg.actionCard.case_id}</span>
                          )}
                        </div>
                        {msg.actionCard.reasoning && (
                          <ul className="list-disc list-inside text-[11px] text-[#475569] space-y-1">
                            {msg.actionCard.reasoning.map((r: string, i: number) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        )}
                        {msg.actionCard.actions && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {msg.actionCard.actions.map((act: string, i: number) => (
                              <button 
                                key={i} 
                                onClick={() => { setChatInputText(act); }}
                                className="px-3 py-1.5 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#5B5EF7] rounded-xl text-[11px] font-semibold transition-all"
                              >
                                {act}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <span className="text-[9px] text-[#94A3B8] font-mono px-1">{msg.timestamp}</span>
                  </div>
                ))}

                {chatLoading && (
                  <div className="flex items-center gap-2 text-xs text-[#5B5EF7] font-mono italic">
                    <Sparkles className="h-4 w-4 animate-spin text-[#3B82F6]" /> AI multi-agent system evaluating...
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendChatMessage} className="p-4 border-t border-[#F1F5F9] bg-[#FFFFFF] space-y-3">
                {chatEvidencePreview && (
                  <div className="flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 px-3 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-[#5B5EF7]" />
                      <span className="text-[#0F172A] font-mono text-[11px] truncate max-w-xs">{chatEvidenceFile?.name}</span>
                    </div>
                    <button type="button" onClick={() => { setChatEvidenceFile(null); setChatEvidencePreview(''); }} className="text-[#64748B] hover:text-[#DC2626]">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <label className="p-3 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0] rounded-2xl cursor-pointer transition-all flex items-center justify-center">
                    <Upload className="h-4 w-4" />
                    <input type="file" accept="image/*" onChange={handleChatFileChange} className="hidden" />
                  </label>

                  <input
                    type="text"
                    placeholder="Describe your claim, order ID (e.g. ORD1001), or ask status..."
                    value={chatInputText}
                    onChange={e => setChatInputText(e.target.value)}
                    className="input-enterprise flex-1 px-4 py-3 text-xs rounded-2xl"
                  />

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={chatLoading}
                    className="btn-primary-gradient h-11 px-6 text-xs flex items-center gap-1.5"
                  >
                    <Send className="h-4 w-4 text-white" /> Send
                  </motion.button>
                </div>
              </form>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

