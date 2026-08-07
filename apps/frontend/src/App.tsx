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
  Activity,
  Layers,
  Mail,
  Lock
} from 'lucide-react';
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
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  // Layout & Navigation active tab
  const [adminFilter, setAdminFilter] = useState<'ALL' | 'WAITING_FOR_ADMIN' | 'HIGH_RISK' | 'RESOLVED' | 'REJECTED'>('ALL');

  // Authentication form states
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

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
      const data = await api.getDisputes();
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
        const logs = await api.getAgentLogs(selectedDispute.id);
        setAgentLogs(logs);
        const timeline = await api.getDisputeTimeline(selectedDispute.id);
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
      return;
    }
    try {
      setAuthLoading(true);
      setAuthError('');
      const data = await api.login(authEmail, authPassword);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      
      navigateTo('/user/dashboard');
    } catch (err: any) {
      setAuthError(err.response?.data?.detail || 'Invalid user email or password.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthError('Email and password are required.');
      return;
    }
    try {
      setAuthLoading(true);
      setAuthError('');
      const data = await api.login(authEmail, authPassword);
      
      const role = str(data.user.role).toUpperCase();
      if (role !== 'ADMIN' && role !== 'SUPPORT_AGENT' && role !== 'RESOLUTION_MANAGER' && role !== 'FRAUD_ANALYST') {
        setAuthError('Access Denied: User account is not authorized for Admin access. Please use User Sign In.');
        return;
      }

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      
      navigateTo('/admin/dashboard');
    } catch (err: any) {
      setAuthError(err.response?.data?.detail || 'Invalid admin credentials.');
    } finally {
      setAuthLoading(false);
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
      setAuthSuccess('Account created successfully! You can now log in.');
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

      const newDispute = await api.createDispute(payload);
      
      // Refresh disputes list
      await fetchDisputes();
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
      let updated: Dispute;
      if (action === 'approve') {
        updated = await api.approveDispute(disputeId);
      } else {
        updated = await api.rejectDispute(disputeId);
      }
      
      // Refresh list & current selection
      await fetchDisputes();
      setSelectedDispute(updated);
    } catch (err) {
      console.error(`Failed to ${action} dispute`, err);
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
      case 'SUBMITTED': return 'bg-blue-950/80 text-blue-300 border-blue-800/80';
      case 'Analyzing': return 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80';
      case 'WAITING_FOR_ADMIN':
      case 'Requires_Review': return 'bg-amber-950/80 text-amber-300 border-amber-800/80 animate-pulse';
      case 'Approved':
      case 'RESOLVED':
      case 'Resolved': return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80';
      case 'Rejected': return 'bg-rose-950/80 text-rose-300 border-rose-800/80';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* ─── GLOBAL HEADER BAR ─── */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl px-6 py-3.5 sticky top-0 z-50 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('/')}>
          <div className="p-2 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 rounded-xl shadow-lg shadow-indigo-500/20">
            <BrainCircuit className="h-6 w-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-wide text-white">Resolve-AI</h1>
              <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-700/50 rounded-full text-[10px] font-mono font-bold text-indigo-300">
                MVP v1.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">Autonomous & Human-in-the-Loop Dispute Intelligence</p>
          </div>
        </div>

        {/* Global Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-850 text-xs font-semibold">
          <button 
            onClick={() => navigateTo('/')} 
            className={`px-4 py-1.5 rounded-xl transition-all ${currentRoute === '/' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Home
          </button>
          <button 
            onClick={() => navigateTo('/user/dashboard')} 
            className={`px-4 py-1.5 rounded-xl transition-all ${currentRoute.startsWith('/user') || currentRoute.startsWith('/disputes') ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            User Dashboard
          </button>
          <button 
            onClick={() => navigateTo('/admin/dashboard')} 
            className={`px-4 py-1.5 rounded-xl transition-all ${currentRoute.startsWith('/admin') ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Admin Portal
          </button>
          <button 
            onClick={() => navigateTo('/agent')} 
            className={`px-4 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${currentRoute === '/agent' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" /> AI Chatbot
          </button>
        </nav>

        {/* Auth status & actions */}
        <div className="flex items-center gap-3">
          {token && user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-200">{user.full_name || user.email}</p>
                <span className="text-[9px] text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800 font-mono font-bold">
                  {user.role}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
              >
                <LogOut className="h-3.5 w-3.5" /> Log Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigateTo('/user/login')}
                className="px-3.5 py-1.5 text-slate-300 hover:text-white text-xs font-semibold transition-all"
              >
                User Login
              </button>
              <button 
                onClick={() => navigateTo('/admin/login')}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-950/40 active:scale-95 transition-all"
              >
                Admin Sign In
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ─── ROUTER VIEWS ─── */}

      {/* 1. LANDING PAGE */}
      {currentRoute === '/' && (
        <div className="flex-1 flex flex-col">
          <section className="relative px-6 py-20 lg:py-28 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <span className="px-3 py-1.5 bg-indigo-950/80 border border-indigo-800 text-indigo-300 rounded-full text-xs font-bold tracking-wider inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" /> RESOLVE-AI FUNCTIONAL MVP
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
                Autonomous Dispute Resolution.<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">
                  Backed by Multi-Agent AI.
                </span>
              </h2>
              <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Submit claims with real evidence image uploads, automated multi-signal risk evaluations, policy citations, human approval gates, and interactive conversational assistance.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button 
                  onClick={() => navigateTo('/user/dashboard')}
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold rounded-2xl text-xs shadow-xl shadow-indigo-900/40 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Go to User Dashboard <ChevronRight className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => navigateTo('/agent')}
                  className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold rounded-2xl text-xs transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-4 w-4 text-cyan-400" /> Open Agentic Chatbot
                </button>
              </div>
            </div>

            {/* Visual preview card */}
            <div className="lg:col-span-5 bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 space-y-4 shadow-2xl relative overflow-hidden backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-400" /> Real-time Workflow Architecture
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-900/80 px-2 py-0.5 rounded-full font-bold">ONLINE</span>
              </div>
              
              <div className="space-y-3 font-mono text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-[10px]">1. REAL IMAGE INTAKE</p>
                    <p className="text-slate-200 font-bold mt-0.5">Uploaded Evidence & Order Details</p>
                  </div>
                  <Upload className="h-4 w-4 text-indigo-400" />
                </div>
                <div className="text-center text-slate-600 py-0.5">↓</div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-1.5 text-[11px]">
                  <p className="text-slate-500 text-[10px]">2. MULTI-AGENT RISK EVALUATION</p>
                  <div className="flex justify-between text-indigo-300"><span>• Evidence Vision OCR</span><span className="text-emerald-400 font-bold">Verified ✓</span></div>
                  <div className="flex justify-between text-indigo-300"><span>• Fraud Risk Score</span><span className="text-emerald-400 font-bold">LOW (8%) ✓</span></div>
                  <div className="flex justify-between text-indigo-300"><span>• Governance Gate</span><span className="text-emerald-400 font-bold">Auto-Approved ✓</span></div>
                </div>
                <div className="text-center text-slate-600 py-0.5">↓</div>
                <div className="bg-gradient-to-r from-emerald-950/50 to-teal-950/50 p-3 rounded-xl border border-emerald-800/50 flex items-center justify-between">
                  <div>
                    <p className="text-emerald-400 text-[10px] uppercase font-bold">3. Database Resolution</p>
                    <p className="text-slate-200 font-bold mt-0.5">Status: RESOLVED / APPROVED</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* 2. AUTHENTICATION PAGES (USER LOGIN vs ADMIN LOGIN) */}
      {(currentRoute === '/user/login' || currentRoute === '/user/register' || currentRoute === '/admin/login' || currentRoute === '/login') && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-2xl relative backdrop-blur-xl">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-indigo-950/80 border border-indigo-800 rounded-2xl flex items-center justify-center mx-auto text-indigo-400">
                {currentRoute === '/admin/login' ? <ShieldAlert className="h-6 w-6 text-amber-400" /> : <User className="h-6 w-6 text-indigo-400" />}
              </div>
              <h2 className="text-2xl font-bold text-white">
                {currentRoute === '/admin/login' ? 'Admin Portal Sign In' : currentRoute === '/user/register' ? 'Create Customer Account' : 'User Sign In'}
              </h2>
              <p className="text-xs text-slate-400">
                {currentRoute === '/admin/login' ? 'Restricted authentication for support agents & administrators' : 'Access your claims dashboard and file disputes'}
              </p>
            </div>

            {/* Error / Success Display */}
            {authError && (
              <div className="bg-rose-950/60 border border-rose-800 text-rose-300 px-4 py-3 rounded-2xl text-xs flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 shrink-0" /> {authError}
              </div>
            )}
            {authSuccess && (
              <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 px-4 py-3 rounded-2xl text-xs flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" /> {authSuccess}
              </div>
            )}

            {/* Login / Register Form */}
            <form onSubmit={currentRoute === '/admin/login' ? handleAdminLogin : currentRoute === '/user/register' ? handleRegister : handleUserLogin} className="space-y-4">
              {currentRoute === '/user/register' && (
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-semibold block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Sarah Jenkins" 
                      value={authName}
                      onChange={e => setAuthName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none hover:border-slate-700 focus:border-indigo-600 transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input 
                    type="email" 
                    placeholder={currentRoute === '/admin/login' ? "admin@resolveai.demo" : "sarah.j@example.com"} 
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none hover:border-slate-700 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none hover:border-slate-700 focus:border-indigo-600 transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={authLoading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-950/40"
              >
                {authLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : currentRoute === '/user/register' ? 'Register Customer Account' : currentRoute === '/admin/login' ? 'Authenticate Admin' : 'User Sign In'}
              </button>
            </form>

            {/* Demo Quick Selectors */}
            <div className="border-t border-slate-800/80 pt-4 space-y-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider text-center font-bold">Quick Demo Login Accounts</p>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleQuickLogin('sarah.j@example.com', '/user/login')}
                  className="p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 rounded-xl text-[11px] text-slate-300 font-semibold text-center transition-all"
                >
                  👤 Sarah (User / Customer)
                </button>
                <button 
                  onClick={() => handleQuickLogin('admin@resolveai.demo', '/admin/login')}
                  className="p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 rounded-xl text-[11px] text-indigo-300 font-semibold text-center transition-all"
                >
                  🛡️ Demo Admin User
                </button>
              </div>
            </div>

            {/* Switch authentication type */}
            <div className="text-center text-xs space-y-1">
              {currentRoute === '/admin/login' ? (
                <p className="text-slate-400">
                  Are you a customer?{' '}
                  <button onClick={() => navigateTo('/user/login')} className="text-indigo-400 font-bold hover:underline">
                    Switch to User Login
                  </button>
                </p>
              ) : currentRoute === '/user/register' ? (
                <p className="text-slate-400">
                  Already have an account?{' '}
                  <button onClick={() => navigateTo('/user/login')} className="text-indigo-400 font-bold hover:underline">
                    Sign in here
                  </button>
                </p>
              ) : (
                <p className="text-slate-400">
                  Need a new account?{' '}
                  <button onClick={() => navigateTo('/user/register')} className="text-indigo-400 font-bold hover:underline">
                    Register here
                  </button>
                </p>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 3. USER DASHBOARD & DISPUTE CREATION (`/user/dashboard` or `/user/create-dispute`) */}
      {(currentRoute === '/user/dashboard' || currentRoute === '/user/create-dispute') && (
        <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 lg:p-6 space-y-6">
          
          {/* Header Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/50 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl">
            <div>
              <h2 className="text-2xl font-bold text-white">Customer Disputes Dashboard</h2>
              <p className="text-xs text-slate-400 mt-1">Manage active claims, upload evidence, or launch AI chatbot resolution</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateTo('/user/create-dispute')}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-950/40 active:scale-95 flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" /> Create Dispute
              </button>
              <button
                onClick={() => navigateTo('/agent')}
                className="px-5 py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold transition-all flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4 text-cyan-400" /> Agentic Chatbot
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Total Disputes</p>
              <p className="text-2xl font-bold text-slate-100 mt-1">{disputes.length}</p>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl">
              <p className="text-[10px] font-bold text-amber-500 uppercase">Pending Approval</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">
                {disputes.filter(d => d.status === 'WAITING_FOR_ADMIN' || d.status === 'Requires_Review' || d.status === 'SUBMITTED' || d.status === 'Analyzing').length}
              </p>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl">
              <p className="text-[10px] font-bold text-emerald-500 uppercase">Resolved Disputes</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {disputes.filter(d => d.status === 'Approved' || d.status === 'RESOLVED' || d.status === 'Resolved').length}
              </p>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl">
              <p className="text-[10px] font-bold text-rose-500 uppercase">Rejected Disputes</p>
              <p className="text-2xl font-bold text-rose-400 mt-1">
                {disputes.filter(d => d.status === 'Rejected').length}
              </p>
            </div>
          </div>

          {/* CREATE DISPUTE FORM (If in create route) */}
          {currentRoute === '/user/create-dispute' && (
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl max-w-3xl mx-auto space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <PlusCircle className="h-5 w-5 text-indigo-400" /> Create New Dispute Claim
                  </h3>
                  <p className="text-xs text-slate-400">Fill in details and upload an actual image file from your device</p>
                </div>
                <button onClick={() => navigateTo('/user/dashboard')} className="text-xs text-slate-400 hover:text-white">Cancel</button>
              </div>

              {uploadError && (
                <div className="bg-rose-950/60 border border-rose-800 text-rose-300 px-4 py-3 rounded-2xl text-xs flex items-center gap-2">
                  <AlertOctagon className="h-4 w-4 shrink-0" /> {uploadError}
                </div>
              )}

              <form onSubmit={handleCreateDisputeSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Dispute Title / Short Headline</label>
                  <input
                    type="text"
                    placeholder="e.g. Laptop screen damaged during shipping"
                    value={createTitle}
                    onChange={e => setCreateTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none hover:border-slate-700 focus:border-indigo-600 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">Category</label>
                    <select
                      value={wizardCategory}
                      onChange={e => setWizardCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none hover:border-slate-700 focus:border-indigo-600 transition-all"
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
                    <label className="text-xs font-semibold text-slate-300 block">Order ID</label>
                    <input
                      type="text"
                      placeholder="e.g. ORD-58493-29"
                      value={wizardOrderId}
                      onChange={e => setWizardOrderId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none hover:border-slate-700 focus:border-indigo-600 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Claim Amount ($ / INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="450.00"
                    value={wizardClaimAmount}
                    onChange={e => setWizardClaimAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none hover:border-slate-700 focus:border-indigo-600 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Detailed Description of Complaint</label>
                  <textarea
                    rows={4}
                    placeholder="Describe the condition, packaging, and nature of the issue in detail..."
                    value={wizardText}
                    onChange={e => setWizardText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none hover:border-slate-700 focus:border-indigo-600 transition-all resize-none"
                  />
                </div>

                {/* REAL IMAGE UPLOAD & PREVIEW */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">Evidence Image / Document Upload</label>
                  
                  {evidencePreviewUrl ? (
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img 
                          src={evidencePreviewUrl} 
                          alt="Evidence Preview" 
                          className="w-16 h-16 object-cover rounded-xl border border-slate-800 shadow-md" 
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-200 truncate max-w-xs">{evidenceFile?.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {(evidenceFile?.size ? (evidenceFile.size / 1024).toFixed(1) + " KB" : "")}
                          </p>
                          {uploadingEvidence ? (
                            <span className="text-[10px] text-amber-400 flex items-center gap-1 font-semibold mt-1">
                              <RefreshCw className="h-3 w-3 animate-spin" /> Uploading to server...
                            </span>
                          ) : uploadedFileUrl ? (
                            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
                              <CheckCircle className="h-3 w-3" /> Uploaded to Backend ({uploadedFileUrl})
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-2 text-slate-500 hover:text-rose-400 bg-slate-900 rounded-xl border border-slate-800 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-800 hover:border-indigo-600/80 rounded-2xl p-6 text-center cursor-pointer transition-all block bg-slate-950/40">
                      <Upload className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                      <span className="text-xs font-bold text-slate-200 block">Click to select an actual image from your computer</span>
                      <span className="text-[10px] text-slate-500 block mt-1">Supports JPG, JPEG, PNG, WEBP, GIF, PDF (up to 15MB)</span>
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
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={wizardLoading || uploadingEvidence}
                    className="px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-950/40 active:scale-95 transition-all flex items-center gap-2"
                  >
                    {wizardLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Submit Dispute & Start AI Workflow'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* DISPUTES LIST */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-400" /> Registered Claims & History
              </h3>
              <button onClick={() => fetchDisputes()} className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh List
              </button>
            </div>

            {casesLoading ? (
              <div className="text-center py-10 text-slate-500 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" /> Fetching disputes from database...
              </div>
            ) : disputes.length === 0 ? (
              <div className="text-center py-12 bg-slate-950/40 border border-slate-850 rounded-2xl text-slate-400 text-xs space-y-3">
                <p>No disputes registered yet.</p>
                <button onClick={() => navigateTo('/user/create-dispute')} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs">
                  Create First Dispute
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {disputes.map(d => (
                  <div
                    key={d.id}
                    onClick={() => { setSelectedDispute(d); navigateTo(`/disputes/${d.id}`); }}
                    className="bg-slate-950/80 hover:bg-slate-900 border border-slate-855 hover:border-indigo-600/50 p-5 rounded-2xl space-y-3 cursor-pointer transition-all shadow-md group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-bold text-indigo-400">{d.id}</span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${getStatusColor(d.status)}`}>
                        {d.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm group-hover:text-indigo-300 transition-colors truncate">
                        {d.title || d.category || 'Dispute Claim'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{d.complaintText}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-850 pt-3 text-xs text-slate-400">
                      <span>Order: <strong className="text-slate-200">{d.orderId}</strong></span>
                      <span className="font-bold text-slate-200">${d.claimAmount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* 4. DISPUTE DETAILS PAGE (`/disputes/:id`) */}
      {currentRoute.startsWith('/disputes/') && (
        <div className="flex-1 max-w-[1400px] w-full mx-auto p-4 lg:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigateTo('/user/dashboard')} 
              className="text-xs text-slate-400 hover:text-white font-semibold flex items-center gap-1.5 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800"
            >
              ← Back to User Dashboard
            </button>
            <span className="text-xs text-slate-500 font-mono">Dispute Record Details</span>
          </div>

          {selectedDispute ? (
            <div className="space-y-6">
              
              {/* Header Details Card */}
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-white">{selectedDispute.title || selectedDispute.category || 'Dispute Claim'}</h2>
                      <span className={`text-xs px-3 py-1 rounded-full font-bold border ${getStatusColor(selectedDispute.status)}`}>
                        STATUS: {selectedDispute.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Dispute ID: <strong className="text-indigo-400 font-mono">{selectedDispute.id}</strong> · Order ID: <strong className="text-slate-200 font-mono">{selectedDispute.orderId}</strong></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Claim Amount</p>
                    <p className="text-2xl font-extrabold text-emerald-400">${selectedDispute.claimAmount.toLocaleString()}</p>
                  </div>
                </div>

                {/* Complaint Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850">
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Customer Information</span>
                    <p className="font-bold text-slate-200 mt-1">{selectedDispute.customerName}</p>
                    <p className="text-slate-400">{selectedDispute.customerEmail}</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850">
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Category & Creation Date</span>
                    <p className="font-bold text-indigo-300 mt-1">{selectedDispute.category || 'General Dispute'}</p>
                    <p className="text-slate-400">{new Date(selectedDispute.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850">
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Current Resolution Action</span>
                    <p className="font-bold text-emerald-400 mt-1">{selectedDispute.resolutionAction || 'Pending Investigation'}</p>
                    <p className="text-slate-400 text-[11px] truncate">{selectedDispute.resolutionReason || 'Workflow in progress'}</p>
                  </div>
                </div>

                {/* Detailed Text */}
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 space-y-1 text-xs">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Full Complaint Description</span>
                  <p className="text-slate-300 italic leading-relaxed">"{selectedDispute.complaintText}"</p>
                </div>
              </div>

              {/* 2-Column: Uploaded Evidence & AI Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Uploaded Evidence */}
                <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Upload className="h-5 w-5 text-indigo-400" /> Uploaded Evidence Photo / Document
                  </h3>
                  
                  {selectedDispute.evidenceUrls && selectedDispute.evidenceUrls.length > 0 ? (
                    <div className="space-y-4">
                      {selectedDispute.evidenceUrls.map((url, idx) => (
                        <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono text-slate-300 truncate">{url}</span>
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-semibold">
                              Open Full <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          {url.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif|bmp)$/) || url.startsWith('blob:') || url.startsWith('/uploads/') ? (
                            <img 
                              src={url} 
                              alt={`Evidence ${idx + 1}`} 
                              className="w-full max-h-72 object-contain rounded-xl border border-slate-800 bg-slate-900" 
                            />
                          ) : (
                            <div className="bg-slate-900 p-6 rounded-xl text-center text-xs text-slate-400">
                              Document attached: {url}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-950 p-6 rounded-2xl text-center text-xs text-slate-500 italic">No evidence file uploaded</div>
                  )}
                </div>

                {/* AI / Agent Analysis */}
                <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-cyan-400" /> AI / Agent Analysis & Risk Score
                  </h3>

                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-semibold">Evaluated Risk Score:</span>
                      <span className={`px-3 py-1 rounded-full font-bold text-xs ${selectedDispute.fraudScore >= 0.6 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
                        {selectedDispute.fraudRiskLevel || (selectedDispute.fraudScore >= 0.6 ? 'HIGH' : 'LOW')} ({intToPct(selectedDispute.fraudScore)})
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-semibold">Vision & OCR Confidence:</span>
                      <span className="font-bold text-indigo-300">{intToPct(selectedDispute.confidence || 0.95)}</span>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-slate-850">
                      <span className="text-slate-500 font-bold uppercase text-[10px]">Policy Reference Cited</span>
                      <p className="text-slate-300 italic p-2.5 bg-slate-900/60 rounded-xl border border-slate-855">
                        "{selectedDispute.policyNotes || 'Refund Policy Section 4.2 - Damaged In Transit Coverage'}"
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* WORKFLOW TIMELINE */}
              <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-teal-400" /> Complete Database Workflow Timeline
                </h3>
                <p className="text-xs text-slate-400">Timestamped sequence of events persisted in database for Case #{selectedDispute.id}</p>

                {timelineEvents.length > 0 ? (
                  <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
                    {timelineEvents.map((evt, idx) => (
                      <div key={idx} className="flex items-start gap-4 relative z-10">
                        <div className="w-7 h-7 rounded-full bg-slate-950 border border-indigo-500/80 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0">
                          ✓
                        </div>
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-855 flex-1 text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-indigo-300">{evt.action_taken}</span>
                            <span className="text-[10px] font-mono text-slate-500">{evt.timestamp ? new Date(evt.timestamp).toLocaleString() : 'Just now'}</span>
                          </div>
                          <p className="text-slate-400 font-mono text-[11px]"><strong className="text-slate-300 font-sans">[{evt.agent_name}]</strong> {evt.log_details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-950 p-6 rounded-2xl text-center text-xs text-slate-500 italic">Timeline events loading...</div>
                )}
              </div>

            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 text-xs">Loading dispute details...</div>
          )}
        </div>
      )}

      {/* 5. ADMIN DASHBOARD (`/admin/dashboard`) */}
      {(currentRoute === '/admin/dashboard' || currentRoute.startsWith('/admin')) && (
        <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 lg:p-6 space-y-6">
          
          {/* Header Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-6 w-6 text-amber-400" />
                <h2 className="text-2xl font-bold text-white">Admin Governance Dashboard</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">Review pending high-risk disputes, override decisions, and inspect multimodal agent logs</p>
            </div>
            
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-850 text-xs font-semibold">
              {(['ALL', 'WAITING_FOR_ADMIN', 'HIGH_RISK', 'RESOLVED', 'REJECTED'] as const).map(flt => (
                <button
                  key={flt}
                  onClick={() => setAdminFilter(flt)}
                  className={`px-3 py-1.5 rounded-xl transition-all ${adminFilter === flt ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  {flt === 'WAITING_FOR_ADMIN' ? 'Pending Approval' : flt.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Disputes Stream Left Queue */}
            <section className="lg:col-span-5 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 flex flex-col gap-4 max-h-[750px] overflow-hidden">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-400" /> Disputes Stream ({filteredAdminDisputes.length})
                </h3>
                <button onClick={() => fetchDisputes()} className="text-xs text-indigo-400 hover:underline">Refresh</button>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by ID, customer, order..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {filteredAdminDisputes.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs italic">No disputes match selected filter</div>
                ) : (
                  filteredAdminDisputes.map(d => (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDispute(d)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                        selectedDispute?.id === d.id ? 'bg-indigo-950/50 border-indigo-700/80 shadow-lg' : 'bg-slate-950/60 border-slate-855 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs font-bold text-indigo-400">{d.id}</span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${getStatusColor(d.status)}`}>
                          {d.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-200 text-xs truncate">{d.customerName} · Order {d.orderId}</h4>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">${d.claimAmount}</span>
                        <span className={`text-[10px] font-bold ${d.fraudScore >= 0.6 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          Risk Score: {intToPct(d.fraudScore)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Inspection & Action Panel Right */}
            <section className="lg:col-span-7 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 space-y-6 max-h-[750px] overflow-y-auto">
              {selectedDispute ? (
                <div className="space-y-6">
                  
                  {/* Inspection Header & Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">Dispute Inspection: {selectedDispute.id}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Customer: <strong className="text-slate-200">{selectedDispute.customerName}</strong> ({selectedDispute.customerEmail})</p>
                    </div>

                    {/* REAL APPROVE / REJECT BUTTONS */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAdminDecision(selectedDispute.id, 'approve')}
                        className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/40 active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle className="h-4 w-4" /> APPROVE
                      </button>
                      <button
                        onClick={() => handleAdminDecision(selectedDispute.id, 'reject')}
                        className="px-5 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        <XCircle className="h-4 w-4" /> REJECT
                      </button>
                    </div>
                  </div>

                  {/* High Risk Banner if applicable */}
                  {(selectedDispute.status === 'WAITING_FOR_ADMIN' || selectedDispute.fraudScore >= 0.6) && (
                    <div className="bg-amber-950/40 border border-amber-800/80 p-4 rounded-2xl flex items-center gap-3 text-xs text-amber-300">
                      <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
                      <div>
                        <p className="font-bold">Human Admin Approval Required</p>
                        <p className="text-slate-400 text-[11px]">This claim triggered governance safety thresholds due to high risk score ({intToPct(selectedDispute.fraudScore)}).</p>
                      </div>
                    </div>
                  )}

                  {/* Complaint & Evidence preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-855 space-y-2">
                      <span className="text-slate-500 font-bold uppercase text-[10px]">Complaint Details</span>
                      <p className="text-slate-200 font-semibold">{selectedDispute.title || selectedDispute.category}</p>
                      <p className="text-slate-400 italic">"{selectedDispute.complaintText}"</p>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-855 space-y-2">
                      <span className="text-slate-500 font-bold uppercase text-[10px]">Uploaded Evidence Preview</span>
                      {selectedDispute.evidenceUrls && selectedDispute.evidenceUrls.length > 0 ? (
                        <div className="space-y-2">
                          <img 
                            src={selectedDispute.evidenceUrls[0]} 
                            alt="Uploaded evidence" 
                            className="w-full h-32 object-cover rounded-xl border border-slate-800 bg-slate-900" 
                          />
                          <p className="text-[10px] font-mono text-slate-500 truncate">{selectedDispute.evidenceUrls[0]}</p>
                        </div>
                      ) : (
                        <p className="text-slate-500 italic">No evidence attached</p>
                      )}
                    </div>
                  </div>

                  {/* AI Analysis & Decision Passport */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-855 space-y-3 text-xs">
                    <span className="text-indigo-400 font-bold uppercase tracking-wider text-[10px]">AI Multi-Agent Decision Passport</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Recommended Action</span>
                        <span className="font-bold text-emerald-400">{selectedDispute.resolutionAction || "Replacement"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Risk Score</span>
                        <span className="font-bold text-indigo-300">{intToPct(selectedDispute.fraudScore)}</span>
                      </div>
                    </div>
                    <p className="text-slate-400 italic border-t border-slate-900 pt-2">"{selectedDispute.policyNotes || 'Policy warranties validated.'}"</p>
                  </div>

                  {/* Agent Trace Logs */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-855 space-y-3 font-mono text-[10px] text-indigo-300">
                    <span className="text-slate-400 font-bold font-sans uppercase text-[10px] block">Database Agent Logs</span>
                    {agentLogs.map((log, idx) => (
                      <div key={idx} className="p-2 bg-slate-900/60 rounded-xl border border-slate-855">
                        <span className="text-slate-500">[{log.agentName}]</span> {log.logDetails}
                      </div>
                    ))}
                  </div>

                </div>
              ) : (
                <div className="text-center py-20 text-slate-500 text-xs">Select a dispute from the left stream to inspect and take action</div>
              )}
            </section>

          </div>
        </div>
      )}

      {/* 6. AGENTIC CHATBOT PAGE (`/agent` or `/agentic-chat`) */}
      {(currentRoute === '/agent' || currentRoute === '/agentic-chat') && (
        <div className="flex-1 max-w-[1200px] w-full mx-auto p-4 lg:p-6 flex flex-col h-[calc(100vh-80px)]">
          
          {/* Chat Container */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl flex-1 flex flex-col overflow-hidden shadow-2xl backdrop-blur-xl">
            
            {/* Chat Header */}
            <div className="p-4 px-6 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-xl">
                  <Sparkles className="h-5 w-5 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Resolve-AI Conversational Agent</h3>
                  <p className="text-[10px] text-slate-400">Autonomous Dispute Resolver · Connected to Database Workflow</p>
                </div>
              </div>
              <button onClick={() => navigateTo('/user/dashboard')} className="text-xs text-slate-400 hover:text-white">
                Exit Chat
              </button>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.map(msg => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-2`}
                >
                  <div className={`max-w-xl rounded-2xl p-4 text-xs space-y-2 shadow-md ${
                    msg.sender === 'user' 
                      ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-br-none font-medium' 
                      : 'bg-slate-950 border border-slate-850 text-slate-200 rounded-bl-none'
                  }`}>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    
                    {/* User upload image preview inside chat */}
                    {msg.imagePreviewUrl && (
                      <div className="mt-2 border border-indigo-400/40 rounded-xl overflow-hidden max-w-xs">
                        <img src={msg.imagePreviewUrl} alt="Chat evidence upload" className="w-full max-h-40 object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Agent Activity Steps Card */}
                  {msg.agentActivity && msg.agentActivity.length > 0 && (
                    <div className="bg-slate-950/80 border border-slate-855 rounded-2xl p-3.5 max-w-md w-full font-mono text-[10px] space-y-1.5 text-indigo-300">
                      <p className="text-[10px] font-sans font-bold text-slate-400 uppercase">Agent Execution Traces</p>
                      {msg.agentActivity.map((act: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded border border-slate-855">
                          <span>• [{act.agent}] {act.step}</span>
                          <span className="text-emerald-400 font-bold">✓</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Interactive Action Card */}
                  {msg.actionCard && (
                    <div className="bg-gradient-to-r from-indigo-950/60 to-cyan-950/60 border border-indigo-800/80 rounded-2xl p-4 max-w-md w-full space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white uppercase text-[10px] tracking-wider">{msg.actionCard.title || msg.actionCard.type}</span>
                        {msg.actionCard.case_id && (
                          <span className="font-mono text-indigo-400 font-bold text-[10px]">{msg.actionCard.case_id}</span>
                        )}
                      </div>
                      {msg.actionCard.reasoning && (
                        <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1">
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
                              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-300 rounded-xl text-[10px] font-semibold transition-all"
                            >
                              {act}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <span className="text-[9px] text-slate-500 font-mono px-1">{msg.timestamp}</span>
                </div>
              ))}

              {chatLoading && (
                <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono italic">
                  <Sparkles className="h-4 w-4 animate-spin" /> Agent system reasoning...
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendChatMessage} className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-3">
              
              {/* Optional File Attachment Bar */}
              {chatEvidencePreview && (
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2 px-3 rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-indigo-400" />
                    <span className="text-slate-300 font-mono text-[11px] truncate max-w-xs">{chatEvidenceFile?.name}</span>
                  </div>
                  <button type="button" onClick={() => { setChatEvidenceFile(null); setChatEvidencePreview(''); }} className="text-slate-500 hover:text-rose-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <label className="p-2.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 rounded-2xl cursor-pointer transition-all">
                  <Upload className="h-4 w-4" />
                  <input type="file" accept="image/*" onChange={handleChatFileChange} className="hidden" />
                </label>

                <input
                  type="text"
                  placeholder="Describe your issue, order ID (e.g. ORD1001), or ask case status..."
                  value={chatInputText}
                  onChange={e => setChatInputText(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-200 outline-none hover:border-slate-700 focus:border-indigo-600 transition-all"
                />

                <button
                  type="submit"
                  disabled={chatLoading}
                  className="p-2.5 px-5 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white rounded-2xl text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center gap-1.5"
                >
                  <Send className="h-4 w-4" /> Send
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
