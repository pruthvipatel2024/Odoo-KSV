import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_invoice_pdf(invoice, po, vendor):
    """
    Generates a beautifully styled invoice PDF in memory using ReportLab.
    Returns: BytesIO object containing the PDF content.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#0F172A'), # Slate 900
        spaceAfter=15
    )
    
    header_style = ParagraphStyle(
        'InvoiceHeader',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569') # Slate 600
    )
    
    label_style = ParagraphStyle(
        'InvoiceLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#1E293B') # Slate 800
    )
    
    body_style = ParagraphStyle(
        'InvoiceBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155') # Slate 700
    )
    
    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.white
    )
    
    story = []
    
    # Title & Metadata
    story.append(Paragraph("VendorBridge ERP", label_style))
    story.append(Paragraph("Enterprise Procurement Network", header_style))
    story.append(Spacer(1, 15))
    story.append(Paragraph("TAX INVOICE", title_style))
    story.append(Spacer(1, 10))
    
    # Layout metadata columns (Vendor details on left, Invoice details on right)
    vendor_details = f"""
    <b>Vendor Info:</b><br/>
    {vendor.company_name}<br/>
    GSTIN: {vendor.gst_number}<br/>
    Email: {vendor.contact_email}<br/>
    Phone: {vendor.contact_phone or 'N/A'}<br/>
    Address: {vendor.address or 'N/A'}
    """
    
    invoice_details = f"""
    <b>Invoice Info:</b><br/>
    Invoice No: {invoice.invoice_number}<br/>
    Invoice Date: {invoice.invoice_date.strftime('%Y-%m-%d')}<br/>
    PO Reference: {po.po_number}<br/>
    Status: {invoice.status.upper()}<br/>
    Created Date: {invoice.created_at.strftime('%Y-%m-%d')}
    """
    
    meta_table_data = [
        [Paragraph(vendor_details, body_style), Paragraph(invoice_details, body_style)]
    ]
    
    meta_table = Table(meta_table_data, colWidths=[270, 270])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 20),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))
    
    # Items table header
    table_data = [
        [
            Paragraph("S.No", table_header_style),
            Paragraph("Item Description", table_header_style),
            Paragraph("Qty", table_header_style),
            Paragraph("Unit Price (INR)", table_header_style),
            Paragraph("Total (INR)", table_header_style)
        ]
    ]
    
    # Items
    items = po.quotation.items if po.quotation and po.quotation.items else []
    
    if items:
        for idx, item in enumerate(items, start=1):
            table_data.append([
                Paragraph(str(idx), body_style),
                Paragraph(item.item_description, body_style),
                Paragraph(str(item.quantity), body_style),
                Paragraph(f"{item.unit_price:,.2f}", body_style),
                Paragraph(f"{item.total_price:,.2f}", body_style)
            ])
    else:
        # Fallback if PO/Quotation has no itemized details (use overall amount as a lump sum item)
        table_data.append([
            Paragraph("1", body_style),
            Paragraph(f"Procurement Services under RFQ Ref {po.rfq.rfq_number}", body_style),
            Paragraph("1", body_style),
            Paragraph(f"{invoice.subtotal:,.2f}", body_style),
            Paragraph(f"{invoice.subtotal:,.2f}", body_style)
        ])
        
    # Financial breakdown
    financial_rows = [
        ["", "", "", "Subtotal:", f"INR {invoice.subtotal:,.2f}"],
        ["", "", "", f"GST ({invoice.gst_rate}%):", f"INR {invoice.gst_amount:,.2f}"],
        ["", "", "", "Total Amount:", f"INR {invoice.total_amount:,.2f}"]
    ]
    
    for row in financial_rows:
        table_data.append([
            Paragraph("", body_style),
            Paragraph("", body_style),
            Paragraph("", body_style),
            Paragraph(f"<b>{row[3]}</b>", body_style),
            Paragraph(f"<b>{row[4]}</b>", body_style)
        ])
        
    items_table = Table(table_data, colWidths=[40, 240, 40, 100, 120])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('ALIGN', (2,0), (-1,-1), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1, -(len(financial_rows) + 1)), 0.5, colors.HexColor('#CBD5E1')),
        ('BACKGROUND', (3, -len(financial_rows)), (-1, -1), colors.HexColor('#F8FAFC')),
        ('LINEABOVE', (3, -len(financial_rows)), (-1, -len(financial_rows)), 1, colors.HexColor('#0F172A')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    
    story.append(items_table)
    story.append(Spacer(1, 40))
    
    # Sign-off note
    story.append(Paragraph("<b>Terms & Conditions:</b>", label_style))
    story.append(Paragraph("1. Please process the payment within 30 days of receipt of this invoice.", body_style))
    story.append(Paragraph("2. All disputes are subject to local jurisdiction.", body_style))
    story.append(Spacer(1, 20))
    story.append(Paragraph("This is a computer-generated tax invoice and requires no signature.", header_style))
    
    doc.build(story)
    buffer.seek(0)
    return buffer
