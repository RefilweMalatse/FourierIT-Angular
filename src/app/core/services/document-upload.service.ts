import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  DocumentItem,
  DocumentKey,
  DocumentCategory,
  DocumentStatus,
  EntityType,
  UserRole,
  UploadedDocument,
  ConsentRecord,
  DeclarationState,
  UploadPageState,
  FileValidationResult,
  Director,
  BeneficialOwner,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
  DATE_SENSITIVE_MONTHS,
} from '../models/document-upload.models';

@Injectable({ providedIn: 'root' })
export class DocumentUploadService {
  private http = inject(HttpClient);
  private apiBase = '/api/documents';

  private initialState: UploadPageState = {
    consentGiven: false,
    entityType: null,
    todoList: [],
    uploadedDocuments: [],
    declarations: {
      isForeignNational: false,
      hasNoPersonalProofOfAddress: false,
      directors: [],
      beneficialOwners: [],
    },
    canSubmit: false,
  };

  private state$ = new BehaviorSubject<UploadPageState>(this.initialState);

  // ─── State Access ───────────────────────────────────────────────────────────

  getState(): Observable<UploadPageState> {
    return this.state$.asObservable();
  }

  getSnapshot(): UploadPageState {
    return this.state$.getValue();
  }

  private patchState(patch: Partial<UploadPageState>): void {
    this.state$.next({ ...this.state$.getValue(), ...patch });
  }

  resetState(): void {
    this.state$.next({ ...this.initialState });
  }

  // ─── Step 1: POPIA Consent ──────────────────────────────────────────────────

  checkConsent(subjectId: string): Observable<ConsentRecord> {
    return this.http.get<ConsentRecord>(`${this.apiBase}/consent/${subjectId}`);
  }

  recordConsent(subjectId: string, givenBy: string): Observable<ConsentRecord> {
    return this.http
      .post<ConsentRecord>(`${this.apiBase}/consent`, {
        subjectId,
        givenBy,
        consentGiven: true,
      })
      .pipe(tap(() => this.patchState({ consentGiven: true })));
  }

  setConsentGiven(value: boolean): void {
    this.patchState({ consentGiven: value });
  }

  // ─── Step 2: Entity Type ────────────────────────────────────────────────────

  setEntityType(entityType: EntityType): void {
    const todoList = this.buildTodoList(entityType, this.getSnapshot().declarations);
    this.patchState({ entityType, todoList });
  }

  // ─── Step 3: Declarations ───────────────────────────────────────────────────

  updateDeclaration(patch: Partial<DeclarationState>): void {
    const current = this.getSnapshot();
    const declarations = { ...current.declarations, ...patch };
    const todoList = current.entityType
      ? this.buildTodoList(current.entityType, declarations)
      : [];
    this.patchState({ declarations, todoList });
    this.evaluateSubmissionGate();
  }

  addDirector(director: Director): void {
    const directors = [...this.getSnapshot().declarations.directors, director];
    this.updateDeclaration({ directors });
  }

  removeDirector(directorId: string): void {
    const directors = this.getSnapshot().declarations.directors.filter(
      (d) => d.id !== directorId
    );
    this.updateDeclaration({ directors });
  }

  addBeneficialOwner(owner: BeneficialOwner): void {
    const beneficialOwners = [...this.getSnapshot().declarations.beneficialOwners, owner];
    this.updateDeclaration({ beneficialOwners });
  }

  removeBeneficialOwner(ownerId: string): void {
    const beneficialOwners = this.getSnapshot().declarations.beneficialOwners.filter(
      (o) => o.id !== ownerId
    );
    this.updateDeclaration({ beneficialOwners });
  }

  // ─── To-Do List Builder ─────────────────────────────────────────────────────

  private buildTodoList(entityType: EntityType, declarations: DeclarationState): DocumentItem[] {
    const existing = this.getSnapshot().todoList;
    const getStatus = (id: string) =>
      existing.find((i) => i.id === id)?.uploadedFile ? undefined : undefined;
    const getExisting = (id: string) => existing.find((i) => i.id === id)?.uploadedFile;

    const make = (
      id: string,
      key: DocumentKey,
      label: string,
      category: DocumentCategory,
      opts: { dateSensitive?: boolean; conditional?: boolean; linkedPersonName?: string } = {}
    ): DocumentItem => ({
      id,
      key,
      label,
      category,
      mandatory: true,
      dateSensitive: opts.dateSensitive ?? false,
      conditional: opts.conditional ?? false,
      linkedPersonName: opts.linkedPersonName,
      uploadedFile: getExisting(id),
    });

    if (entityType === EntityType.INDIVIDUAL) {
      return this.buildIndividualList(declarations, make);
    }
    return this.buildCompanyList(declarations, make);
  }

