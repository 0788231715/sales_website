import os
from celery import shared_task
from django.conf import settings
from django.core.files import File
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from io import BytesIO
import base64
from .models import Contract

@shared_task
def generate_contract_pdf(contract_id):
    try:
        contract = Contract.objects.get(id=contract_id)
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        
        # Header
        p.setFont("Helvetica-Bold", 16)
        p.drawString(100, 750, "PURCHASE AGREEMENT")
        
        p.setFont("Helvetica", 12)
        p.drawString(100, 730, f"Contract ID: {contract.id}")
        p.drawString(100, 715, f"Date: {contract.created_at.strftime('%Y-%m-%d')}")
        
        # Content
        p.drawString(100, 680, f"Property: {contract.booking.property.title}")
        p.drawString(100, 665, f"Address: {contract.booking.property.address}")
        p.drawString(100, 650, f"Price: ${contract.booking.property.price}")
        
        p.drawString(100, 620, f"Buyer: {contract.booking.customer.full_name} ({contract.booking.customer.email})")
        p.drawString(100, 605, f"Seller: {contract.booking.property.owner.full_name} ({contract.booking.property.owner.email})")
        
        # Terms (Simulated from template)
        p.setFont("Helvetica-Bold", 14)
        p.drawString(100, 570, "Terms and Conditions:")
        p.setFont("Helvetica", 10)
        text = p.beginText(100, 550)
        text.textLines("""
        1. The buyer agrees to purchase the property at the stated price.
        2. The seller guarantees that the property is free of undisclosed encumbrances.
        3. Both parties agree to the digital signature as legally binding.
        4. Proof of payment must be provided within 48 hours of signing.
        """)
        p.drawText(text)
        
        # Signatures
        p.setFont("Helvetica-Bold", 12)
        p.drawString(100, 400, "Signatures:")
        
        # Buyer Signature (Base64 image)
        if contract.customer_signature:
            try:
                sig_data = contract.customer_signature.split(',')[1]
                sig_img = BytesIO(base64.b64decode(sig_data))
                p.drawInlineImage(sig_img, 100, 300, width=150, height=50)
                p.drawString(100, 290, "Buyer Signature")
            except:
                p.drawString(100, 300, "[Buyer Digital Signature Recorded]")

        # Seller Signature
        if contract.owner_signature:
            try:
                sig_data = contract.owner_signature.split(',')[1]
                sig_img = BytesIO(base64.b64decode(sig_data))
                p.drawInlineImage(sig_img, 350, 300, width=150, height=50)
                p.drawString(350, 290, "Seller Signature")
            except:
                p.drawString(350, 300, "[Seller Digital Signature Recorded]")

        p.showPage()
        p.save()
        
        buffer.seek(0)
        filename = f"contract_{contract.id}.pdf"
        contract.signed_pdf.save(filename, File(buffer), save=False)
        contract.status = 'SIGNED' # Ensure status is SIGNED
        contract.save()
        
        return f"Successfully generated PDF for Contract {contract_id}"
    except Exception as e:
        return f"Error generating PDF: {str(e)}"
