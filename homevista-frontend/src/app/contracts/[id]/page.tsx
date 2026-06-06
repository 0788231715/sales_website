"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { 
  FiFileText, FiCheckCircle, FiClock, FiAlertCircle, 
  FiDownload, FiPrinter, FiArrowLeft, FiEdit3, FiShield
} from "react-icons/fi";
import Link from "next/link";
import SignatureCanvas from "react-signature-canvas";

export default function ContractSigningPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const sigCanvas = useRef<SignatureCanvas>(null);
  
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContract = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/legal/contracts/${id}/`);
      setContract(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load contract.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchContract();
  }, [id]);

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const handleSign = async () => {
    if (sigCanvas.current?.isEmpty()) {
      return alert("Please provide a signature.");
    }

    const signatureData = sigCanvas.current?.getTrimmedCanvas().toDataURL("image/png");

    try {
      setSigning(true);
      const res = await api.post(`/legal/contracts/${id}/sign_contract/`, {
        signature: signatureData
      });
      alert("Contract signed successfully!");
      fetchContract(); // Refresh status
    } catch (err: any) {
      alert(err.response?.data?.error || "Error signing contract.");
    } finally {
      setSigning(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <FiAlertCircle size={48} className="text-rose-500 mb-4" />
      <h2 className="text-2xl font-serif mb-2">Access Denied</h2>
      <p className="text-foreground/50 mb-8 max-w-md">{error}</p>
      <Link href="/dashboard" className="bg-accent text-primary-dark px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs">
        Back to Dashboard
      </Link>
    </div>
  );

  const isCustomer = user?.id === contract.booking_details?.customer;
  const isOwner = user?.id === contract.booking_details?.property_details?.owner;
  const hasSigned = isCustomer ? !!contract.customer_signature : isOwner ? !!contract.owner_signature : false;

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <Link href="/dashboard" className="flex items-center gap-2 text-foreground/50 hover:text-accent transition-colors mb-8 font-bold text-xs uppercase tracking-widest">
          <FiArrowLeft /> Back to Dashboard
        </Link>

        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                contract.status === 'SIGNED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
              }`}>
                {contract.status}
              </span>
              <span className="text-xs font-bold text-foreground/40 uppercase tracking-widest">v{contract.version} • Created {new Date(contract.created_at).toLocaleDateString()}</span>
            </div>
            <h1 className="text-4xl font-serif">{contract.template_details?.title || "Legal Agreement"}</h1>
          </div>
          <div className="flex gap-4">
            {contract.signed_pdf && (
              <button className="flex items-center gap-2 bg-foreground/5 hover:bg-foreground/10 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all">
                <FiDownload /> Download PDF
              </button>
            )}
            <button className="p-3 bg-foreground/5 hover:bg-foreground/10 rounded-xl text-foreground/50 transition-all">
              <FiPrinter size={20} />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contract Content */}
          <div className="lg:col-span-2">
            <div className="glass p-12 rounded-[3rem] border border-foreground/10 bg-white/5 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-accent" />
              <div className="prose prose-invert max-w-none text-foreground/80 leading-relaxed font-serif text-lg">
                <div dangerouslySetInnerHTML={{ __html: contract.template_details?.content_html || "" }} />
                
                {/* Visual Signatures Area */}
                <div className="mt-20 pt-12 border-t border-foreground/10 grid grid-cols-2 gap-12">
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-8 underline decoration-accent underline-offset-8">Buyer Signature</p>
                    {contract.customer_signature ? (
                      <div className="h-24 flex flex-col items-center justify-center">
                        <img src={contract.customer_signature} className="max-h-16 invert" alt="Buyer Sig" />
                        <p className="text-[10px] font-bold mt-2 text-emerald-500 uppercase tracking-tighter">Digitally Verified</p>
                      </div>
                    ) : (
                      <div className="h-24 flex items-center justify-center text-foreground/20 italic text-sm">Awaiting Signature</div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-8 underline decoration-accent underline-offset-8">Owner Signature</p>
                    {contract.owner_signature ? (
                      <div className="h-24 flex flex-col items-center justify-center">
                        <img src={contract.owner_signature} className="max-h-16 invert" alt="Owner Sig" />
                        <p className="text-[10px] font-bold mt-2 text-emerald-500 uppercase tracking-tighter">Digitally Verified</p>
                      </div>
                    ) : (
                      <div className="h-24 flex items-center justify-center text-foreground/20 italic text-sm">Awaiting Signature</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side Info & Actions */}
          <aside className="space-y-8">
            {/* Property Summary */}
            <div className="glass p-8 rounded-[2.5rem] border border-foreground/10">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <FiFileText className="text-accent" /> Transaction Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground/30 block mb-1">Property</label>
                  <p className="font-bold">{contract.booking_details?.property_details?.title}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground/30 block mb-1">Amount</label>
                  <p className="text-xl font-black text-accent">${parseFloat(contract.booking_details?.total_price || 0).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground/30 block mb-1">Transaction ID</label>
                  <p className="text-xs font-mono text-foreground/60">#{contract.id.toString().padStart(8, '0')}</p>
                </div>
              </div>
            </div>

            {/* Signature Pad Section */}
            {!hasSigned && contract.status !== 'SIGNED' && (isCustomer || isOwner) ? (
              <div className="glass p-8 rounded-[2.5rem] border border-accent/20 bg-accent/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 text-accent/20">
                  <FiEdit3 size={64} />
                </div>
                <h3 className="text-lg font-bold mb-6 relative z-10">Capture Your Signature</h3>
                <p className="text-xs text-foreground/50 mb-6 leading-relaxed relative z-10 font-bold uppercase tracking-wider">
                  Please use your mouse or touch device to sign below. This signature will be legally binding.
                </p>
                
                <div className="bg-white rounded-2xl border-2 border-accent/20 overflow-hidden mb-6">
                  <SignatureCanvas 
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{
                      className: "w-full h-40 cursor-crosshair",
                      style: { width: '100%', height: '160px' }
                    }}
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={clearSignature}
                    className="flex-1 py-4 bg-foreground/5 hover:bg-foreground/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Clear
                  </button>
                  <button 
                    onClick={handleSign}
                    disabled={signing}
                    className="flex-[2] py-4 bg-accent text-primary-dark rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 shadow-lg shadow-accent/20"
                  >
                    {signing ? "Processing..." : "Sign & Finalize"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass p-8 rounded-[2.5rem] border border-foreground/10 text-center">
                {hasSigned ? (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                      <FiCheckCircle size={32} />
                    </div>
                    <h3 className="text-lg font-bold mb-2">You Have Signed</h3>
                    <p className="text-xs text-foreground/50 uppercase font-black tracking-widest leading-relaxed">
                      {contract.status === 'SIGNED' ? 'Contract is fully executed.' : 'Awaiting other party signature.'}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-foreground/30">
                    <FiShield size={48} className="mb-4" />
                    <p className="text-xs uppercase font-black tracking-widest leading-relaxed">
                      You are viewing this contract in read-only mode.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Compliance Info */}
            <div className="p-6 bg-foreground/5 rounded-3xl border border-foreground/10">
              <div className="flex items-center gap-2 mb-4 text-accent">
                <FiShield size={18} />
                <span className="text-xs font-black uppercase tracking-widest">Compliance & Security</span>
              </div>
              <ul className="space-y-3">
                <li className="text-[10px] text-foreground/40 font-bold uppercase tracking-wider flex items-start gap-2">
                  <FiCheckCircle className="shrink-0 text-emerald-500" /> AES-256 Encrypted Storage
                </li>
                <li className="text-[10px] text-foreground/40 font-bold uppercase tracking-wider flex items-start gap-2">
                  <FiCheckCircle className="shrink-0 text-emerald-500" /> Immutable Audit Logs
                </li>
                <li className="text-[10px] text-foreground/40 font-bold uppercase tracking-wider flex items-start gap-2">
                  <FiCheckCircle className="shrink-0 text-emerald-500" /> Identity Verified Signatures
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