  private buildIndividualList(
    declarations: DeclarationState,
    make: (
      id: string,
      key: DocumentKey,
      label: string,
      category: DocumentCategory,
      opts?: any
    ) => DocumentItem
  ): DocumentItem[] {
    const items: DocumentItem[] = [];

    items.push(
      make(
        DocumentKey.SA_ID_OR_PASSPORT,
        DocumentKey.SA_ID_OR_PASSPORT,
        declarations.isForeignNational ? 'Passport (Foreign National)' : 'Copy of SA ID / Passport',
        DocumentCategory.KYC
      )
    );

    if (!declarations.hasNoPersonalProofOfAddress) {
      items.push(
        make(
          DocumentKey.PROOF_OF_ADDRESS,
          DocumentKey.PROOF_OF_ADDRESS,
          'Proof of residential address (less than 3 months old)',
          DocumentCategory.FICA,
          { dateSensitive: true }
        )
      );
    } else {
      items.push(
        make(
          DocumentKey.JOINT_ADDRESS_DECLARATION,
          DocumentKey.JOINT_ADDRESS_DECLARATION,
          'Joint Residential Address Declaration',
          DocumentCategory.FICA,
          { conditional: true }
        )
      );
    }

    items.push(
      make(
        DocumentKey.SARS_TAX_CONFIRMATION,
        DocumentKey.SARS_TAX_CONFIRMATION,
        'SARS income tax number confirmation',
        DocumentCategory.FICA
      ),
      make(
        DocumentKey.BANK_STATEMENT_INDIVIDUAL,
        DocumentKey.BANK_STATEMENT_INDIVIDUAL,
        'Bank statement confirming banking details (less than 3 months old)',
        DocumentCategory.FICA,
        { dateSensitive: true }
      )
    );

    return items;
  }

  private buildCompanyList(
    declarations: DeclarationState,
    make: (
      id: string,
      key: DocumentKey,
      label: string,
      category: DocumentCategory,
      opts?: any
    ) => DocumentItem
  ): DocumentItem[] {
    const items: DocumentItem[] = [];

    // KYC static
    items.push(
      make(DocumentKey.CIPC_REGISTRATION, DocumentKey.CIPC_REGISTRATION, 'CIPC registration documents', DocumentCategory.KYC),
      make(DocumentKey.MEMORANDUM_OF_INCORPORATION, DocumentKey.MEMORANDUM_OF_INCORPORATION, 'Memorandum of Incorporation (CoR14.1)', DocumentCategory.KYC),
      make(DocumentKey.SHAREHOLDING_REGISTER, DocumentKey.SHAREHOLDING_REGISTER, 'Shareholding register / ownership structure diagram', DocumentCategory.KYC)
    );

    // KYC dynamic — directors
    declarations.directors.forEach((director) => {
      const id = `${DocumentKey.DIRECTOR_ID}_${director.id}`;
      items.push(make(id, DocumentKey.DIRECTOR_ID, `Director ID — ${director.name}`, DocumentCategory.KYC, { linkedPersonName: director.name }));
    });

    // KYC dynamic — beneficial owners
    declarations.beneficialOwners.forEach((owner) => {
      const id = `${DocumentKey.BENEFICIAL_OWNER_ID}_${owner.id}`;
      items.push(make(id, DocumentKey.BENEFICIAL_OWNER_ID, `Beneficial Owner ID — ${owner.name} (${owner.shareholdingPercentage}%)`, DocumentCategory.KYC, { linkedPersonName: owner.name }));
    });

    // FICA static
    items.push(
      make(DocumentKey.COMPANY_RESOLUTION, DocumentKey.COMPANY_RESOLUTION, 'Company resolution signed by all directors', DocumentCategory.FICA),
      make(DocumentKey.SARS_VAT_REGISTRATION, DocumentKey.SARS_VAT_REGISTRATION, 'SARS income tax / VAT registration confirmation', DocumentCategory.FICA),
      make(DocumentKey.BANK_STATEMENT_COMPANY, DocumentKey.BANK_STATEMENT_COMPANY, 'Bank statement confirming company banking details (less than 3 months old)', DocumentCategory.FICA, { dateSensitive: true }),
      make(DocumentKey.PROOF_OF_BUSINESS_ADDRESS, DocumentKey.PROOF_OF_BUSINESS_ADDRESS, 'Proof of business address (less than 3 months old)', DocumentCategory.FICA, { dateSensitive: true }),
      make(DocumentKey.PROOF_OF_SOURCE_OF_FUNDS, DocumentKey.PROOF_OF_SOURCE_OF_FUNDS, 'Proof of source of funds', DocumentCategory.FICA)
    );

    // FICA dynamic — director proof of address
    declarations.directors.forEach((director) => {
      const id = `${DocumentKey.DIRECTOR_PROOF_OF_ADDRESS}_${director.id}`;
      items.push(make(id, DocumentKey.DIRECTOR_PROOF_OF_ADDRESS, `Director proof of residential address — ${director.name} (less than 3 months old)`, DocumentCategory.FICA, { dateSensitive: true, linkedPersonName: director.name }));
    });

    return items;
  }

  // ─── Upload ─────────────────────────────────────────────────────────────────

