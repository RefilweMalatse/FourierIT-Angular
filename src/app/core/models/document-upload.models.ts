// ─── Enums ───────────────────────────────────────────────────────────────────

export enum UserRole {
  DATA_SUBJECT = 'DATA_SUBJECT',
  COMPANY_REP = 'COMPANY_REP',
  COMPLIANCE_OFFICER = 'COMPLIANCE_OFFICER',
  ADMIN = 'ADMIN',
}

export enum EntityType {
  INDIVIDUAL = 'INDIVIDUAL',
  COMPANY = 'COMPANY',
}

export enum DocumentCategory {
  KYC = 'KYC',
  FICA = 'FICA',
}

export enum DocumentStatus {
  NOT_UPLOADED = 'NOT_UPLOADED',
  UPLOADED = 'UPLOADED',
  AWAITING_REVIEW = 'AWAITING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum DocumentKey {
  // Individual — KYC
  SA_ID_OR_PASSPORT = 'SA_ID_OR_PASSPORT',
  // Individual — FICA
  PROOF_OF_ADDRESS = 'PROOF_OF_ADDRESS',
  SARS_TAX_CONFIRMATION = 'SARS_TAX_CONFIRMATION',
  BANK_STATEMENT_INDIVIDUAL = 'BANK_STATEMENT_INDIVIDUAL',
  JOINT_ADDRESS_DECLARATION = 'JOINT_ADDRESS_DECLARATION',
  // Company — KYC
  CIPC_REGISTRATION = 'CIPC_REGISTRATION',
  MEMORANDUM_OF_INCORPORATION = 'MEMORANDUM_OF_INCORPORATION',
  SHAREHOLDING_REGISTER = 'SHAREHOLDING_REGISTER',
  DIRECTOR_ID = 'DIRECTOR_ID',
  BENEFICIAL_OWNER_ID = 'BENEFICIAL_OWNER_ID',
  // Company — FICA
  COMPANY_RESOLUTION = 'COMPANY_RESOLUTION',
  SARS_VAT_REGISTRATION = 'SARS_VAT_REGISTRATION',
  BANK_STATEMENT_COMPANY = 'BANK_STATEMENT_COMPANY',
  PROOF_OF_BUSINESS_ADDRESS = 'PROOF_OF_BUSINESS_ADDRESS',
  PROOF_OF_SOURCE_OF_FUNDS = 'PROOF_OF_SOURCE_OF_FUNDS',
  DIRECTOR_PROOF_OF_ADDRESS = 'DIRECTOR_PROOF_OF_ADDRESS',
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface DocumentItem {
  id: string;
  key: DocumentKey;
  label: string;
  category: DocumentCategory;
  mandatory: boolean;
  dateSensitive: boolean;
  conditional: boolean;
  linkedPersonName?: string;
  uploadedFile?: UploadedDocument;
}

export interface UploadedDocument {
  documentId: string;
  documentItemId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: Date;
  uploadedBy: string;
  documentOwner: string;
  documentDate?: Date;
  status: DocumentStatus;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
}

export interface ConsentRecord {
  subjectId: string;
  consentGiven: boolean;
  consentGivenAt?: Date;
  consentGivenBy: string;
}

export interface Director {
  id: string;
  name: string;
}

export interface BeneficialOwner {
  id: string;
  name: string;
  shareholdingPercentage: number;
}

export interface DeclarationState {
  isForeignNational: boolean;
  hasNoPersonalProofOfAddress: boolean;
  directors: Director[];
  beneficialOwners: BeneficialOwner[];
}

export interface UploadPageState {
  consentGiven: boolean;
  entityType: EntityType | null;
  todoList: DocumentItem[];
  uploadedDocuments: UploadedDocument[];
  declarations: DeclarationState;
  canSubmit: boolean;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const DATE_SENSITIVE_MONTHS = 3;