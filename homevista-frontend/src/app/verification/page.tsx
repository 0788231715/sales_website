"use client";

import { useState } from "react";
import { 
  ShieldCheck, Upload, AlertCircle, CheckCircle, 
  UserCheck, FileText, Lock, ArrowRight 
} from "lucide-react";
import api from "@/utils/api";

export default function KYCPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    setStatus('uploading');
    const formData = new FormData();
    formData.append('id_document', file);

    try {
      await api.post("/verification/", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatus('success');
    } catch (err: any) {
      console.error("KYC upload error:", err);
      setStatus('error');
      setErrorMessage(err.response?.data?.error || "Failed to upload document. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-6">
      <div className="max-w-3xl w-full bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-blue-600 p-10 text-white relative">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-4 flex items-center gap-3">
              <ShieldCheck size={32} /> Verify Your Identity
            </h1>
            <p className="text-blue-100 text-lg max-w-xl">
              Become a verified member of HOMEVISTA to unlock premium listings, lower transaction fees, and build trust with buyers.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20" />
        </div>

        <div className="p-10">
          {status === 'success' ? (
            <div className="text-center py-12">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={48} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Application Submitted!</h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Our team is reviewing your documents. This usually takes 12-24 hours. We'll notify you once your status is updated.
                </p>
                <button 
                    onClick={() => window.location.href = '/dashboard/owner'}
                    className="bg-gray-800 text-white px-8 py-3 rounded-xl hover:bg-black transition flex items-center gap-2 mx-auto"
                >
                    Back to Dashboard <ArrowRight size={18}/>
                </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="font-bold text-gray-800 mb-6 text-xl">Verification Steps</h3>
                <div className="space-y-8">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0 font-bold">1</div>
                        <div>
                            <p className="font-bold text-gray-800">Upload Government ID</p>
                            <p className="text-sm text-gray-500">National ID, Passport, or Driver's License.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0 font-bold">2</div>
                        <div>
                            <p className="font-bold text-gray-800">Facial Match</p>
                            <p className="text-sm text-gray-500">We cross-reference your ID with platform records.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0 font-bold">3</div>
                        <div>
                            <p className="font-bold text-gray-800">Verification Badge</p>
                            <p className="text-sm text-gray-500">Get your trust score boosted and badge added.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 p-6 bg-yellow-50 border border-yellow-100 rounded-2xl flex gap-4">
                    <Lock className="text-yellow-600 shrink-0" />
                    <p className="text-xs text-yellow-800 leading-relaxed">
                        Your documents are stored using AES-256 encryption. Only authorized compliance officers can access your data for verification purposes.
                    </p>
                </div>
              </div>

              <div>
                <div 
                    className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all ${
                        file ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                    }`}
                >
                    <input 
                        type="file" 
                        id="kyc-file" 
                        className="hidden" 
                        onChange={handleFileChange}
                        accept="image/*,.pdf"
                    />
                    <label htmlFor="kyc-file" className="cursor-pointer">
                        <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 text-gray-400 group-hover:text-blue-500 transition">
                            <Upload size={32} />
                        </div>
                        {file ? (
                            <div>
                                <p className="font-bold text-blue-600 truncate max-w-[200px] mx-auto">{file.name}</p>
                                <p className="text-sm text-blue-400 mt-1">Ready to upload</p>
                            </div>
                        ) : (
                            <div>
                                <p className="font-bold text-gray-800">Select Document</p>
                                <p className="text-sm text-gray-500 mt-2">PDF, JPG, or PNG (Max 5MB)</p>
                            </div>
                        )}
                    </label>
                </div>

                {status === 'error' && (
                    <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 text-sm">
                        <AlertCircle size={18} /> {errorMessage}
                    </div>
                )}

                <button 
                    onClick={handleSubmit}
                    disabled={status === 'uploading'}
                    className="w-full mt-8 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition disabled:opacity-50"
                >
                    {status === 'uploading' ? "Uploading Documents..." : "Submit for Verification"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <p className="mt-8 text-gray-400 text-sm">
          HOMEVISTA Compliance & Security Layer v4.2.0
      </p>
    </div>
  );
}
