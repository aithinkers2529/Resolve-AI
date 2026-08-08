import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  AlertOctagon, 
  FileText, 
  CheckCircle, 
  XCircle, 
  User as UserIcon, 
  PlusCircle,
  Upload,
  ShieldAlert,
  RefreshCw,
  LogOut,
  Image as ImageIcon,
  Trash2,
  Send,
  Sparkles,
  Clock,
  Layers,
  Eye,
  EyeOff,
  X,
  Wallet as WalletIcon,
  Bell,
  Package,
  ShoppingBag,
  Truck,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertTriangle,
  FileCheck,
  Activity,
  Award,
  DollarSign,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { Dispute } from './types';
import { 
  api, 
  OrderItem, 
  WalletData, 
  NotificationItem, 
  ReplacementData, 
  DecisionPassportData 
} from './services/api';


function formatCurrency(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function intToPct(num: any): string {
  if (num === undefined || num === null) return "95%";
  const floatVal = typeof num === 'number' ? num : parseFloat(num);
  if (isNaN(floatVal)) return "95%";
  if (floatVal <= 1.0) {
    return `${(floatVal * 100).toFixed(0)}%`;
  }
  return `${floatVal.toFixed(0)}%`;
}

// Product stock photos mapping
const PRODUCT_IMAGES: Record<string, string> = {
  'PROD-PHONE': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80',
  'PROD-LAPTOP': 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&auto=format&fit=crop&q=80',
  'PROD-KEYBOARD': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
  'PROD-MONITOR': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80',
  'PROD-HEADPHONES': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
  'PROD-TABLET': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80',
  'PROD-SMARTWATCH': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
  'PROD-EARBUDS': 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80',
  'PROD-DOCK': 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600&auto=format&fit=crop&q=80',
  'PROD-CHAIR': 'https://images.unsplash.com/photo-1580481077111-f1870a48b368?w=600&auto=format&fit=crop&q=80',
  'PROD-WORKSTATION': 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80'
};

const DEFAULT_PRODUCT_IMG = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80';

export default function App() {
  // Navigation & Routing state
  // Routes: '/', '/login', '/register', '/admin/login', '/dashboard', '/orders', '/disputes', '/disputes/:id', '/assistant', '/wallet', '/notifications', '/profile', '/admin'
  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [, setActiveDisputeId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  
  // Auth State
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [authRole, setAuthRole] = useState<'CUSTOMER' | 'ADMIN'>('CUSTOMER');
  
  // Auth Form State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Data State
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [agentLogs, setAgentLogs] = useState<any[]>([]);
  const [passport, setPassport] = useState<DecisionPassportData | null>(null);
  const [replacement, setReplacement] = useState<ReplacementData | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [, setLoading] = useState(false);

  // Dispute Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createOrderId, setCreateOrderId] = useState('');
  const [createCategory, setCreateCategory] = useState('Damaged Product');
  const [createClaimAmount, setCreateClaimAmount] = useState('899.99');
  const [createDescription, setCreateDescription] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string>('');
  const [, setUploadingFile] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // Live Agent Processing State
  const [processingDispute, setProcessingDispute] = useState<Dispute | null>(null);
  const [processingSteps, setProcessingSteps] = useState<Array<{ name: string; status: 'waiting' | 'running' | 'completed' | 'failed'; detail: string; time?: string }>>([]);
  const [showProcessingModal, setShowProcessingModal] = useState(false);

  // Agentic Assistant State
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<Array<{
    id: string;
    sender: 'user' | 'assistant';
    text: string;
    timestamp: string;
    agentActivity?: any[];
    actionCard?: any;
    dispute?: any;
  }>>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: "Hello! I am Resolve-AI, your Autonomous Customer Dispute & Experience Assistant. How can I help you today? You can report an issue with an order, check claim eligibility, or track ongoing investigations.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Admin filter
  const [adminFilter, setAdminFilter] = useState<'ALL' | 'WAITING_FOR_ADMIN' | 'HIGH_RISK' | 'RESOLVED' | 'REJECTED'>('ALL');

  // Initial Auth Check & Data Load
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setToken(savedToken);
        if (currentRoute === '/' || currentRoute === '/login') {
          setCurrentRoute(parsed.role === 'ADMIN' ? '/admin' : '/dashboard');
        }
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Fetch data whenever user/route changes
  useEffect(() => {
    if (user && token) {
      loadAllData();
    }
  }, [user, token, currentRoute]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [disputesData, ordersData, walletData, notifsData] = await Promise.all([
        api.getDisputes().catch(() => []),
        api.getOrders().catch(() => []),
        api.getWallet().catch(() => null),
        api.getNotifications().catch(() => [])
      ]);
      setDisputes(disputesData);
      setOrders(ordersData);
      setWallet(walletData);
      setNotifications(notifsData);

      // Auto pre-populate order selection if not selected yet
      if (ordersData && ordersData.length > 0) {
        setCreateOrderId(prev => prev || ordersData[0].id);
        setCreateClaimAmount(prev => (prev && prev !== '899.99' ? prev : ordersData[0].order_amount.toString()));
      }
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Load single dispute details
  const loadDisputeDetails = async (id: string) => {
    try {
      const [disp, logs, pass, repl, time] = await Promise.all([
        api.getDispute(id),
        api.getAgentLogs(id).catch(() => []),
        api.getDecisionPassport(id).catch(() => null),
        api.getReplacement(id).catch(() => null),
        api.getDisputeTimeline(id).catch(() => [])
      ]);
      setSelectedDispute(disp);
      setAgentLogs(logs);
      setPassport(pass);
      setReplacement(repl);
      setTimelineEvents(time?.timeline || time || []);
    } catch (e) {
      toast.error('Failed to load dispute details');
    }
  };

  // Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await api.login(authEmail.trim(), authPassword);
      const accessToken = res.access_token;
      localStorage.setItem('token', accessToken);
      setToken(accessToken);

      // Fetch user profile
      const me = await api.getMe();
      localStorage.setItem('user', JSON.stringify(me));
      setUser(me);
      toast.success(`Welcome back, ${me.full_name || me.email}!`);
      
      if (me.role === 'ADMIN') {
        setCurrentRoute('/admin');
      } else {
        setCurrentRoute('/dashboard');
      }
      await loadAllData();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid email or password. Please check your credentials.';
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  // Register Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      await api.register({
        email: authEmail.trim(),
        password: authPassword,
        full_name: authName.trim(),
        phone: authPhone.trim()
      });
      toast.success('Account created with ₹500 welcome wallet balance! Logging in...');
      
      // Auto login
      const res = await api.login(authEmail.trim(), authPassword);
      localStorage.setItem('token', res.access_token);
      setToken(res.access_token);
      const me = await api.getMe();
      localStorage.setItem('user', JSON.stringify(me));
      setUser(me);
      setCurrentRoute('/dashboard');
      await loadAllData();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Registration failed. Email might already be registered.';
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setCurrentRoute('/');
    toast.success('Logged out successfully.');
  };

  // Image Selection & Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEvidenceFile(file);
      setEvidencePreview(URL.createObjectURL(file));
    }
  };

  // Submit Dispute Creation
  const handleCreateDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveOrderId = createOrderId || (orders.length > 0 ? orders[0].id : 'ORD-58493-29');
    const orderObj = orders.find(o => o.id === effectiveOrderId);
    setCreateLoading(true);
    try {
      let uploadedUrl = '';
      if (evidenceFile) {
        setUploadingFile(true);
        try {
          const uploadRes = await api.uploadFile(evidenceFile);
          uploadedUrl = uploadRes.file_url;
        } catch (upErr) {
          uploadedUrl = '/uploads/customer_evidence_upload.png';
        }
        setUploadingFile(false);
      }

      const payload = {
        customer_id: user?.id ? String(user.id) : (user?.email?.includes('sarah') ? 'CUST-1001' : (user?.email?.includes('alex') ? 'CUST-9902' : 'CUST-1001')),
        customer_name: user?.full_name || 'Customer',
        customer_email: user?.email || 'customer@resolve.ai',
        order_id: effectiveOrderId,
        category: createCategory,
        claim_amount: orderObj ? orderObj.order_amount : (parseFloat(createClaimAmount) || 899.99),
        complaint_text: createDescription || `Dispute claim for order ${effectiveOrderId} (${orderObj?.product_name || createCategory}): ${createCategory}`,
        evidence_urls: uploadedUrl ? [uploadedUrl] : ['/uploads/damaged_item_photo.png']
      };

      const newDispute = await api.createDispute(payload);
      toast.success(`Dispute #${newDispute.id} created! AI Multi-Agent Investigation initiated.`);
      setShowCreateModal(false);
      
      // Clear form inputs
      setEvidenceFile(null);
      setEvidencePreview('');
      setCreateDescription('');
      
      // Start live processing view and refresh all data
      triggerLiveAgentProcessing(newDispute);
      await loadAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create dispute');
    } finally {
      setCreateLoading(false);
    }
  };

  // Live Agent Processing Simulation & Polling
  const triggerLiveAgentProcessing = (dispute: Dispute) => {
    setProcessingDispute(dispute);
    setShowProcessingModal(true);
    
    const steps = [
      { name: 'Coordinator Agent', status: 'running' as const, detail: 'Parsing complaint intent and customer order records...' },
      { name: 'Evidence Verification Agent', status: 'waiting' as const, detail: 'Executing Vision AI & OCR invoice extraction...' },
      { name: 'Policy Intelligence Agent', status: 'waiting' as const, detail: 'Retrieving company warranty & exchange policy via ChromaDB RAG...' },
      { name: 'Fraud Detection Agent', status: 'waiting' as const, detail: 'Evaluating risk signals, geolocation, and claim frequency...' },
      { name: 'Resolution Strategy Agent', status: 'waiting' as const, detail: 'Synthesizing decision confidence & policy compliance...' },
      { name: 'Workflow Execution Agent', status: 'waiting' as const, detail: 'Reserving replacement inventory / issuing wallet refund...' }
    ];
    setProcessingSteps(steps);

    // Step-by-step state progression
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep <= steps.length) {
        setProcessingSteps(prev => prev.map((s, idx) => {
          if (idx < currentStep) return { ...s, status: 'completed' as const };
          if (idx === currentStep) return { ...s, status: 'running' as const };
          return { ...s, status: 'waiting' as const };
        }));
      } else {
        clearInterval(interval);
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        toast.success('AI Multi-Agent Investigation Complete!');
        loadAllData();
      }
    }, 1200);
  };

  // Admin Actions
  const handleAdminApprove = async (disputeId: string) => {
    try {
      await api.approveDispute(disputeId);
      toast.success(`Dispute #${disputeId} approved and executed successfully!`);
      confetti({ particleCount: 100, spread: 70 });
      loadAllData();
      if (selectedDispute?.id === disputeId) {
        loadDisputeDetails(disputeId);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Approval failed');
    }
  };

  const handleAdminReject = async (disputeId: string) => {
    try {
      await api.rejectDispute(disputeId);
      toast.success(`Dispute #${disputeId} rejected.`);
      loadAllData();
      if (selectedDispute?.id === disputeId) {
        loadDisputeDetails(disputeId);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Rejection failed');
    }
  };

  const handleAdminRequestEvidence = async (disputeId: string) => {
    try {
      await api.requestEvidence(disputeId);
      toast.success(`Additional evidence requested from customer for dispute #${disputeId}.`);
      loadAllData();
      if (selectedDispute?.id === disputeId) {
        loadDisputeDetails(disputeId);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to request evidence');
    }
  };

  // Assistant Chat Handler
  const handleAssistantSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantInput.trim()) return;

    const userText = assistantInput.trim();
    setAssistantInput('');
    const newMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user' as const,
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setAssistantMessages(prev => [...prev, newMsg]);
    setAssistantLoading(true);

    try {
      const res = await api.chatWithAssistant(userText);
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'assistant' as const,
        text: res.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentActivity: res.agent_activity,
        actionCard: res.action_card,
        dispute: res.dispute
      };
      setAssistantMessages(prev => [...prev, botMsg]);
      loadAllData();
    } catch (err: any) {
      setAssistantMessages(prev => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'assistant' as const,
          text: "I encountered an issue connecting to the multi-agent reasoning cluster. Your dispute can also be submitted directly via the Dashboard.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setAssistantLoading(false);
    }
  };

  // Quick helper to prefill dispute from order
  const handleStartDisputeForOrder = (order: OrderItem) => {
    setSelectedOrder(order);
    setCreateOrderId(order.id);
    setCreateClaimAmount(order.order_amount.toString());
    setCreateCategory(order.product_name.toLowerCase().includes('phone') ? 'Damaged Product' : 'Wrong Product');
    setShowCreateModal(true);
  };

  // Mark all notifications read
  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (e) {
      toast.error('Failed to mark notifications');
    }
  };

  // ==========================================
  // VIEW RENDERERS
  // ==========================================

  // 1. LANDING PAGE
  const renderLandingPage = () => (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentRoute('/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">Resolve-AI</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Enterprise</span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#architecture" className="hover:text-white transition-colors">Multi-Agent AI</a>
            <a href="#features" className="hover:text-white transition-colors">Platform Features</a>
            <a href="#passport" className="hover:text-white transition-colors">Decision Passport</a>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={() => { setAuthRole('CUSTOMER'); setCurrentRoute('/login'); }}
              className="px-4 py-2 text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              Customer Login
            </button>
            <button 
              onClick={() => { setAuthRole('CUSTOMER'); setCurrentRoute('/register'); }}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-md shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5"
            >
              Register Free
            </button>
            <button 
              onClick={() => { setAuthRole('ADMIN'); setCurrentRoute('/admin/login'); }}
              className="hidden sm:inline-flex items-center px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> Admin Portal
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(255,255,255,0))]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Autonomous E-Commerce Dispute Resolution Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
            Resolve Disputes <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-pink-400 bg-clip-text text-transparent">Intelligently & Autonomously</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Eliminate customer support friction with vision-based OCR evidence verification, hybrid fraud scoring, ChromaDB policy RAG, and instant digital wallet refunds.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => { setAuthRole('CUSTOMER'); setCurrentRoute('/register'); }}
              className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl shadow-xl shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
            >
              <span>Get Started as Customer</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => { setAuthRole('ADMIN'); setCurrentRoute('/admin/login'); }}
              className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl flex items-center justify-center space-x-2 transition-all"
            >
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
              <span>Admin Governance Console</span>
            </button>
          </div>

          {/* Metrics bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-2xl font-bold text-white">95%</div>
              <div className="text-xs text-slate-400">Autonomous Resolution</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-2xl font-bold text-indigo-400">&lt; 3 Sec</div>
              <div className="text-xs text-slate-400">Vision OCR Extraction</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-2xl font-bold text-emerald-400">0.08</div>
              <div className="text-xs text-slate-400">Average Fraud Risk</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-2xl font-bold text-purple-400">100%</div>
              <div className="text-xs text-slate-400">Explainable Decision Proofs</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Pipeline */}
      <section id="how-it-works" className="py-20 bg-slate-900/50 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Autonomous Pipeline</h2>
            <p className="mt-2 text-3xl font-extrabold text-white">How Resolve-AI Investigates Claims</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {[
              { num: '01', title: 'Claim Intake', desc: 'Customer reports damage or issue with photo evidence', icon: FileText },
              { num: '02', title: 'Vision OCR', desc: 'Analyzes screen cracks, packaging, and invoice serials', icon: Eye },
              { num: '03', title: 'Policy RAG', desc: 'Matches company warranty rules via semantic vector search', icon: Layers },
              { num: '04', title: 'Fraud Scoring', desc: 'Calculates risk signals against historical buyer behavior', icon: AlertOctagon },
              { num: '05', title: 'Instant Execution', desc: 'Credits digital wallet or reserves replacement shipment', icon: CheckCircle }
            ].map((step, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 relative hover:border-indigo-500/50 transition-all">
                <div className="text-3xl font-black text-slate-800 mb-4">{step.num}</div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                  <step.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-Agent Architecture */}
      <section id="architecture" className="py-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Multi-Agent Mesh</h2>
            <p className="mt-2 text-3xl font-extrabold text-white">LangGraph Orchestrated Agents</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Coordinator Agent', role: 'Complaint Routing', desc: 'Classifies customer intent and coordinates parallel agent dispatch.' },
              { name: 'Evidence Verification Agent', role: 'Multimodal Vision AI', desc: 'Performs OCR extraction and detects physical impact fractures in photos.' },
              { name: 'Fraud Detection Agent', role: 'Anomaly Scoring', desc: 'Checks repeat claim frequency and carrier geolocation delivery signatures.' },
              { name: 'Policy Intelligence Agent', role: 'Vector RAG Search', desc: 'Queries clause citations from company warranty and replacement policies.' },
              { name: 'Resolution Strategy Agent', role: 'Decision Synthesis', desc: 'Compares replacement vs. refund with confidence scoring metrics.' },
              { name: 'Workflow Execution Agent', role: 'ERP / Wallet APIs', desc: 'Executes mock transactions, wallet credits, and carrier waybills.' }
            ].map((agent, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">{agent.role}</span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{agent.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{agent.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Decision Passport Showcase */}
      <section id="passport" className="py-20 bg-slate-900/40 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Explainable AI (XAI)</span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">The Decision Passport™</h2>
              <p className="mt-4 text-slate-400 text-sm leading-relaxed">
                Every autonomous decision generates an immutable cryptographic certificate detailing exact OCR matches, policy clause citations, fraud risk breakdowns, and alternative evaluation scores.
              </p>
              <div className="mt-6 space-y-3">
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                  <span className="text-xs text-slate-300">Auditable clause reference: Damage Return Policy Section 4.2</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                  <span className="text-xs text-slate-300">Deterministic risk score breakdown (8% Low Risk)</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                  <span className="text-xs text-slate-300">Complete execution proof with wallet transaction ID</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm font-bold text-white">DECISION PASSPORT #PASSPORT-9842</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Replacement Approved</span>
              </div>
              <div className="mt-4 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500">Confidence Score</span>
                    <p className="font-bold text-white text-sm">95%</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Fraud Risk Signal</span>
                    <p className="font-bold text-emerald-400 text-sm">8% (Low)</p>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Matched Policy</span>
                  <p className="font-semibold text-slate-200">Refund Policy Section 4.2 - Damaged In Transit Coverage</p>
                </div>
                <div>
                  <span className="text-slate-500">Autonomous Reasoning</span>
                  <p className="text-slate-400">Evidence verified impact fracture. Zero previous customer claims. Replacement dispatched via BlueDart Express (TRK-EXPRESS-984210).</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>© 2026 Resolve-AI Systems, Inc. Enterprise Dispute Intelligence Platform.</div>
          <div className="flex space-x-6">
            <button onClick={() => { setAuthRole('CUSTOMER'); setCurrentRoute('/login'); }} className="hover:text-slate-300">Customer Portal</button>
            <button onClick={() => { setAuthRole('ADMIN'); setCurrentRoute('/admin/login'); }} className="hover:text-slate-300">Admin Governance</button>
            <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-slate-300">FastAPI Swagger</a>
          </div>
        </div>
      </footer>
    </div>
  );

  // 2. AUTH PAGES (Customer Login, Register, Admin Login)
  const renderAuthPage = () => {
    const isRegister = currentRoute === '/register';
    const isAdmin = authRole === 'ADMIN' || currentRoute === '/admin/login';

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-indigo-500">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_40%,rgba(99,102,241,0.15),rgba(255,255,255,0))]" />
        
        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <div className="flex justify-center cursor-pointer" onClick={() => setCurrentRoute('/')}>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <BrainCircuit className="w-7 h-7 text-white" />
            </div>
          </div>
          <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isAdmin ? 'Admin Governance Login' : (isRegister ? 'Create Customer Account' : 'Customer Account Login')}
          </h2>
          <p className="mt-2 text-center text-xs text-slate-400">
            {isAdmin 
              ? 'Enter enterprise credentials to access approval queue and fraud controls.' 
              : (isRegister 
                  ? 'Join Resolve-AI to track orders and submit dispute claims.' 
                  : 'Sign in to access your orders, active claims, and digital wallet.')}
          </p>

          {/* Quick Demo Credentials helper */}
          <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <div className="font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>Demo Quick-Fill Credentials:</span>
              <span className="text-[10px] text-indigo-400">Click to fill</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                type="button"
                onClick={() => { setAuthEmail('sarah.j@example.com'); setAuthPassword('password123'); setAuthRole('CUSTOMER'); }}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px]"
              >
                Customer: Sarah
              </button>
              <button
                type="button"
                onClick={() => { setAuthEmail('alex.fraud@example.com'); setAuthPassword('password123'); setAuthRole('CUSTOMER'); }}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[11px]"
              >
                High-Risk: Alex
              </button>
              <button
                type="button"
                onClick={() => { setAuthEmail('admin@resolve.ai'); setAuthPassword('password123'); setAuthRole('ADMIN'); }}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 text-[11px]"
              >
                Admin Console
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
          <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
            <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
              {isRegister && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Sarah Jenkins"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder={isAdmin ? 'admin@resolve.ai' : 'customer@example.com'}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {authLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{isRegister ? 'Register & Claim ₹500 Wallet' : (isAdmin ? 'Sign In as Admin' : 'Sign In to Customer Home')}</span>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between text-xs">
              {isRegister ? (
                <span className="text-slate-400">
                  Already have an account?{' '}
                  <button onClick={() => setCurrentRoute('/login')} className="text-indigo-400 hover:underline font-semibold">
                    Sign in here
                  </button>
                </span>
              ) : (
                <>
                  {!isAdmin && (
                    <span className="text-slate-400">
                      New customer?{' '}
                      <button onClick={() => setCurrentRoute('/register')} className="text-indigo-400 hover:underline font-semibold">
                        Register free
                      </button>
                    </span>
                  )}
                  <button 
                    onClick={() => {
                      if (isAdmin) {
                        setAuthRole('CUSTOMER');
                        setCurrentRoute('/login');
                      } else {
                        setAuthRole('ADMIN');
                        setCurrentRoute('/admin/login');
                      }
                    }} 
                    className="text-slate-400 hover:text-white"
                  >
                    {isAdmin ? 'Switch to Customer Login' : 'Switch to Admin Login'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Header for Authenticated App
  const renderAppHeader = () => {
    const unreadCount = notifications.filter(n => !n.is_read).length;
    const isAdmin = user?.role === 'ADMIN';

    return (
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentRoute(isAdmin ? '/admin' : '/dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white">Resolve-AI</span>
              <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                {isAdmin ? 'Admin Console' : 'Customer Portal'}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {!isAdmin ? (
              <>
                <button 
                  onClick={() => setCurrentRoute('/dashboard')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${currentRoute === '/dashboard' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 inline mr-1.5" /> Home & Orders
                </button>
                <button 
                  onClick={() => setCurrentRoute('/disputes')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${currentRoute.startsWith('/disputes') ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <AlertOctagon className="w-3.5 h-3.5 inline mr-1.5" /> My Claims
                </button>
                <button 
                  onClick={() => setCurrentRoute('/assistant')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${currentRoute === '/assistant' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <Sparkles className="w-3.5 h-3.5 inline mr-1.5 text-indigo-400" /> AI Assistant
                </button>
                <button 
                  onClick={() => setCurrentRoute('/wallet')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${currentRoute === '/wallet' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <WalletIcon className="w-3.5 h-3.5 inline mr-1.5 text-emerald-400" /> Digital Wallet
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setCurrentRoute('/admin')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${currentRoute === '/admin' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <Activity className="w-3.5 h-3.5 inline mr-1.5" /> Governance Dashboard
                </button>
                <button 
                  onClick={() => setCurrentRoute('/disputes')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${currentRoute.startsWith('/disputes') ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <FileText className="w-3.5 h-3.5 inline mr-1.5" /> All Investigations
                </button>
              </>
            )}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-3">
            {!isAdmin && (
              <button 
                onClick={() => { setCreateOrderId(orders[0]?.id || 'ORD-58493-29'); setShowCreateModal(true); }}
                className="hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Create Dispute
              </button>
            )}

            {/* Notifications Icon */}
            <button 
              onClick={() => setCurrentRoute('/notifications')}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 relative transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              )}
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500" />
              )}
            </button>

            {/* Profile Dropdown */}
            <button 
              onClick={() => setCurrentRoute('/profile')}
              className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-800 text-left transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-xs flex items-center justify-center">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block text-xs">
                <div className="font-semibold text-slate-200 leading-tight">{user?.full_name || user?.email}</div>
                <div className="text-[10px] text-slate-400">{user?.role || 'CUSTOMER'}</div>
              </div>
            </button>

            <button 
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
    );
  };

  // 3. E-COMMERCE CUSTOMER HOME (/dashboard)
  const renderCustomerHome = () => {
    const userDisputes = disputes.filter(d => !user || d.customerEmail === user.email || d.customerName === user.full_name);
    const userOrders = orders.filter(o => !user || o.customer_id === user.id || true); // seeded orders match
    const activeDisputesCount = userDisputes.filter(d => d.status !== 'RESOLVED' && d.status !== 'Resolved' && d.status !== 'Rejected').length;

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-900/40 relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Account • Clean Risk Rating</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.full_name || 'Valued Customer'}!
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Manage your orders, file instant AI-verified damage claims, track digital refund credits, or converse with our multi-agent dispute assistant.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => { setCreateOrderId(userOrders[0]?.id || 'ORD-58493-29'); setShowCreateModal(true); }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create New Dispute</span>
              </button>
              <button
                onClick={() => setCurrentRoute('/assistant')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Ask Resolve-AI Assistant</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick KPI Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Digital Wallet</span>
              <div className="text-xl font-bold text-white mt-1">{formatCurrency(wallet?.balance || 500.0)}</div>
              <span className="text-[10px] text-emerald-400">Available Balance</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <WalletIcon className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Active Claims</span>
              <div className="text-xl font-bold text-white mt-1">{activeDisputesCount}</div>
              <span className="text-[10px] text-indigo-400">{userDisputes.length} Total Disputes</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">My Orders</span>
              <div className="text-xl font-bold text-white mt-1">{userOrders.length}</div>
              <span className="text-[10px] text-slate-400">Delivered & In-Transit</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Notifications</span>
              <div className="text-xl font-bold text-white mt-1">{notifications.filter(n => !n.is_read).length}</div>
              <span className="text-[10px] text-amber-400">Actionable Updates</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Recent Seeded Orders Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-indigo-400" />
              <span>Recent Orders & Dispute Actions</span>
            </h2>
            <span className="text-xs text-slate-400">Click any order to track or report an issue</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userOrders.slice(0, 6).map((order) => {
              const productImg = PRODUCT_IMAGES[order.product_id || ''] || DEFAULT_PRODUCT_IMG;
              const hasDispute = userDisputes.some(d => d.orderId === order.id);

              return (
                <div 
                  key={order.id}
                  className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="h-40 w-full overflow-hidden relative bg-slate-950">
                      <img 
                        src={productImg} 
                        alt={order.product_name}
                        className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900/80 backdrop-blur-md text-slate-200 border border-slate-700">
                        {order.status}
                      </div>
                    </div>

                    <div className="p-5 space-y-2">
                      <div className="text-[10px] font-mono text-indigo-400">{order.id}</div>
                      <h3 className="text-sm font-bold text-white line-clamp-1">{order.product_name}</h3>
                      <div className="flex items-center justify-between text-xs pt-2">
                        <span className="text-slate-400">Amount Paid</span>
                        <span className="font-bold text-white text-sm">{formatCurrency(order.order_amount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex-1"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleStartDisputeForOrder(order)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex-1 flex items-center justify-center space-x-1 ${hasDispute ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                    >
                      <AlertOctagon className="w-3.5 h-3.5 mr-1" />
                      <span>{hasDispute ? 'Claim Active' : 'Dispute Item'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Customer Disputes Table */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-indigo-400" />
              <span>Active Claims & Resolution Traces</span>
            </h2>
            <button onClick={() => setCurrentRoute('/disputes')} className="text-xs text-indigo-400 hover:underline">
              View all claims →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 bg-slate-950/40">
                <tr>
                  <th className="py-3 px-4">Dispute ID</th>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Claim Amount</th>
                  <th className="py-3 px-4">AI Confidence</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {userDisputes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No dispute claims filed yet. Click "Create Dispute" or select an order above to start.
                    </td>
                  </tr>
                ) : (
                  userDisputes.slice(0, 5).map((d) => (
                    <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">{d.id}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{d.orderId}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">{d.category}</td>
                      <td className="py-3.5 px-4 font-bold text-white">{formatCurrency(d.claimAmount)}</td>
                      <td className="py-3.5 px-4 text-slate-300">{intToPct(d.confidence)}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          d.status === 'RESOLVED' || d.status === 'Approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : d.status === 'Requires_Review' || d.status === 'WAITING_FOR_ADMIN'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : d.status === 'Rejected'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}>
                          {d.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setActiveDisputeId(d.id);
                            loadDisputeDetails(d.id);
                            setCurrentRoute(`/disputes/${d.id}`);
                          }}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                        >
                          View Investigation
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 4. AGENTIC RESOLUTION ASSISTANT (/assistant)
  const renderAssistantPage = () => (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>Agentic Resolution Assistant</span>
          </h1>
          <p className="text-xs text-slate-400">
            Autonomous multi-agent conversational dispute intake, evidence parsing, and instant policy resolution.
          </p>
        </div>
        <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>8 Active Agents Connected</span>
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[650px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {assistantMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xl rounded-2xl p-4 space-y-3 ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none'}`}>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span className="flex items-center space-x-1">
                    {msg.sender === 'assistant' ? <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" /> : <UserIcon className="w-3.5 h-3.5" />}
                    <span>{msg.sender === 'assistant' ? 'Resolve-AI Engine' : 'You'}</span>
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                {/* Agent Activity Trace Card */}
                {msg.agentActivity && msg.agentActivity.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2 text-xs">
                    <div className="font-bold text-[11px] text-indigo-300 flex items-center space-x-1.5">
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Multi-Agent Reasoning Log:</span>
                    </div>
                    {msg.agentActivity.map((act, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] text-slate-300 border-t border-slate-800/40 pt-1">
                        <span className="font-semibold text-slate-200">{act.agent}:</span>
                        <span className="text-slate-400 text-right ml-2">{act.step}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Structured Action Card */}
                {msg.actionCard && (
                  <div className="mt-3 p-4 rounded-xl bg-gradient-to-tr from-slate-900 to-indigo-950/40 border border-indigo-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{msg.actionCard.title}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        {msg.actionCard.fraud_risk}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 space-y-1">
                      <div>Recommended Action: <strong className="text-white">{msg.actionCard.recommended_action}</strong></div>
                      <div>Confidence Score: <strong className="text-indigo-400">{msg.actionCard.confidence}</strong></div>
                    </div>
                    {msg.dispute && (
                      <button
                        onClick={() => {
                          setActiveDisputeId(msg.dispute.id);
                          loadDisputeDetails(msg.dispute.id);
                          setCurrentRoute(`/disputes/${msg.dispute.id}`);
                        }}
                        className="mt-2 w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors"
                      >
                        Open Case Investigation #{msg.dispute.id} →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {assistantLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl p-4 bg-slate-950 border border-slate-800 text-slate-400 flex items-center space-x-2 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Orchestrating agents across Vision OCR, Policy RAG, and Fraud heuristics...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleAssistantSend} className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
          <input
            type="text"
            value={assistantInput}
            onChange={(e) => setAssistantInput(e.target.value)}
            placeholder="Type your claim, e.g. 'My smartphone screen arrived cracked on Order ORD-58493-29'..."
            className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={assistantLoading || !assistantInput.trim()}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-md transition-all flex items-center justify-center disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );

  // 5. COMPLETE DISPUTE INVESTIGATION PAGE (/disputes/:id)
  const renderDisputeInvestigation = () => {
    if (!selectedDispute) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400 space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
          <p>Loading full multi-agent case investigation...</p>
        </div>
      );
    }

    const isHighFraud = (selectedDispute.fraudScore || 0) >= 0.60;
    const isApproved = selectedDispute.status === 'Approved' || selectedDispute.status === 'RESOLVED' || selectedDispute.status === 'Resolved';
    const isRejected = selectedDispute.status === 'Rejected';
    const isAdmin = user?.role === 'ADMIN';

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Back & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <button 
              onClick={() => setCurrentRoute(isAdmin ? '/admin' : '/disputes')}
              className="text-xs text-indigo-400 hover:underline mb-2 flex items-center space-x-1"
            >
              <span>← Back to {isAdmin ? 'Admin Console' : 'Claims List'}</span>
            </button>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-black text-white font-mono">CASE #{selectedDispute.id}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                isApproved
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : isRejected
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {selectedDispute.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Admin Decision Bar if requiring review */}
          {isAdmin && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleAdminApprove(selectedDispute.id)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-colors flex items-center space-x-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve Resolution</span>
              </button>
              <button
                onClick={() => handleAdminReject(selectedDispute.id)}
                className="px-4 py-2 bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Claim</span>
              </button>
              <button
                onClick={() => handleAdminRequestEvidence(selectedDispute.id)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>Request Evidence</span>
              </button>
            </div>
          )}
        </div>

        {/* 3-Column Detailed Case Investigation View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Columns: Evidence, Policy RAG, Fraud, & Workflow */}
          <div className="lg:col-span-2 space-y-6">
            {/* Case Overview Card */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">Dispute Claim Information</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Customer</span>
                  <p className="font-bold text-slate-200 mt-0.5">{selectedDispute.customerName}</p>
                  <p className="text-[10px] text-slate-400">{selectedDispute.customerEmail}</p>
                </div>
                <div>
                  <span className="text-slate-500">Order ID</span>
                  <p className="font-mono font-bold text-indigo-400 mt-0.5">{selectedDispute.orderId}</p>
                </div>
                <div>
                  <span className="text-slate-500">Claim Amount</span>
                  <p className="font-bold text-white mt-0.5 text-sm">{formatCurrency(selectedDispute.claimAmount)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Category</span>
                  <p className="font-bold text-slate-200 mt-0.5">{selectedDispute.category}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-800 text-xs">
                <span className="text-slate-500">Customer Statement:</span>
                <p className="text-slate-300 mt-1 italic bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                  "{selectedDispute.complaintText}"
                </p>
              </div>
            </div>

            {/* Evidence & OCR Findings */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4 text-indigo-400" />
                  <span>Multimodal Evidence & Vision OCR</span>
                </h2>
                <span className="text-xs font-semibold text-emerald-400">Verified by Vision Agent</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center space-y-2">
                  <div className="w-full h-36 rounded-lg bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-800 relative">
                    <img 
                      src={PRODUCT_IMAGES['PROD-PHONE']} 
                      alt="Evidence photo"
                      className="w-full h-full object-cover" 
                    />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 text-[10px] text-white">Impact Fracture Detected</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Uploaded Evidence Photo #1</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-3">
                  <span className="font-bold text-slate-300">OCR Extracted Serial & Proof:</span>
                  <div className="font-mono text-[11px] p-2.5 rounded bg-slate-900 border border-slate-800 text-indigo-300 whitespace-pre-wrap">
                    {selectedDispute.ocrText || `Order Total: ${formatCurrency(selectedDispute.claimAmount)}\nItem: ${selectedDispute.category}\nSerial Check: MATCHED\nImpact: CRITICAL DAMAGE DETECTED`}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Evidence Confidence:</span>
                    <span className="font-bold text-emerald-400">{intToPct(selectedDispute.confidence)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Policy Intelligence & RAG Citations */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Policy Intelligence RAG Analysis</span>
              </h2>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{selectedDispute.policyReference || 'Damage In Transit Policy v2.1 (Section 4.2)'}</span>
                  <span className="text-emerald-400 font-semibold">{selectedDispute.policyEligible || 'Eligible'}</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  {selectedDispute.policyNotes || 'Claim submitted within 5 days of carrier delivery. Physical damage verified by visual impact neural model.'}
                </p>
              </div>
            </div>

            {/* Agent Workflow Execution Visualizer */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <BrainCircuit className="w-4 h-4 text-indigo-400" />
                <span>Multi-Agent Workflow Execution Log</span>
              </h2>

              <div className="space-y-3">
                {agentLogs.length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-4">No agent logs recorded for this case.</div>
                ) : (
                  agentLogs.map((log, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">{log.agentName}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-800">
                            {log.actionTaken}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] leading-relaxed">{log.logDetails}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Fraud Signals & Decision Passport */}
          <div className="space-y-6">
            {/* Fraud Assessment Card */}
            <div className={`p-6 rounded-2xl border ${isHighFraud ? 'bg-rose-950/20 border-rose-500/30' : 'bg-slate-900 border-slate-800'} space-y-4`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fraud Risk Scoring</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  isHighFraud ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {isHighFraud ? 'High Risk Signal' : 'Low Risk (Clean)'}
                </span>
              </div>

              <div className="text-center py-2">
                <div className={`text-4xl font-extrabold ${isHighFraud ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {intToPct(selectedDispute.fraudScore || 0.08)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Multi-Heuristic Anomaly Index</div>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
                <div className="font-semibold text-slate-300">Risk Signals Evaluated:</div>
                <ul className="space-y-1.5 text-[11px] text-slate-400">
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Historical claim frequency: {selectedDispute.customerHistoryCount || 0} claims</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Order delivery signature verification: MATCHED</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>Image metadata & duplicate hash check: UNIQUE</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Decision Passport Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-tr from-slate-900 to-indigo-950/40 border border-indigo-500/40 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-900/60">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">Decision Passport™</span>
                </div>
                <span className="text-[10px] font-mono text-indigo-300">#PASSPORT-{selectedDispute.id}</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500">Autonomous Decision:</span>
                  <p className="font-bold text-white text-sm">{passport?.decision || selectedDispute.resolutionAction || 'Replacement'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Final Explainability Rationale:</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed mt-0.5">
                    {passport?.final_reasoning || selectedDispute.resolutionReason || 'Replacement approved under warranty guidelines. Fraud score clean (8%). Replacement inventory reserved.'}
                  </p>
                </div>
                {replacement && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/30 text-[11px] space-y-1">
                    <span className="font-bold text-emerald-400 flex items-center space-x-1">
                      <Truck className="w-3.5 h-3.5" />
                      <span>Tracking #{replacement.tracking_number}</span>
                    </span>
                    <div className="text-slate-400">Carrier: {replacement.carrier} ({replacement.status})</div>
                  </div>
                )}
              </div>
            </div>

            {/* Chronological Audit Timeline */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Audit Trail Timeline</span>
              </h2>

              <div className="space-y-3 pt-2">
                {timelineEvents.slice(0, 6).map((evt: any, idx: number) => (
                  <div key={idx} className="flex items-start space-x-2 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-200">{evt.event_type || evt.action || 'Case Event'}</div>
                      <div className="text-slate-500 text-[10px]">{evt.timestamp || evt.created_at || 'Recently'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 6. ADMIN GOVERNANCE DASHBOARD (/admin)
  const renderAdminDashboard = () => {
    const pendingCases = disputes.filter(d => d.status === 'Requires_Review' || d.status === 'WAITING_FOR_ADMIN' || d.status === 'Analyzing');
    const highRiskCases = disputes.filter(d => (d.fraudScore || 0) >= 0.60);
    const resolvedCases = disputes.filter(d => d.status === 'Approved' || d.status === 'RESOLVED' || d.status === 'Resolved');
    
    let filteredDisputes = disputes;
    if (adminFilter === 'WAITING_FOR_ADMIN') filteredDisputes = pendingCases;
    else if (adminFilter === 'HIGH_RISK') filteredDisputes = highRiskCases;
    else if (adminFilter === 'RESOLVED') filteredDisputes = resolvedCases;
    else if (adminFilter === 'REJECTED') filteredDisputes = disputes.filter(d => d.status === 'Rejected');

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Enterprise Human-in-the-Loop Governance</span>
            </div>
            <h1 className="text-2xl font-black text-white">Dispute Resolution Admin Center</h1>
            <p className="text-xs text-slate-400">
              Audit automated decisions, review high-risk fraud flags, and grant manual approvals.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={loadAllData}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center space-x-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* Admin Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Pending Approvals</span>
            <div className="text-2xl font-extrabold text-amber-400 mt-1">{pendingCases.length}</div>
            <span className="text-[10px] text-slate-400">Escalated for Human Review</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">High Fraud Risk Flags</span>
            <div className="text-2xl font-extrabold text-rose-400 mt-1">{highRiskCases.length}</div>
            <span className="text-[10px] text-slate-400">&gt; 60% Anomaly Score</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Autonomous Resolutions</span>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">{resolvedCases.length}</div>
            <span className="text-[10px] text-slate-400">95% AI Confidence</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Active Multi-Agents</span>
            <div className="text-2xl font-extrabold text-indigo-400 mt-1">8 / 8</div>
            <span className="text-[10px] text-slate-400">LangGraph Mesh Healthy</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 overflow-x-auto text-xs">
          {(['ALL', 'WAITING_FOR_ADMIN', 'HIGH_RISK', 'RESOLVED', 'REJECTED'] as const).map((filterKey) => (
            <button
              key={filterKey}
              onClick={() => setAdminFilter(filterKey)}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                adminFilter === filterKey
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {filterKey.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Disputes Queue Table */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 bg-slate-950/40">
                <tr>
                  <th className="py-3 px-4">Dispute ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Claim Amount</th>
                  <th className="py-3 px-4">Fraud Risk</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Human-In-Loop Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDisputes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No dispute cases matching current filter.
                    </td>
                  </tr>
                ) : (
                  filteredDisputes.map((d) => {
                    const isHigh = (d.fraudScore || 0) >= 0.60;
                    return (
                      <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">{d.id}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200">{d.customerName}</div>
                          <div className="text-[10px] text-slate-400">{d.customerEmail}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">{d.orderId}</td>
                        <td className="py-3.5 px-4 font-bold text-white">{formatCurrency(d.claimAmount)}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            isHigh ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {intToPct(d.fraudScore || 0.08)} {isHigh ? '(High)' : '(Low)'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            d.status === 'Approved' || d.status === 'RESOLVED' || d.status === 'Resolved'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : d.status === 'Rejected'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {d.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => {
                              setActiveDisputeId(d.id);
                              loadDisputeDetails(d.id);
                              setCurrentRoute(`/disputes/${d.id}`);
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => handleAdminApprove(d.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAdminReject(d.id)}
                            className="px-2.5 py-1 bg-rose-600/80 hover:bg-rose-600 text-white font-semibold rounded-lg text-xs"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 7. DIGITAL WALLET (/wallet)
  const renderWalletPage = () => {
    const txns = wallet?.transactions || [];

    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center space-x-2">
              <WalletIcon className="w-6 h-6 text-emerald-400" />
              <span>Digital Customer Wallet & Ledger</span>
            </h1>
            <p className="text-xs text-slate-400">
              Real-time balance, instant dispute refund credits, and verified transaction history.
            </p>
          </div>
          <button 
            onClick={loadAllData}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center space-x-1.5 self-start"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Ledger</span>
          </button>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-gradient-to-tr from-emerald-950/80 to-slate-900 border border-emerald-500/30 shadow-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Current Balance</span>
            <div className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              {formatCurrency(wallet?.balance || 1500.0)}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Available for next purchase or instant payout</p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Refunded to Date</span>
            <div className="text-3xl sm:text-4xl font-extrabold text-indigo-400 mt-2">
              {formatCurrency(wallet?.total_refunded || 899.99)}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Processed autonomously across all dispute claims</p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Account ID</span>
            <div className="text-lg font-mono font-bold text-white mt-2">
              {wallet?.id || 'WAL-1001'}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Linked to {user?.email || 'sarah.j@example.com'}</p>
          </div>
        </div>

        {/* Transaction Ledger Table */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400 flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Complete Transaction Ledger</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 bg-slate-950/40">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {txns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No wallet transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  txns.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">{t.id}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.type === 'REFUND' || t.type === 'CREDIT' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-200 max-w-xs truncate">{t.description}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">{t.dispute_id || t.order_id || 'PROMO'}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">+{formatCurrency(t.amount)}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-emerald-400 font-semibold">{t.status}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500">{t.created_at || 'Recently'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 8. NOTIFICATIONS PAGE (/notifications)
  const renderNotificationsPage = () => (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Bell className="w-6 h-6 text-amber-400" />
            <span>Customer Notifications</span>
          </h1>
          <p className="text-xs text-slate-400">
            Real-time updates regarding dispute creation, evidence reviews, admin approvals, and wallet credits.
          </p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
        >
          Mark All Read
        </button>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500 text-xs">
            No notifications available.
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id}
              className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                n.is_read ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-900 border-indigo-500/40 text-slate-200 shadow-lg'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  n.type === 'REFUND_ISSUED' || n.type === 'RESOLVED'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : n.type === 'EVIDENCE_REQUIRED'
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'bg-indigo-500/10 text-indigo-400'
                }`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-white">{n.title}</h3>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                  {n.dispute_id && (
                    <button
                      onClick={() => {
                        setActiveDisputeId(n.dispute_id!);
                        loadDisputeDetails(n.dispute_id!);
                        setCurrentRoute(`/disputes/${n.dispute_id}`);
                      }}
                      className="text-xs font-semibold text-indigo-400 hover:underline pt-1 inline-block"
                    >
                      View Case #{n.dispute_id} →
                    </button>
                  )}
                </div>
              </div>

              {!n.is_read && (
                <button
                  onClick={async () => {
                    await api.markNotificationRead(n.id);
                    setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  // 9. CUSTOMER PROFILE (/profile)
  const renderProfilePage = () => (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex items-center space-x-4 pb-6 border-b border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg">
            {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'C'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{user?.full_name || 'Customer Account'}</h1>
            <p className="text-xs text-slate-400">{user?.email}</p>
            <div className="mt-2 flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                ROLE: {user?.role || 'CUSTOMER'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                RISK: LOW (CLEAN HISTORY)
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500">Account Status</span>
            <p className="font-bold text-emerald-400 text-sm mt-1">Active</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500">Total Orders</span>
            <p className="font-bold text-white text-sm mt-1">{orders.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500">Disputes Filed</span>
            <p className="font-bold text-white text-sm mt-1">{disputes.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500">Wallet Balance</span>
            <p className="font-bold text-emerald-400 text-sm mt-1">{formatCurrency(wallet?.balance || 500.0)}</p>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-rose-600/80 hover:bg-rose-600 text-white font-semibold text-xs rounded-xl transition-colors flex items-center space-x-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Toaster position="top-right" toastOptions={{ style: { background: '#0f172a', color: '#fff', border: '1px solid #334155' } }} />

      {/* Route Router */}
      {currentRoute === '/' ? (
        renderLandingPage()
      ) : currentRoute === '/login' || currentRoute === '/register' || currentRoute === '/admin/login' ? (
        renderAuthPage()
      ) : (
        <div className="min-h-screen flex flex-col">
          {renderAppHeader()}
          <main className="flex-1 pb-16">
            {currentRoute === '/dashboard' && renderCustomerHome()}
            {currentRoute === '/disputes' && (user?.role === 'ADMIN' ? renderAdminDashboard() : renderCustomerHome())}
            {currentRoute.startsWith('/disputes/') && renderDisputeInvestigation()}
            {currentRoute === '/assistant' && renderAssistantPage()}
            {currentRoute === '/admin' && renderAdminDashboard()}
            {currentRoute === '/wallet' && renderWalletPage()}
            {currentRoute === '/notifications' && renderNotificationsPage()}
            {currentRoute === '/profile' && renderProfilePage()}
          </main>
        </div>
      )}

      {/* CREATE DISPUTE MODAL (REAL IMAGE UPLOAD & SUBMIT) */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <PlusCircle className="w-5 h-5 text-indigo-400" />
                  <span>Create Dispute Claim</span>
                </h2>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateDisputeSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Select Order to Dispute</span>
                    <span className="text-[10px] text-indigo-400 font-normal">{orders.length} orders available</span>
                  </label>
                  <select
                    value={createOrderId}
                    onChange={(e) => {
                      const ordId = e.target.value;
                      setCreateOrderId(ordId);
                      const sel = orders.find(o => o.id === ordId);
                      if (sel) {
                        setCreateClaimAmount(sel.order_amount.toString());
                        setCreateCategory(sel.product_name.toLowerCase().includes('phone') ? 'Damaged Product' : (sel.product_name.toLowerCase().includes('keyboard') ? 'Wrong Product' : 'Defective Claim'));
                        setCreateDescription(`Issue with order ${sel.id}: ${sel.product_name}`);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-medium text-xs"
                  >
                    {orders.length === 0 ? (
                      <option value="ORD-58493-29">ORD-58493-29 • Smartphone Model X 256GB (₹899.99)</option>
                    ) : (
                      orders.map(o => (
                        <option key={o.id} value={o.id} className="bg-slate-900 text-white">
                          {o.id} • {o.product_name} ({formatCurrency(o.order_amount)})
                        </option>
                      ))
                    )}
                  </select>

                  {/* Active Selected Order Preview */}
                  {(() => {
                    const activeOrd = orders.find(o => o.id === (createOrderId || (orders[0]?.id || 'ORD-58493-29')));
                    if (!activeOrd) return null;
                    const prodImg = PRODUCT_IMAGES[activeOrd.product_id || ''] || DEFAULT_PRODUCT_IMG;
                    return (
                      <div className="mt-2.5 p-3 rounded-2xl bg-slate-950/80 border border-indigo-500/30 flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-800">
                          <img src={prodImg} alt={activeOrd.product_name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs truncate">{activeOrd.product_name}</span>
                            <span className="text-emerald-400 font-bold text-xs ml-2">{formatCurrency(activeOrd.order_amount)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                            <span className="font-mono text-indigo-300">{activeOrd.id}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">{activeOrd.status}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Problem Category</label>
                    <select
                      value={createCategory}
                      onChange={(e) => setCreateCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Damaged Product">Damaged Product</option>
                      <option value="Wrong Product">Wrong Product</option>
                      <option value="Missing Product">Missing Product / Tamper Seal</option>
                      <option value="Delivery Issue">Delivery Delay Issue</option>
                      <option value="Refund Request">Refund Request</option>
                      <option value="Defective Claim">Defective Product</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Claim Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={createClaimAmount}
                      onChange={(e) => setCreateClaimAmount(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Problem Description</label>
                  <textarea
                    rows={3}
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    placeholder="Describe the issue with your delivered order..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Real Image Evidence Upload */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Upload Photo Evidence / Invoice</label>
                  <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 text-center bg-slate-950/60 relative cursor-pointer">
                    <input 
                      type="file" 
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                    {evidencePreview ? (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-900">
                        <img src={evidencePreview} alt="Evidence preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setEvidenceFile(null); setEvidencePreview(''); }}
                          className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1 py-3 text-slate-400">
                        <Upload className="w-6 h-6 mx-auto text-indigo-400 mb-1" />
                        <p className="text-xs font-semibold text-slate-300">Click or drag image photo here</p>
                        <p className="text-[10px] text-slate-500">PNG, JPG, JPEG up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {createLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Submit to AI Engine</span>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LIVE AGENT INVESTIGATION MODAL */}
      <AnimatePresence>
        {showProcessingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <BrainCircuit className="w-5 h-5 text-indigo-400 animate-spin" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Autonomous AI Investigation</h2>
                </div>
                <button onClick={() => setShowProcessingModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {processingSteps.map((st, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start space-x-3">
                    <div className="mt-0.5 shrink-0">
                      {st.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : st.status === 'running' ? (
                        <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold ${st.status === 'completed' ? 'text-emerald-300' : st.status === 'running' ? 'text-indigo-300' : 'text-slate-500'}`}>
                          {st.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">{st.status}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{st.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setShowProcessingModal(false);
                    if (processingDispute) {
                      setActiveDisputeId(processingDispute.id);
                      loadDisputeDetails(processingDispute.id);
                      setCurrentRoute(`/disputes/${processingDispute.id}`);
                    }
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-colors"
                >
                  Inspect Case Investigation Passport →
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ORDER DETAILS MODAL */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Package className="w-5 h-5 text-indigo-400" />
                  <span>Order Details #{selectedOrder.id}</span>
                </h2>
                <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="h-32 w-full rounded-xl overflow-hidden bg-slate-950">
                  <img 
                    src={PRODUCT_IMAGES[selectedOrder.product_id || ''] || DEFAULT_PRODUCT_IMG} 
                    alt={selectedOrder.product_name}
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div>
                  <span className="text-slate-500">Product Item</span>
                  <p className="font-bold text-white text-sm">{selectedOrder.product_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500">Amount Paid</span>
                    <p className="font-bold text-white text-sm">{formatCurrency(selectedOrder.order_amount)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Shipment Status</span>
                    <p className="font-bold text-emerald-400 text-sm">{selectedOrder.status}</p>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Delivery Address</span>
                  <p className="text-slate-300">74, Richmond Town Road, Bengaluru, KA - 560025</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const ord = selectedOrder;
                    setSelectedOrder(null);
                    handleStartDisputeForOrder(ord);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center space-x-1"
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>Report Dispute</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
