// ─── Enums ───────────────────────────────────────────────────────────────────

export enum InstitutionRequestStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  ADDITIONAL_INFO_REQUIRED = 'ADDITIONAL_INFO_REQUIRED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum DocumentAccessStatus {
  ACTIVE = 'ACTIVE',
  EXPIRING_SOON = 'EXPIRING_SOON',
  EXPIRED = 'EXPIRED',
}

export enum AuditEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  OTP_SENT = 'OTP_SENT',
  OTP_VERIFIED = 'OTP_VERIFIED',
  REQUEST_CREATED = 'REQUEST_CREATED',
  REQUEST_UPDATED = 'REQUEST_UPDATED',
  REQUEST_APPROVED = 'REQUEST_APPROVED',
  REQUEST_REJECTED = 'REQUEST_REJECTED',
  REQUEST_INFORMATION_REQUIRED = 'REQUEST_INFORMATION_REQUIRED',
  DOCUMENT_VIEWED = 'DOCUMENT_VIEWED',
  DOCUMENT_DOWNLOADED = 'DOCUMENT_DOWNLOADED',
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  ACCESS_EXPIRED = 'ACCESS_EXPIRED',
  LOGOUT = 'LOGOUT',
  PAGE_VIEW = 'PAGE_VIEW',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum RequestPurpose {
  KYC_VERIFICATION = 'KYC_VERIFICATION',
  FICA_COMPLIANCE_REVIEW = 'FICA_COMPLIANCE_REVIEW',
  ACCOUNT_OPENING = 'ACCOUNT_OPENING',
  REGULATORY_AUDIT = 'REGULATORY_AUDIT',
  VENDOR_DUE_DILIGENCE = 'VENDOR_DUE_DILIGENCE',
  OTHER = 'OTHER',
}

export enum DocumentCategory {
  KYC_DOCUMENTS = 'KYC_DOCUMENTS',
  FICA_DOCUMENTS = 'FICA_DOCUMENTS',
  TAX_COMPLIANCE = 'TAX_COMPLIANCE',
  CORPORATE_GOVERNANCE = 'CORPORATE_GOVERNANCE',
}

// ─── Institution Session ──────────────────────────────────────────────────────

export interface InstitutionSession {
  institutionId: string;
  institutionName: string;
  institutionCode: string;       // e.g. INST-FP2024
  email: string;                 // masked for display e.g. c***@fourier-partner.com
  sessionToken: string;
  accessToken: string;           // the original invitation token
  authenticatedAt: string;       // ISO string
  expiresAt: string;             // ISO string — 8 hours from auth
  authMethod: 'OTP_VERIFIED';
}

// ─── Token Validation ────────────────────────────────────────────────────────

export interface TokenValidationRequest {
  accessToken: string;
}

export interface TokenValidationResponse {
  valid: boolean;
  institutionId: string;
  institutionName: string;
  institutionCode: string;
  maskedEmail: string;
  message?: string;
}

// ─── OTP ─────────────────────────────────────────────────────────────────────

export interface OtpVerifyRequest {
  institutionId: string;
  otp: string;
  accessToken: string;
}

export interface OtpVerifyResponse {
  success: boolean;
  sessionToken: string;
  expiresAt: string;
  message?: string;
}

