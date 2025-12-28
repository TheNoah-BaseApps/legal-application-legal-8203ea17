CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  password text NOT NULL,
  role text DEFAULT 'staff' NOT NULL,
  phone text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

CREATE TABLE IF NOT EXISTS customers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  customer_id text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  contact_person text,
  contact_number text,
  email_address text,
  industry_type text,
  registration_date date NOT NULL,
  customer_status text DEFAULT 'Active' NOT NULL,
  address_line text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers (customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers (customer_status);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email_address);

CREATE TABLE IF NOT EXISTS cases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  case_id text NOT NULL UNIQUE,
  case_title text NOT NULL,
  client_id uuid NOT NULL,
  case_type text NOT NULL,
  case_status text DEFAULT 'New' NOT NULL,
  assigned_attorney uuid,
  filing_date date NOT NULL,
  court_name text,
  hearing_date date,
  description text,
  priority text DEFAULT 'Medium' NOT NULL,
  estimated_value decimal(15,2),
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cases_case_id ON cases (case_id);
CREATE INDEX IF NOT EXISTS idx_cases_client_id ON cases (client_id);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_attorney ON cases (assigned_attorney);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases (case_status);
CREATE INDEX IF NOT EXISTS idx_cases_filing_date ON cases (filing_date);

CREATE TABLE IF NOT EXISTS engagements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  engagement_id text NOT NULL UNIQUE,
  client_id uuid NOT NULL,
  engagement_type text NOT NULL,
  engagement_date date NOT NULL,
  engagement_outcome text,
  contact_person text,
  recorded_by uuid NOT NULL,
  engagement_channel text,
  engagement_notes text,
  case_id uuid,
  duration_minutes integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_engagements_engagement_id ON engagements (engagement_id);
CREATE INDEX IF NOT EXISTS idx_engagements_client_id ON engagements (client_id);
CREATE INDEX IF NOT EXISTS idx_engagements_case_id ON engagements (case_id);
CREATE INDEX IF NOT EXISTS idx_engagements_date ON engagements (engagement_date);

CREATE TABLE IF NOT EXISTS documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  document_name text NOT NULL,
  document_type text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL,
  uploaded_by uuid NOT NULL,
  case_id uuid,
  customer_id uuid,
  version integer DEFAULT 1 NOT NULL,
  is_current boolean DEFAULT true NOT NULL,
  tags text[],
  uploaded_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents (case_id);
CREATE INDEX IF NOT EXISTS idx_documents_customer_id ON documents (customer_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_is_current ON documents (is_current);

CREATE TABLE IF NOT EXISTS compliance_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  case_id uuid NOT NULL,
  compliance_type text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'Pending' NOT NULL,
  assigned_to uuid,
  due_date date NOT NULL,
  completed_date date,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_compliance_case_id ON compliance_items (case_id);
CREATE INDEX IF NOT EXISTS idx_compliance_assigned_to ON compliance_items (assigned_to);
CREATE INDEX IF NOT EXISTS idx_compliance_status ON compliance_items (status);
CREATE INDEX IF NOT EXISTS idx_compliance_due_date ON compliance_items (due_date);

CREATE TABLE IF NOT EXISTS time_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  case_id uuid NOT NULL,
  user_id uuid NOT NULL,
  activity_description text NOT NULL,
  hours decimal(5,2) NOT NULL,
  billable boolean DEFAULT true NOT NULL,
  rate decimal(10,2) NOT NULL,
  date date NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_time_entries_case_id ON time_entries (case_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries (user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries (date);
CREATE INDEX IF NOT EXISTS idx_time_entries_billable ON time_entries (billable);

CREATE TABLE IF NOT EXISTS invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  invoice_number text NOT NULL UNIQUE,
  customer_id uuid NOT NULL,
  case_id uuid,
  total_amount decimal(15,2) NOT NULL,
  status text DEFAULT 'Draft' NOT NULL,
  issue_date date NOT NULL,
  due_date date NOT NULL,
  paid_date date,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices (invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices (customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_case_id ON invoices (case_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices (due_date);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  changes jsonb,
  ip_address text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs (entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);