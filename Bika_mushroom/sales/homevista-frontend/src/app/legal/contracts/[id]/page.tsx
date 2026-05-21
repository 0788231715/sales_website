"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";
import { 
  FileText, Shield, PenTool, CheckCircle, AlertTriangle, 
  Download, Printer, Share2, ArrowLeft
} from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function ContractSigningPage() {
  const { id } = useParams();
  const router = useRouter();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const sigPad = useRef<any>(null);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.get(`${API_URL}/legal/${id}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setContract(res.data);
      } catch (err) {
        console.error("Error fetching contract:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContract();
  }, [id]);

  const handleSign = async () => {
    if (sigPad.current.isEmpty()) {
      alert("Please provide a signature first.");
      return;
    }

    const signatureData = sigPad.current.getTrimmedCanvas().toDataURL("image/png");
    setSigning(true);

    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(`${API_URL}/legal/${id}/sign_contract/`, {
        signature: signatureData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert("Contract signed successfully!");
      window.location.reload();
    } catch (err) {
      console.error("Error signing contract:", err);
      alert("Failed to sign contract. Please try again.");
    } finally {
      setSigning(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Contract...</div>;
  if (!contract) return <div className="p-8 text-center text-red-500">Contract not found.</div>;

  const isSignedByMe = contract.customer_signature || contract.owner_signature; // Simplified check

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-2xl my-10 border border-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Purchase Agreement</h1>
            <p className="text-gray-500 text-sm">Ref: HV-CONT-{contract.id.toString().padStart(6, '0')}</p>
          </div>
        </div>
        <div className="flex gap-2">
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"><Printer size={20}/></button>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"><Share2 size={20}/></button>
        </div>
      </div>

      {/* Contract Content */}
      <div className="bg-gray-50 p-8 rounded-xl mb-8 border border-gray-200 text-gray-700 leading-relaxed font-serif max-h-[500px] overflow-y-auto">
        <h2 className="text-xl font-bold text-center mb-6 uppercase tracking-wider">Property Sale & Purchase Agreement</h2>
        
        <section className="mb-6">
            <h3 className="font-bold mb-2">1. THE PARTIES</h3>
            <p>This agreement is made between <strong>{contract.booking_details.customer_details.full_name}</strong> (Buyer) and <strong>{contract.booking_details.property_details.owner_details?.full_name || 'The Owner'}</strong> (Seller).</p>
        </section>

        <section className="mb-6">
            <h3 className="font-bold mb-2">2. PROPERTY DESCRIPTION</h3>
            <p>The Seller agrees to sell and the Buyer agrees to purchase the property located at: <br/> 
            <strong>{contract.booking_details.property_details.address}</strong></p>
        </section>

        <section className="mb-6">
            <h3 className="font-bold mb-2">3. PURCHASE PRICE</h3>
            <p>The agreed purchase price for the property is <strong>${contract.booking_details.property_details.price}</strong>. A proof of payment must be uploaded to the portal within 48 hours of both parties signing this document.</p>
        </section>

        <section className="mb-6">
            <h3 className="font-bold mb-2">4. TERMS & CONDITIONS</h3>
            <p>This digital contract is legally binding under the Electronic Transactions Act. Both parties acknowledge that the digital signatures provided below represent their full consent and commitment to the transaction.</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>The property is sold "as-is" unless otherwise specified.</li>
                <li>Transfer of ownership occurs upon full payment verification.</li>
                <li>Disputes shall be settled through the platform's mediation system.</li>
            </ul>
        </section>

        <div className="mt-10 p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3">
            <Shield className="text-blue-600 shrink-0" />
            <p className="text-sm text-blue-800">
                Securely encrypted and timestamped. IP Address: <strong>{contract.ip_log || 'Logged'}</strong>
            </p>
        </div>
      </div>

      {/* Signing Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <PenTool size={18} className="text-blue-600"/> Draw Your Signature
            </h3>
            <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 overflow-hidden">
                <SignatureCanvas 
                    ref={sigPad}
                    penColor="navy"
                    canvasProps={{ width: 400, height: 200, className: "sigCanvas w-full" }}
                />
            </div>
            <div className="flex gap-4 mt-4">
                <button 
                    onClick={() => sigPad.current.clear()}
                    className="text-gray-500 text-sm hover:underline"
                >
                    Clear Signature
                </button>
                <button 
                    onClick={handleSign}
                    disabled={signing || isSignedByMe}
                    className={`flex-1 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                        isSignedByMe ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                    }`}
                >
                    {isSignedByMe ? (
                        <><CheckCircle size={18}/> Signature Recorded</>
                    ) : (
                        signing ? "Signing..." : "Confirm & Sign Agreement"
                    )}
                </button>
            </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText size={18} className="text-gray-600"/> Status Tracker
            </h3>
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${contract.customer_signature ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm text-gray-600">Buyer: {contract.customer_signature ? 'Signed' : 'Pending'}</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${contract.owner_signature ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm text-gray-600">Owner: {contract.owner_signature ? 'Signed' : 'Pending'}</span>
                </div>
                {contract.status === 'SIGNED' && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                        <p className="text-green-800 font-bold mb-2">Deal Finalized!</p>
                        <button 
                            className="w-full py-2 bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-green-700"
                            onClick={() => window.open(contract.signed_pdf)}
                        >
                            <Download size={18}/> Download Signed PDF
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
