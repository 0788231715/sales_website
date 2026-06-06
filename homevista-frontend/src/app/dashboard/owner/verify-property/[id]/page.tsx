"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import api from "@/utils/api";
import { 
  FiUpload, FiFile, FiCheckCircle, FiXCircle, 
  FiClock, FiAlertTriangle, FiArrowLeft, FiInfo
} from "react-icons/fi";
import Link from "next/link";

export default function PropertyVerificationPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [property, setProperty] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploadData, setUploadData] = useState({
    document_type: "TITLE_DEED",
    file: null as File | null
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [propRes, docsRes] = await Promise.all([
        api.get(`/properties/${id}/`),
        api.get(`/properties/ownership-documents/?property=${id}`)
      ]);
      setProperty(propRes.data);
      setDocuments(docsRes.data.results || docsRes.data);
    } catch (err) {
      console.error("Error fetching verification data", err);
      setError("Failed to load property details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadData({ ...uploadData, file: e.target.files[0] });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file) return alert("Please select a file.");

    const formData = new FormData();
    formData.append("property", id as string);
    formData.append("document_type", uploadData.document_type);
    formData.append("document", uploadData.file);

    try {
      setUploading(true);
      await api.post("/properties/ownership-documents/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("Document uploaded successfully. It is now awaiting admin review.");
      setUploadData({ document_type: "TITLE_DEED", file: null });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error uploading document.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!property) return <div className="py-40 text-center font-serif text-2xl">Property Not Found</div>;

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/dashboard/owner" className="flex items-center gap-2 text-foreground/50 hover:text-accent transition-colors mb-8 font-bold text-xs uppercase tracking-widest">
          <FiArrowLeft /> Back to Dashboard
        </Link>

        <header className="mb-12">
          <h1 className="text-4xl font-serif mb-4">Ownership Verification</h1>
          <p className="text-foreground/50 max-w-2xl">
            To maintain platform integrity and security, all properties listed for SALE or RENT-TO-OWN must have verified ownership documentation before offers can be accepted.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            {/* Property Summary Card */}
            <div className="glass p-8 rounded-[2.5rem] border border-foreground/10 flex items-center gap-6">
              <div className="w-32 h-32 rounded-2xl overflow-hidden bg-foreground/5 shrink-0">
                <img 
                  src={property.images?.[0]?.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400&auto=format&fit=crop"} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-2 inline-block ${
                  property.ownership_status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-500' :
                  property.ownership_status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-rose-500/10 text-rose-500'
                }`}>
                  {property.ownership_status}
                </span>
                <h2 className="text-2xl font-serif">{property.title}</h2>
                <p className="text-sm text-foreground/40">{property.address}</p>
              </div>
            </div>

            {/* Verification Status Warning */}
            {property.ownership_status !== 'VERIFIED' && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl flex items-start gap-4">
                <FiAlertTriangle className="text-amber-500 shrink-0 mt-1" size={24} />
                <div>
                  <h4 className="font-bold text-amber-500 mb-1">Action Required</h4>
                  <p className="text-sm text-amber-500/80 leading-relaxed">
                    This property is not yet verified. You will not be able to accept any offers or generate legal contracts until our compliance team has verified your ownership documents.
                  </p>
                </div>
              </div>
            )}

            {/* Document List */}
            <div>
              <h3 className="text-xl font-bold mb-6">Submitted Documents</h3>
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="glass p-6 rounded-3xl border border-foreground/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-foreground/5 rounded-xl text-accent">
                        <FiFile size={20} />
                      </div>
                      <div>
                        <p className="font-bold">{doc.document_type.replace('_', ' ')}</p>
                        <p className="text-xs text-foreground/40 uppercase tracking-widest font-bold">Uploaded {new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                        doc.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-500' :
                        doc.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-rose-500/10 text-rose-500'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  </div>
                ))}
                {documents.length === 0 && (
                  <div className="py-12 text-center border-2 border-dashed border-foreground/10 rounded-3xl">
                    <FiFile size={32} className="mx-auto text-foreground/20 mb-4" />
                    <p className="text-foreground/40 italic">No documents uploaded yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside>
            <div className="sticky top-32 glass p-8 rounded-[2.5rem] border border-foreground/10 shadow-2xl">
              <h3 className="text-xl font-bold mb-8">Upload Document</h3>
              <form onSubmit={handleUpload} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-2 block">Document Type</label>
                  <select 
                    value={uploadData.document_type}
                    onChange={(e) => setUploadData({ ...uploadData, document_type: e.target.value })}
                    className="w-full bg-foreground/5 border border-foreground/10 p-4 rounded-xl outline-none focus:border-accent appearance-none text-sm font-bold"
                  >
                    <option value="TITLE_DEED">Title Deed</option>
                    <option value="TAX_DOCUMENT">Tax Document</option>
                    <option value="OTHER">Other Support Document</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-2 block">Select File</label>
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${uploadData.file ? 'border-accent bg-accent/5' : 'border-foreground/10 hover:border-foreground/20'}`}>
                    <input 
                      type="file" 
                      id="doc-upload" 
                      className="hidden" 
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <label htmlFor="doc-upload" className="cursor-pointer block">
                      <FiUpload className={`mx-auto mb-2 ${uploadData.file ? 'text-accent' : 'text-foreground/20'}`} size={24} />
                      <p className="text-xs font-bold text-foreground truncate">
                        {uploadData.file ? uploadData.file.name : "PDF, JPG, or PNG"}
                      </p>
                    </label>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={uploading || !uploadData.file}
                  className="w-full bg-accent text-primary-dark font-black py-5 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-accent/20 uppercase tracking-widest text-xs disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Submit for Review"}
                </button>
              </form>

              <div className="mt-8 p-6 bg-foreground/5 rounded-2xl border border-foreground/5">
                <div className="flex items-center gap-2 mb-2 text-accent">
                  <FiInfo size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Review Process</span>
                </div>
                <p className="text-[10px] text-foreground/50 leading-relaxed font-bold uppercase tracking-wider">
                  Documents are reviewed within 24-48 business hours. You will receive a notification once the status is updated.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