export interface OtpResendRequest {
  institutionId: string;
  accessToken: string;
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  userId: string;
  institutionId: string;
  timestamp: string;
  actionType: AuditEventType;
  details?: string;
  ipAddress?: string;
  requestId?: string;
  documentId?: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface InstitutionDashboardStats {
  activeRequests: number;
  approvedRequests: number;
  expiredAccess: number;
}

export interface RecentActivity {
  id: string;
  type: AuditEventType;
  description: string;
  timestamp: string;
  requestId?: string;
  documentId?: string;
}

// ─── Document Request ────────────────────────────────────────────────────────

export interface DocumentRequestPayload {
  institutionId: string;
  purpose: RequestPurpose;
  category: DocumentCategory;
  documentIds: string[];
  submissionDeadline: string;   // future date ISO string
  referenceNumber: string;
  justification: string;
}

export interface DocumentRequest {
  requestId: string;
  institutionId: string;
  purpose: RequestPurpose;
  purposeLabel: string;
  category: DocumentCategory;
  categoryLabel: string;
  documents: RequestedDocument[];
  submissionDeadline: string;
  referenceNumber: string;
  justification: string;
  status: InstitutionRequestStatus;
  submittedAt: string;
  accessGrantedUntil?: string;
  accessStartDate?: string;
  complianceOfficerNotes?: string;
  rejectionReason?: string;
}

export interface RequestedDocument {
  documentId: string;
  documentName: string;
  category: DocumentCategory;
}

// ─── Available Documents ─────────────────────────────────────────────────────

export interface AvailableDocument {
  documentId: string;
  documentName: string;
  category: DocumentCategory;
}

export const CATEGORY_DOCUMENTS: Record<DocumentCategory, AvailableDocument[]> = {
  [DocumentCategory.KYC_DOCUMENTS]: [
    { documentId: 'kyc_reg_cert', documentName: 'Registration Certificate', category: DocumentCategory.KYC_DOCUMENTS },
    { documentId: 'kyc_proof_address', documentName: 'Proof of Address', category: DocumentCategory.KYC_DOCUMENTS },
    { documentId: 'kyc_director_ids', documentName: 'Director IDs', category: DocumentCategory.KYC_DOCUMENTS },
    { documentId: 'kyc_shareholder_register', documentName: 'Shareholder Register', category: DocumentCategory.KYC_DOCUMENTS },
    { documentId: 'kyc_beneficial_ownership', documentName: 'Beneficial Ownership Declaration', category: DocumentCategory.KYC_DOCUMENTS },
  ],
  [DocumentCategory.FICA_DOCUMENTS]: [
    { documentId: 'fica_compliance_cert', documentName: 'FICA Compliance Certificate', category: DocumentCategory.FICA_DOCUMENTS },
    { documentId: 'fica_source_of_funds', documentName: 'Source of Funds Declaration', category: DocumentCategory.FICA_DOCUMENTS },
    { documentId: 'fica_bank_confirmation', documentName: 'Bank Account Confirmation', category: DocumentCategory.FICA_DOCUMENTS },
    { documentId: 'fica_vat_reg', documentName: 'VAT Registration Certificate', category: DocumentCategory.FICA_DOCUMENTS },
  ],
  [DocumentCategory.TAX_COMPLIANCE]: [
    { documentId: 'tax_clearance', documentName: 'Tax Clearance Certificate', category: DocumentCategory.TAX_COMPLIANCE },
    { documentId: 'tax_vat_cert', documentName: 'VAT Registration Certificate', category: DocumentCategory.TAX_COMPLIANCE },
    { documentId: 'tax_income_tax', documentName: 'Income Tax Registration', category: DocumentCategory.TAX_COMPLIANCE },
  ],
  [DocumentCategory.CORPORATE_GOVERNANCE]: [
    { documentId: 'corp_memorandum', documentName: 'Memorandum of Incorporation', category: DocumentCategory.CORPORATE_GOVERNANCE },
    { documentId: 'corp_cipc', documentName: 'CIPC Registration Documents', category: DocumentCategory.CORPORATE_GOVERNANCE },
    { documentId: 'corp_resolution', documentName: 'Board Resolution', category: DocumentCategory.CORPORATE_GOVERNANCE },
  ],
};

export const PURPOSE_LABELS: Record<RequestPurpose, string> = {
  [RequestPurpose.KYC_VERIFICATION]: 'KYC Verification',
  [RequestPurpose.FICA_COMPLIANCE_REVIEW]: 'FICA Compliance Review',
  [RequestPurpose.ACCOUNT_OPENING]: 'Account Opening',
  [RequestPurpose.REGULATORY_AUDIT]: 'Regulatory Audit',
  [RequestPurpose.VENDOR_DUE_DILIGENCE]: 'Vendor Due Diligence',
  [RequestPurpose.OTHER]: 'Other',
};

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  [DocumentCategory.KYC_DOCUMENTS]: 'KYC Documents',
  [DocumentCategory.FICA_DOCUMENTS]: 'FICA Documents',
  [DocumentCategory.TAX_COMPLIANCE]: 'Tax Compliance',
  [DocumentCategory.CORPORATE_GOVERNANCE]: 'Corporate Governance',
};

// ─── Approved Documents ──────────────────────────────────────────────────────

export interface ApprovedDocument {
  documentId: string;
  documentName: string;
  category: DocumentCategory;
  categoryLabel: string;
  version: string;
  dateShared: string;
  expiryDate: string;
  accessStatus: DocumentAccessStatus;
  requestId: string;
  downloadPermitted: boolean;
}

// ─── Request Wizard State ────────────────────────────────────────────────────

export interface RequestWizardState {
  step: 1 | 2 | 3 | 4 | 5;
  purpose: RequestPurpose | null;
  category: DocumentCategory | null;
  selectedDocumentIds: string[];
  submissionDeadline: string;
  referenceNumber: string;
  justification: string;
  submittedRequestId: string | null;
}