import os
from datetime import datetime
from flask import current_app
from app.database import db
from app.models.invoice import Invoice
from app.repositories.purchase_order_repository import PurchaseOrderRepository
from app.repositories.invoice_repository import InvoiceRepository
from app.services.audit_service import AuditService
from app.pdf_generator import generate_invoice_pdf
from app.mailer import send_email

class InvoiceService:

    @staticmethod
    def get_invoice_by_id(invoice_id):
        return InvoiceRepository.get_by_id(invoice_id)

    @staticmethod
    def list_invoices(search_query=None, status=None, vendor_id=None):
        return InvoiceRepository.filter_and_search(search_query, status, vendor_id)

    @staticmethod
    def create_invoice(data, current_vendor_id, current_user_id):
        """
        Creates an Invoice for an approved Purchase Order.
        Calculates GST and generates a PDF.
        """
        po_id = data['po_id']
        invoice_number = data['invoice_number']
        
        # Check uniqueness
        if InvoiceRepository.get_by_number(invoice_number):
            raise ValueError(f"Invoice number '{invoice_number}' already exists")
            
        po = PurchaseOrderRepository.get_by_id(po_id)
        if not po:
            raise ValueError("Purchase Order not found")
            
        # Verify ownership (Vendor must be the one assigned to the PO)
        if po.vendor_id != current_vendor_id:
            raise ValueError("This Purchase Order is not assigned to your profile")
            
        if po.status not in ['APPROVED', 'SENT', 'COMPLETED']:
            raise ValueError("Invoices can only be generated for APPROVED or SENT Purchase Orders")

        subtotal = float(po.total_amount)
        gst_rate = float(data.get('gst_rate', 18.00))
        gst_amount = subtotal * (gst_rate / 100.0)
        total_amount = subtotal + gst_amount
        
        invoice_date_val = data['invoice_date']
        if isinstance(invoice_date_val, str):
            invoice_date = datetime.strptime(invoice_date_val, "%Y-%m-%d").date()
        else:
            invoice_date = invoice_date_val

        # Create model
        invoice = Invoice(
            po_id=po_id,
            invoice_number=invoice_number,
            vendor_id=current_vendor_id,
            subtotal=subtotal,
            gst_rate=gst_rate,
            gst_amount=gst_amount,
            total_amount=total_amount,
            status='PENDING',
            invoice_date=invoice_date
        )
        
        db.session.add(invoice)
        db.session.flush() # Secure ID for files
        
        # Generate and save PDF locally
        try:
            pdf_buffer = generate_invoice_pdf(invoice, po, po.vendor)
            
            # Setup path
            upload_dir = current_app.config['UPLOAD_FOLDER']
            invoices_dir = os.path.join(upload_dir, 'invoices')
            os.makedirs(invoices_dir, exist_ok=True)
            
            safe_invoice_num = "".join([c if c.isalnum() else "_" for c in invoice_number])
            file_name = f"invoice_{invoice.id}_{safe_invoice_num}.pdf"
            file_path = os.path.join(invoices_dir, file_name)
            
            # Save bytes to disk
            with open(file_path, 'wb') as f:
                f.write(pdf_buffer.getvalue())
                
            # Set URL path
            invoice.pdf_url = f"/api/uploads/invoices/{file_name}"
            
        except Exception as pdf_err:
            current_app.logger.error(f"Failed to generate PDF for invoice: {pdf_err}")
            # Do not block invoice creation, set dummy URL or None
            invoice.pdf_url = None
            
        db.session.commit()
        
        # Audit log
        AuditService.log_activity(
            user_id=current_user_id,
            action="INVOICE_GENERATED",
            details=f"Invoice {invoice_number} created for PO ID {po_id}. Total: {total_amount}"
        )
        
        # Notify Procurement / Managers of new invoice
        procurement_email = po.creator.email if po.creator else "finance@vendorbridge.local"
        subject = f"[VendorBridge] New Invoice Submitted: {invoice_number}"
        body = f"""
        <h3>Hello Team,</h3>
        <p>A new tax invoice has been submitted by vendor: <b>{po.vendor.company_name}</b>.</p>
        <p><b>Invoice Reference:</b> {invoice_number}</p>
        <p><b>Purchase Order Reference:</b> {po.po_number}</p>
        <p><b>Invoice Total Value:</b> INR {total_amount:,.2f} (includes GST {gst_rate}%)</p>
        <p>Please log in to the ERP to verify billing details and release payment.</p>
        <br/>
        <p>Best Regards,</p>
        <p>System Alerts - VendorBridge</p>
        """
        send_email(procurement_email, subject, body)
        
        return invoice

    @staticmethod
    def pay_invoice(invoice_id, current_user_id):
        """
        Processes payment confirmation for an invoice
        """
        invoice = InvoiceRepository.get_by_id(invoice_id)
        if not invoice:
            raise ValueError("Invoice not found")
            
        if invoice.status == 'PAID':
            raise ValueError("Invoice is already marked as PAID")
            
        invoice.status = 'PAID'
        # Also auto complete PO status if needed
        if invoice.purchase_order:
            invoice.purchase_order.status = 'COMPLETED'
            
        db.session.commit()
        
        # Log approval / paid transition
        AuditService.log_approval(
            entity_type="INVOICE",
            entity_id=invoice_id,
            status_from="PENDING",
            status_to="PAID",
            action_by=current_user_id,
            remarks="Invoice payment processed."
        )
        
        AuditService.log_activity(
            user_id=current_user_id,
            action="INVOICE_PAID",
            details=f"Invoice ID {invoice_id} ({invoice.invoice_number}) marked as PAID."
        )
        
        # Notify vendor
        if invoice.vendor:
            subject = f"[VendorBridge] Payment Confirmed: {invoice.invoice_number}"
            body = f"""
            <h3>Hello {invoice.vendor.company_name},</h3>
            <p>We are pleased to inform you that the payment for Invoice <b>{invoice.invoice_number}</b> has been completed.</p>
            <p><b>Payment Value:</b> INR {invoice.total_amount:,.2f}</p>
            <p>Please check your accounts. Thank you for your business.</p>
            <br/>
            <p>Best Regards,</p>
            <p>Finance Team - VendorBridge</p>
            """
            send_email(invoice.vendor.contact_email, subject, body)
            
        return invoice
