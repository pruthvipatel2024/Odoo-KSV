# VendorBridge Procurement & Vendor Management ERP

VendorBridge is an enterprise-grade, full-stack Procurement & Vendor Management ERP platform. It connects procurement teams, managers, and external suppliers through unified sourcing portals, commercial bidding comparison matrixes, Purchase Order workflows, automated GST computations, and ReportLab PDF invoicing.

---

## Tech Stack

### Backend
- **Core**: Flask 3.0, Flask-SQLAlchemy, Flask-Migrate, Flask-JWT-Extended
- **Validation**: Marshmallow
- **DB Driver**: PyMySQL (MySQL 8 compatible)
- **PDF Generation**: ReportLab
- **Integrations**: Cloudinary (file uploads), standard SMTP (email alerts)

### Frontend
- **Framework**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **Sourcing queries**: TanStack Query
- **Charts**: Recharts
- **Aesthetic**: Customized ShadCN UI style (glassmorphic dark slate, hover micro-animations)

---

## Folder Structure

```
d:\Odoo-KSV\
├── backend/
│   ├── app/
│   │   ├── models/           # SQLAlchemy database tables
│   │   ├── repositories/     # Repository layer isolating SQL queries
│   │   ├── services/         # Business logic layer & transitions
│   │   ├── schemas/          # Marshmallow DTO validators
│   │   ├── routes/           # Blueprints and endpoints
│   │   ├── upload.py         # File attachment service
│   │   ├── email.py          # Asynchronous SMTP mailing
│   │   ├── pdf_generator.py  # ReportLab tax invoice layout
│   │   └── decorators.py     # Role-based guards
│   ├── requirements.txt      # Python dependencies
│   ├── .env                  # Environment configurations
│   ├── run.py                # Server runner
│   └── seed.py               # Database seed script
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ui/           # Custom ShadCN-style UI elements
    │   │   ├── layout/       # Sidebar, Navbar, and wrappers
    │   │   └── RoleGuard.tsx # Client-side RBAC guards
    │   ├── context/          # LocalStorage token auth contexts
    │   ├── hooks/            # Fetch client wrappers
    │   ├── pages/            # Login, Sourcing, PO, Invoice pages
    │   └── App.tsx           # Route declarations
    ├── tailwind.config.js    # Styling theme extended variables
    └── package.json          # Node modules
```

---

## Getting Started

### 1. Database & Backend Setup
Make sure you have Python 3.12+ installed. 

```bash
# Navigate to backend directory
cd backend

# Install dependencies (ensure matching python executable)
python -m pip install -r requirements.txt

# Seed the SQLite database with mock users and quotations
python seed.py

# Start the Flask development server (runs on http://localhost:5000)
python run.py
```

### 2. Frontend Client Setup
Make sure you have Node.js 18+ installed.

```bash
# Open a new terminal in the frontend directory
cd frontend

# Install package dependencies
npm install

# Start Vite development server (runs on http://localhost:5173)
npm run dev
```

---

## Seed Test Accounts

The seed script (`backend/seed.py`) populates the database with default accounts (Password for all is listed below):

| Corporate Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@vendorbridge.local` | `Admin@123` | Can verify all profiles, access logs |
| **Procurement Officer** | `procurement@vendorbridge.local` | `Officer@123` | Creates RFQs, invites vendors, reviews bids |
| **Procurement Manager** | `manager@vendorbridge.local` | `Manager@123` | Approves POs, signs off status transitions |
| **Approved Vendor A** | `vendor1@vendorbridge.local` | `Vendor@123` | "Acme Industrial Solutions Pvt Ltd" (GST: `27AAAAA1111A1Z1`, Rating: `4.8`) |
| **Approved Vendor B** | `vendor2@vendorbridge.local` | `Vendor@123` | "Beta Global Supplies Inc" (GST: `27BBBBB2222B2Z2`, Rating: `4.5`) |
| **Pending Vendor C** | `vendor3@vendorbridge.local` | `Vendor@123` | "Gamma Logistics & Machinery" (GST: `27CCCCC3333C3Z3`) - Awaiting approval |

---

## Sourcing Lifecycle Workflow

1. **Invitation**: Sourcing starts with a **Procurement Officer** creating an RFQ and inviting Approved Vendors.
2. **Bidding**: Invited **Vendors** submit line-item quotation proposals, lead times, and terms before the deadline.
3. **Evaluation**: **Procurement Officer** reviews the comparison matrix board highlighting the lowest bid and fastest lead time.
4. **Fulfillment**: **Procurement Officer** awards the contract which automatically generates a PO contract in `PENDING_APPROVAL` status.
5. **Approval**: **Manager** reviews the PO details, logs remarks, and approves the contract.
6. **Invoicing**: **Vendor** completes fulfillment and generates a tax invoice. The invoice calculates GST and generates a PDF.
7. **Settlement**: **Manager** marks the invoice as paid, completing the workflow.
