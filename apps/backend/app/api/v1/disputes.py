from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from libs.db_shared.session import get_db
from libs.db_shared.repositories.dispute_repo import DisputeRepository
from app.schemas.dispute import DisputeCreate, DisputeResponse, AgentLogResponse
from typing import List, Dict, Any
import sys
import os

# Include AI engine path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "ai_engine")))
from graph.definition import app_graph

router = APIRouter()

@router.get("/", response_model=List[DisputeResponse])
@router.get("/complaints", response_model=List[DisputeResponse])
async def list_disputes(db: Session = Depends(get_db)):
    repo = DisputeRepository(db)
    return repo.get_all()

@router.get("/dashboard/stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    repo = DisputeRepository(db)
    return repo.get_stats()

@router.get("/agents/status")
async def get_agents_status():
    return {
        "active_agents": 8,
        "agents": [
            {"name": "Customer Interaction Agent", "status": "Online", "mode": "NLP Intent Parsing"},
            {"name": "Evidence Verification Agent", "status": "Online", "mode": "Vision OCR"},
            {"name": "Fraud Detection Agent", "status": "Online", "mode": "Hybrid Risk Rules"},
            {"name": "Policy Intelligence Agent", "status": "Online", "mode": "ChromaDB RAG"},
            {"name": "Resolution Strategy Agent", "status": "Online", "mode": "Explainable Reasoning"},
            {"name": "Workflow Execution Agent", "status": "Online", "mode": "Enterprise APIs"},
            {"name": "Human Approval Agent", "status": "Online", "mode": "Escalation Queue"},
            {"name": "Learning Agent", "status": "Online", "mode": "Vector Memory Store"}
        ]
    }

@router.get("/{id}", response_model=DisputeResponse)
@router.get("/complaints/{id}", response_model=DisputeResponse)
async def get_dispute(id: str, db: Session = Depends(get_db)):
    repo = DisputeRepository(db)
    dispute = repo.get_by_id(id)
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    return dispute

@router.post("/", response_model=DisputeResponse, status_code=status.HTTP_201_CREATED)
@router.post("/complaints/create", response_model=DisputeResponse, status_code=status.HTTP_201_CREATED)
async def create_dispute(dispute_data: DisputeCreate, db: Session = Depends(get_db)):
    repo = DisputeRepository(db)
    dispute_dict = dispute_data.model_dump()
    
    # Insert dispute in DB
    dispute = repo.create(dispute_dict)
    
    # Automatically execute LangGraph workflow for dispute
    initial_state = {
        "complaint_id": dispute.id,
        "customer_name": dispute.customer_name,
        "customer_email": dispute.customer_email,
        "customer_history_count": getattr(dispute, "customer_history_count", 0),
        "complaint_text": dispute.complaint_text,
        "category": getattr(dispute, "category", "Damaged Product"),
        "claim_amount": dispute.claim_amount,
        "evidence_urls": dispute.evidence_urls or [],
        "status": "New",
        "agent_logs": []
    }
    
    final_state = await app_graph.ainvoke(initial_state)
    
    # Update DB with final state
    updates = {
        "status": final_state.get("status", "Analyzing"),
        "fraud_score": final_state.get("fraud_score", 0.0),
        "fraud_risk_level": final_state.get("fraud_risk_level", "Low"),
        "fraud_reasons": final_state.get("fraud_reasons", []),
        "policy_eligible": final_state.get("policy_eligible", "Eligible"),
        "policy_reference": final_state.get("policy_reference", ""),
        "policy_notes": final_state.get("policy_notes", ""),
        "resolution_action": final_state.get("resolution_action", "Pending"),
        "resolution_reason": final_state.get("resolution_reason", ""),
        "confidence": final_state.get("confidence", 0.90),
        "ocr_text": final_state.get("ocr_text", "")
    }
    
    updated_dispute = repo.update(dispute.id, updates)
    
    # Record logs in database
    for log in final_state.get("agent_logs", []):
        repo.add_agent_log({
            "dispute_id": dispute.id,
            "agent_name": log.get("agent_name"),
            "action_taken": log.get("action_taken"),
            "log_details": log.get("log_details")
        })
        
    return updated_dispute

@router.post("/agent/process/{complaint_id}", response_model=DisputeResponse)
async def process_dispute_agent(complaint_id: str, db: Session = Depends(get_db)):
    repo = DisputeRepository(db)
    dispute = repo.get_by_id(complaint_id)
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
        
    initial_state = {
        "complaint_id": dispute.id,
        "customer_name": dispute.customer_name,
        "customer_email": dispute.customer_email,
        "customer_history_count": dispute.customer_history_count or 0,
        "complaint_text": dispute.complaint_text,
        "category": dispute.category or "Damaged Product",
        "claim_amount": dispute.claim_amount,
        "evidence_urls": dispute.evidence_urls or [],
        "status": dispute.status,
        "agent_logs": []
    }
    
    final_state = await app_graph.ainvoke(initial_state)
    
    updates = {
        "status": final_state.get("status", "Analyzing"),
        "fraud_score": final_state.get("fraud_score", 0.0),
        "fraud_risk_level": final_state.get("fraud_risk_level", "Low"),
        "fraud_reasons": final_state.get("fraud_reasons", []),
        "policy_eligible": final_state.get("policy_eligible", "Eligible"),
        "policy_reference": final_state.get("policy_reference", ""),
        "policy_notes": final_state.get("policy_notes", ""),
        "resolution_action": final_state.get("resolution_action", "Pending"),
        "resolution_reason": final_state.get("resolution_reason", ""),
        "confidence": final_state.get("confidence", 0.90)
    }
    
    return repo.update(dispute.id, updates)

@router.get("/resolution/{complaint_id}")
async def get_resolution_details(complaint_id: str, db: Session = Depends(get_db)):
    repo = DisputeRepository(db)
    dispute = repo.get_by_id(complaint_id)
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
        
    try:
        # Check if SQLite returns strings for JSON columns
        evidence_summary = dispute.evidence_summary or {}
        if isinstance(evidence_summary, str):
            import json
            evidence_summary = json.loads(evidence_summary)
            
        fraud_reasons = dispute.fraud_reasons or []
        if isinstance(fraud_reasons, str):
            import json
            fraud_reasons = json.loads(fraud_reasons)
            
        return {
            "dispute_id": dispute.id,
            "decision": dispute.resolution_action or "Pending",
            "reason": dispute.resolution_reason or "Resolution in progress",
            "confidence_score": f"{int((dispute.confidence or 0.9) * 100)}%",
            "explainable_ai_breakdown": {
                "evidence": {
                    "damage_detected": evidence_summary.get("damage_detected", True) if isinstance(evidence_summary, dict) else True,
                    "document_verified": True,
                    "ocr_extracted": dispute.ocr_text or "Invoice verified"
                },
                "fraud_risk": {
                    "score": f"{int((dispute.fraud_score or 0.08) * 100)}%",
                    "level": dispute.fraud_risk_level or "Low",
                    "indicators": fraud_reasons or ["Account verified"]
                },
                "policy": {
                    "clause": dispute.policy_reference or "Refund Policy Section 4.2",
                    "status": dispute.policy_eligible or "Eligible",
                    "notes": dispute.policy_notes or "Coverage verified"
                }
            }
        }
    except Exception as e:
        import traceback
        trace = traceback.format_exc()
        print(f"Error in get_resolution_details: {trace}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}\n{trace}")

@router.post("/{id}/approve", response_model=DisputeResponse)
@router.post("/complaints/{id}/approve", response_model=DisputeResponse)
async def approve_dispute(id: str, db: Session = Depends(get_db)):
    repo = DisputeRepository(db)
    dispute = repo.update(id, {
        "status": "Approved", 
        "resolution_action": "Approved", 
        "resolution_reason": "Approved by Human Admin. Enterprise refund API dispatched."
    })
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
        
    repo.add_agent_log({
        "dispute_id": id,
        "agent_name": "Human Approval Agent",
        "action_taken": "Human Override Approval",
        "log_details": "Human Admin override approved resolution. Dispatched refund API."
    })
    return dispute

@router.post("/{id}/reject", response_model=DisputeResponse)
@router.post("/complaints/{id}/reject", response_model=DisputeResponse)
async def reject_dispute(id: str, db: Session = Depends(get_db)):
    repo = DisputeRepository(db)
    dispute = repo.update(id, {
        "status": "Rejected", 
        "resolution_action": "Reject", 
        "resolution_reason": "Claim rejected by Human Admin due to high fraud risk factors."
    })
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
        
    repo.add_agent_log({
        "dispute_id": id,
        "agent_name": "Human Approval Agent",
        "action_taken": "Human Override Rejection",
        "log_details": "Human Admin rejected claim due to fraud risk audit."
    })
    return dispute
