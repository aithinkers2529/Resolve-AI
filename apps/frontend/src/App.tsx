import { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Search, 
  AlertOctagon, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Zap, 
  Layers, 
  PlusCircle,
  Play,
  ShieldCheck,
  Building,
  Upload,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Info
} from 'lucide-react';
import { Dispute, DisputeStatus } from './types';
import api from './services/api';

// Initial pre-loaded demo dispute scenarios
const initialScenarios: Dispute[] = [
  {
    id: "DISP-9842",
    customerName: "Sarah Jenkins",
    customerEmail: "sarah.j@example.com",
    orderId: "ORD-58493-29",
    claimAmount: 899.99,
    complaintText: "My smartphone screen arrived cracked and shattered upon unboxing the package.",
    status: "Approved",
    fraudScore: 0.08,
    policyNotes: "Refund Policy Section 4.2 - Damaged In Transit Coverage: Products damaged during shipping are eligible for immediate replacement if reported within 30 days.",
    evidenceUrls: ["invoice_9842.pdf", "cracked_phone_photo.png"],
    resolutionAction: "Replacement",
    createdAt: "2026-08-07T10:14:00Z",
    updatedAt: "2026-08-07T11:20:00Z"
  },
  {
    id: "DISP-9843",
    customerName: "Alex Rivera",
    customerEmail: "alex.fraud@example.com",
    orderId: "ORD-98204-11",
    claimAmount: 1450.00,
    complaintText: "Claiming expensive laptop package never arrived, demanding immediate $1,450 cash refund.",
    status: "Requires_Review",
    fraudScore: 0.88,
    policyNotes: "Policy Section 8.1 - High Frequency Claim Audit: 5 previous refund claims within 30 days. Mandatory human verification triggered.",
    evidenceUrls: ["carrier_signature.png"],
    resolutionAction: "Escalate",
    createdAt: "2026-08-07T11:45:00Z",
    updatedAt: "2026-08-07T12:00:00Z"
  },
  {
    id: "DISP-9844",
    customerName: "David Chen",
    customerEmail: "dchen@techcorp.io",
    orderId: "ORD-10928-84",
    claimAmount: 320.00,
    complaintText: "Ordered a titanium mechanical keyboard, but received a plastic membrane keyboard instead.",
    status: "Resolved",
    fraudScore: 0.04,
    policyNotes: "Exchange Policy Section 2.3 - Fulfillment Error: Mismatched SKU verified by distribution center packing logs.",
    evidenceUrls: ["packing_slip.pdf"],
    resolutionAction: "Refund",
    createdAt: "2026-08-07T12:10:00Z",
    updatedAt: "2026-08-07T12:35:00Z"
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'admin' | 'customer'>('admin');
  const [disputes, setDisputes] = useState<Dispute[]>(initialScenarios);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(initialScenarios[0]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // New Complaint Form State (Customer Portal)
  const [newCategory, setNewCategory] = useState("Damaged Product");
  const [newComplaintText, setNewComplaintText] = useState("");
  const [newClaimAmount, setNewClaimAmount] = useState("450.00");
  const [newEvidenceFile, setNewEvidenceFile] = useState("damaged_item_photo.jpg");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Scenario Trigger
  const runDemoScenario = (scenarioIndex: number) => {
    const target = disputes[scenarioIndex] || initialScenarios[scenarioIndex];
    setSelectedDispute(target);
    setActiveTab('admin');
  };

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComplaintText.trim()) return;

    setIsSubmitting(true);
    const newId = `DISP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newDispute: Dispute = {
      id: newId,
      customerName: "John Doe (Customer)",
      customerEmail: "john.doe@example.com",
      orderId: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      claimAmount: parseFloat(newClaimAmount) || 299.99,
      complaintText: newComplaintText,
      status: "Approved",
      fraudScore: 0.09,
      policyNotes: "Refund Policy Section 4.2 - Damaged In Transit Coverage: Eligible for instant replacement.",
      evidenceUrls: [newEvidenceFile],
      resolutionAction: newCategory === "Damaged Product" ? "Replacement" : "Refund",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTimeout(() => {
      setDisputes([newDispute, ...disputes]);
      setSelectedDispute(newDispute);
      setIsSubmitting(false);
      setNewComplaintText("");
      setActiveTab('customer');
    }, 800);
  };

  const handleStatusChange = (id: string, newStatus: DisputeStatus, action: string) => {
    setDisputes(prev => prev.map(d => d.id === id ? { ...d, status: newStatus, resolutionAction: action } : d));
    if (selectedDispute && selectedDispute.id === id) {
      setSelectedDispute(prev => prev ? { ...prev, status: newStatus, resolutionAction: action } : null);
    }
  };

  const getStatusColor = (status: DisputeStatus) => {
    switch (status) {
      case 'New': return 'bg-blue-900/40 text-blue-300 border-blue-800';
      case 'Analyzing': return 'bg-cyan-900/40 text-cyan-300 border-cyan-800';
      case 'Fraud_Hold': return 'bg-red-950/60 text-red-400 border-red-900/80';
      case 'Policy_Validation': return 'bg-purple-900/40 text-purple-300 border-purple-800';
      case 'Requires_Review': return 'bg-amber-950/60 text-amber-400 border-amber-800/80';
      case 'Approved': return 'bg-green-900/40 text-green-300 border-green-800';
      case 'Rejected': return 'bg-slate-800 text-slate-400 border-slate-700';
      case 'Resolved': return 'bg-teal-900/40 text-teal-300 border-teal-800';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Banner Navigation & Quick Demo Scenario Selector */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-3 sticky top-0 z-50 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-xl shadow-lg shadow-indigo-500/20">
            <BrainCircuit className="h-6 w-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-wide text-white">Resolve-AI</h1>
              <span className="px-2 py-0.5 bg-indigo-900/80 border border-indigo-700/50 rounded text-[10px] font-mono font-bold text-indigo-300">
                Agentic Multi-Agent Demo
              </span>
            </div>
            <p className="text-xs text-slate-400">Autonomous Customer Dispute Resolution Platform</p>
          </div>
        </div>

        {/* Demo Scenario Runner Buttons */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 px-2 flex items-center gap-1">
            <Play className="h-3 w-3 text-indigo-400" /> Hackathon Scenarios:
          </span>
          <button
            onClick={() => runDemoScenario(0)}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-emerald-400 transition-colors"
          >
            Scenario 1: Broken Phone
          </button>
          <button
            onClick={() => runDemoScenario(1)}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-rose-400 transition-colors"
          >
            Scenario 2: Fraud Alert
          </button>
          <button
            onClick={() => runDemoScenario(2)}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-indigo-300 transition-colors"
          >
            Scenario 3: Wrong Product
          </button>
        </div>

        {/* View Switcher (Admin Dashboard vs Customer Portal) */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'admin' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className="h-3.5 w-3.5" /> Admin Dashboard
          </button>
          <button
            onClick={() => setActiveTab('customer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'customer' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="h-3.5 w-3.5" /> Customer Portal
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      {activeTab === 'admin' ? (
        <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 lg:p-6 space-y-6">
          
          {/* KPI Analytics Header */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
              <p className="text-xs font-semibold text-slate-400 uppercase">Total Complaints</p>
              <p className="text-2xl font-bold text-slate-100 mt-1">{disputes.length}</p>
              <span className="text-[10px] text-emerald-400 mt-1 block">100% processed by AI agents</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
              <p className="text-xs font-semibold text-slate-400 uppercase">Pending / Review</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">
                {disputes.filter(d => d.status === 'Requires_Review' || d.status === 'Fraud_Hold').length}
              </p>
              <span className="text-[10px] text-amber-400/80 mt-1 block">Awaiting human approval</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
              <p className="text-xs font-semibold text-slate-400 uppercase">Resolved Cases</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {disputes.filter(d => d.status === 'Approved' || d.status === 'Resolved').length}
              </p>
              <span className="text-[10px] text-slate-500 mt-1 block">Auto-refunded / Exchanged</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
              <p className="text-xs font-semibold text-slate-400 uppercase">Fraud Flagged</p>
              <p className="text-2xl font-bold text-rose-500 mt-1">
                {disputes.filter(d => d.fraudScore > 0.6).length}
              </p>
              <span className="text-[10px] text-rose-400 mt-1 block">High risk anomalies</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
              <p className="text-xs font-semibold text-slate-400 uppercase">AI Confidence Score</p>
              <p className="text-2xl font-bold text-indigo-400 mt-1">92%</p>
              <span className="text-[10px] text-indigo-300 mt-1 block">Explainable RAG reasoning</span>
            </div>
          </div>

          {/* Admin Split View: Left List, Right Reasoning Details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-250px)]">
            
            {/* Left Queue Panel */}
            <section className="lg:col-span-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3 overflow-hidden">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-400" /> Active Claims Stream
                </h2>
                <span className="px-2 py-0.5 bg-slate-800 rounded-full text-xs font-semibold text-slate-400">
                  {disputes.length} cases
                </span>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter claims..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {disputes
                  .filter(d => d.id.toLowerCase().includes(searchTerm.toLowerCase()) || d.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(dispute => (
                    <button
                      key={dispute.id}
                      onClick={() => setSelectedDispute(dispute)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-2 ${
                        selectedDispute?.id === dispute.id
                          ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-950/20'
                          : 'bg-slate-950/50 border-slate-800 hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-xs font-semibold text-indigo-400">{dispute.id}</span>
                        <span className="text-xs font-bold text-slate-100">${dispute.claimAmount.toLocaleString()}</span>
                      </div>
                      <h3 className="font-semibold text-sm text-slate-200 truncate">{dispute.customerName}</h3>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getStatusColor(dispute.status)}`}>
                          {dispute.status.replace('_', ' ')}
                        </span>
                        {dispute.fraudScore > 0.6 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-rose-950 border border-rose-800 text-rose-400 font-bold rounded flex items-center gap-1">
                            <ShieldAlert className="h-3 w-3" /> {(dispute.fraudScore * 100).toFixed(0)}% Fraud
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            </section>

            {/* Right Detailed Case Audit & Explainable AI View */}
            <section className="lg:col-span-8 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 overflow-y-auto space-y-6">
              {selectedDispute ? (
                <>
                  {/* Case Header & Human Override Action Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-white">{selectedDispute.id}</h2>
                        <span className={`text-xs px-2.5 py-0.5 rounded border font-bold ${getStatusColor(selectedDispute.status)}`}>
                          {selectedDispute.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Customer: <strong className="text-slate-200">{selectedDispute.customerName}</strong> ({selectedDispute.customerEmail})</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusChange(selectedDispute.id, 'Approved', 'Replacement Approved')}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-950/20 active:scale-95 transition-all"
                      >
                        <CheckCircle className="h-4 w-4" /> Approve Resolution
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedDispute.id, 'Rejected', 'Claim Rejected')}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
                      >
                        <XCircle className="h-4 w-4" /> Reject Claim
                      </button>
                    </div>
                  </div>

                  {/* Explainable AI Decision Card */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-indigo-900/60 rounded-2xl p-5 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4 text-indigo-400" /> Explainable AI Decision Summary
                      </h3>
                      <span className="text-xs bg-indigo-950 border border-indigo-800 px-2.5 py-1 rounded-full text-indigo-300 font-bold">
                        95% Confidence Score
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                        <span className="text-slate-500 font-semibold block uppercase text-[10px]">Action Recommended</span>
                        <span className="text-sm font-extrabold text-emerald-400 mt-1 block">
                          {selectedDispute.resolutionAction || "Replacement Approved"}
                        </span>
                      </div>
                      <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                        <span className="text-slate-500 font-semibold block uppercase text-[10px]">Fraud Risk Level</span>
                        <span className={`text-sm font-extrabold mt-1 block ${selectedDispute.fraudScore > 0.6 ? 'text-rose-500' : 'text-emerald-400'}`}>
                          {(selectedDispute.fraudScore * 100).toFixed(0)}% ({selectedDispute.fraudScore > 0.6 ? 'High Risk' : 'Low Risk'})
                        </span>
                      </div>
                      <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                        <span className="text-slate-500 font-semibold block uppercase text-[10px]">Evidence Verification</span>
                        <span className="text-sm font-semibold text-slate-200 mt-1 block">
                          OCR Invoice & Vision Verified
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5 text-indigo-400" /> Policy RAG Clause Reference:
                      </h4>
                      <p className="text-xs text-indigo-300 font-mono italic">
                        "{selectedDispute.policyNotes}"
                      </p>
                    </div>
                  </div>

                  {/* Real-time Agent Execution Trace (LangGraph Stream) */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-400" /> LangGraph Multi-Agent Execution Stream
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400 font-bold text-[10px]">1</div>
                        <div>
                          <p className="font-bold text-slate-200">Customer Interaction Agent</p>
                          <p className="text-slate-400 text-[11px] mt-0.5">Categorized intent: Damaged Product (98% confidence).</p>
                        </div>
                      </div>

                      <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400 font-bold text-[10px]">2</div>
                        <div>
                          <p className="font-bold text-slate-200">Evidence Verification Agent</p>
                          <p className="text-slate-400 text-[11px] mt-0.5">OCR parsed invoice #{selectedDispute.orderId}. Vision confirmed impact fracture.</p>
                        </div>
                      </div>

                      <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-start gap-3">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] ${selectedDispute.fraudScore > 0.6 ? 'bg-rose-950 border border-rose-700 text-rose-400' : 'bg-emerald-950 border border-emerald-700 text-emerald-400'}`}>3</div>
                        <div>
                          <p className="font-bold text-slate-200">Fraud Detection Agent</p>
                          <p className="text-slate-400 text-[11px] mt-0.5">Risk Score: {(selectedDispute.fraudScore * 100).toFixed(0)}%. {selectedDispute.fraudScore > 0.6 ? 'High risk anomaly flagged.' : 'Clean history.'}</p>
                        </div>
                      </div>

                      <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-indigo-950 border border-indigo-700 flex items-center justify-center text-indigo-300 font-bold text-[10px]">4</div>
                        <div>
                          <p className="font-bold text-slate-200">Policy Intelligence Agent (RAG)</p>
                          <p className="text-slate-400 text-[11px] mt-0.5">Matched Section 4.2 (Damaged Transit Coverage).</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">Select a claim to inspect</div>
              )}
            </section>
          </div>
        </main>
      ) : (
        /* Customer Portal View */
        <main className="flex-1 max-w-4xl w-full mx-auto p-6 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-indigo-400" /> Submit New Dispute / Complaint
            </h2>
            <form onSubmit={handleCreateComplaint} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Select Complaint Type</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none"
                >
                  <option value="Damaged Product">Damaged Product</option>
                  <option value="Late Delivery">Late Delivery</option>
                  <option value="Refund Request">Refund Request</option>
                  <option value="Warranty Claim">Warranty Claim</option>
                  <option value="Wrong Product">Wrong Product</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Claim Amount ($)</label>
                <input
                  type="text"
                  value={newClaimAmount}
                  onChange={(e) => setNewClaimAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Complaint Description</label>
                <textarea
                  rows={3}
                  value={newComplaintText}
                  onChange={(e) => setNewComplaintText(e.target.value)}
                  placeholder="Describe your issue..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none"
                ></textarea>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Upload Photo / PDF Evidence</label>
                <div className="border-2 border-dashed border-slate-800 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-500 transition-colors">
                  <Upload className="h-6 w-6 text-slate-500 mx-auto mb-1" />
                  <span className="text-xs text-slate-400 block">Click to attach photo evidence or invoice PDF</span>
                  <span className="text-[10px] text-indigo-400 font-mono mt-1 block">Attached: {newEvidenceFile}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-950/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Running Multi-Agent LangGraph Resolution..." : "Submit Complaint to Autonomous AI Agents"}
              </button>
            </form>
          </div>
        </main>
      )}
    </div>
  );
}