  uploadDocument(
    file: File,
    documentItem: DocumentItem,
    uploadedBy: string,
    documentOwner: string,
    documentDate?: Date
  ): Observable<UploadedDocument> {
    const validation = this.validateFile(file);
    if (!validation.valid) return throwError(() => new Error(validation.error));

    if (documentItem.dateSensitive && documentDate) {
      const dateValidation = this.validateDocumentDate(documentDate);
      if (!dateValidation.valid) return throwError(() => new Error(dateValidation.error));
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentItemId', documentItem.id);
    formData.append('documentKey', documentItem.key);
    formData.append('uploadedBy', uploadedBy);
    formData.append('documentOwner', documentOwner);
    if (documentDate) formData.append('documentDate', documentDate.toISOString());

    return this.http.post<UploadedDocument>(`${this.apiBase}/upload`, formData).pipe(
      tap((uploaded) => this.markItemUploaded(documentItem.id, uploaded))
    );
  }

  private markItemUploaded(itemId: string, uploaded: UploadedDocument): void {
    const current = this.getSnapshot();
    // Remove from to-do list
    const todoList = current.todoList.filter((item) => item.id !== itemId);
    const uploadedDocuments = [...current.uploadedDocuments, uploaded];
    this.patchState({ todoList, uploadedDocuments });
    this.evaluateSubmissionGate();
  }

  reUploadDocument(
    file: File,
    uploadedDocument: UploadedDocument,
    uploadedBy: string
  ): Observable<UploadedDocument> {
    const validation = this.validateFile(file);
    if (!validation.valid) return throwError(() => new Error(validation.error));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentId', uploadedDocument.documentId);
    formData.append('uploadedBy', uploadedBy);

    return this.http.post<UploadedDocument>(`${this.apiBase}/reupload`, formData).pipe(
      tap((updated) => {
        const uploadedDocuments = this.getSnapshot().uploadedDocuments.map((d) =>
          d.documentId === updated.documentId ? updated : d
        );
        this.patchState({ uploadedDocuments });
        this.evaluateSubmissionGate();
      })
    );
  }

  // ─── Submission ─────────────────────────────────────────────────────────────

  /**
   * Gate: to-do list empty AND all uploaded docs are APPROVED
   */
  private evaluateSubmissionGate(): void {
    const { todoList, uploadedDocuments } = this.getSnapshot();
    const outstanding = todoList.filter((i) => i.mandatory).length;
    const allApproved = uploadedDocuments.length > 0 &&
      uploadedDocuments.every((d) => d.status === DocumentStatus.APPROVED);
    this.patchState({ canSubmit: outstanding === 0 && allApproved });
  }

  submitForComplianceReview(subjectId: string, entityType: EntityType): Observable<void> {
    return this.http.post<void>(`${this.apiBase}/submit`, { subjectId, entityType });
  }

  // ─── Compliance Officer Actions ─────────────────────────────────────────────

  approveDocument(documentId: string, reviewerId: string): Observable<UploadedDocument> {
    return this.http
      .post<UploadedDocument>(`${this.apiBase}/${documentId}/approve`, { reviewerId })
      .pipe(tap((updated) => this.updateUploaded(updated)));
  }

  rejectDocument(documentId: string, reviewerId: string, reason: string): Observable<UploadedDocument> {
    return this.http
      .post<UploadedDocument>(`${this.apiBase}/${documentId}/reject`, { reviewerId, reason })
      .pipe(tap((updated) => this.updateUploaded(updated)));
  }

  private updateUploaded(updated: UploadedDocument): void {
    const uploadedDocuments = this.getSnapshot().uploadedDocuments.map((d) =>
      d.documentId === updated.documentId ? updated : d
    );
    this.patchState({ uploadedDocuments });
    this.evaluateSubmissionGate();
  }

  // ─── Role Guards ────────────────────────────────────────────────────────────

  canUpload(role: UserRole): boolean {
    return [UserRole.DATA_SUBJECT, UserRole.COMPANY_REP, UserRole.ADMIN].includes(role);
  }

  canReview(role: UserRole): boolean {
    return role === UserRole.COMPLIANCE_OFFICER || role === UserRole.ADMIN;
  }

  canSubmitRole(role: UserRole): boolean {
    return [UserRole.DATA_SUBJECT, UserRole.COMPANY_REP].includes(role);
  }

  // ─── Validation ─────────────────────────────────────────────────────────────

  validateFile(file: File): FileValidationResult {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return { valid: false, error: 'Only PDF, JPG, and PNG files are accepted.' };
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { valid: false, error: 'File size must not exceed 5MB.' };
    }
    return { valid: true };
  }

  validateDocumentDate(date: Date): FileValidationResult {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - DATE_SENSITIVE_MONTHS);
    if (date < cutoff) {
      return {
        valid: false,
        error: `This document must be dated within the last ${DATE_SENSITIVE_MONTHS} months.`,
      };
    }
    return { valid: true };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  getTodoByCategory(category: DocumentCategory): DocumentItem[] {
    return this.getSnapshot().todoList.filter((i) => i.category === category);
  }

  getRemainingCount(): number {
    return this.getSnapshot().todoList.filter((i) => i.mandatory).length;
  }
}