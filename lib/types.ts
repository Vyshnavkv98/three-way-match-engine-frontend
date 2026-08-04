// ── Enums ──────────────────────────────────────────────────────────────────

export type DocumentType = 'po' | 'grn' | 'invoice';
export type MatchStatus =
  | 'matched'
  | 'partially_matched'
  | 'mismatch'
  | 'insufficient_documents';

export type ReasonCode =
  | 'grn_qty_exceeds_po_qty'
  | 'invoice_qty_exceeds_grn_qty'
  | 'invoice_qty_exceeds_po_qty'
  | 'invoice_date_after_po_date'
  | 'duplicate_po'
  | 'duplicate_document'
  | 'item_missing_in_po'
  | 'price_mismatch'
  | 'mrp_mismatch'
  | 'unmapped_master_sku';

// ── Auth ───────────────────────────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: number;
}

// ── SKU Master ─────────────────────────────────────────────────────────────

export interface SkuMaster {
  id: string;
  skuErpCode: string;
  name: string;
  /** Vendor's own item code that appears on their PO / GRN / Invoice */
  vendorSkuCode?: string;
  brand?: string;
  eanCode?: string;
  hsnCode?: string;
  uom?: string;
  agreedRate?: number;
  mrp?: number;
  priceTolerance?: number;
  isActive: boolean;
}

export interface CreateSkuMasterPayload {
  skuErpCode: string;
  name: string;
  vendorSkuCode?: string;
  brand?: string;
  eanCode?: string;
  hsnCode?: string;
  uom?: string;
  agreedRate?: number;
  mrp?: number;
  priceTolerance?: number;
  isActive?: boolean;
}

// ── Documents ─────────────────────────────────────────────────────────────

export interface DocumentListItem {
  id: string;
  originalName: string;
  documentType: DocumentType;
  mimeType: string;
  sizeBytes: number;
  status: 'uploaded' | 'parsing' | 'parsed' | 'failed';
  uploadedAt: string;
  poNumber?: string;
  documentNumber?: string;
  vendorName?: string;
  documentDate?: string;
  itemCount?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedDocuments {
  data: DocumentListItem[];
  pagination: Pagination;
}

export interface DocumentItem {
  lineNumber: number;
  itemCode: string;
  description: string;
  quantity?: number;
  receivedQuantity?: number;
  unitPrice?: number;
  mrp?: number;
  resolvedSkuId?: string;
  resolvedSkuCode?: string;
  sourceItemCode?: string;
}

export interface DocumentDetail extends Omit<DocumentListItem, 'sizeBytes'> {
  items: DocumentItem[];
  rawParsed?: string;
  poNumber?: string;
  grnNumber?: string;
  invoiceNumber?: string;
  vendorName?: string;
  documentDate?: string;
  itemCount?: number;
  // Returned directly from the enriched endpoint
  storedName?: string;
  sizeBytes?: number;
}

// ── Match ──────────────────────────────────────────────────────────────────

export interface SkuInfo {
  id: string;
  skuErpCode: string;
  name: string;
  vendorSkuCode?: string;
  brand?: string;
  eanCode?: string;
  hsnCode?: string;
  uom?: string;
  agreedRate?: number;
  mrp?: number;
  priceTolerance?: number;
}

export interface ItemMatchResult {
  matchKey: string;
  skuInfo?: SkuInfo;
  isMapped: boolean;
  poQty?: number;
  grnQty: number;
  invoiceQty: number;
  agreedRate?: number;
  invoiceUnitRate?: number;
  masterMrp?: number;
  documentMrp?: number;
  reasonCodes: ReasonCode[];
}

export interface Violation {
  code: ReasonCode;
  message: string;
  matchKey?: string;
}

export interface LinkedDocument {
  documentId: string;
  documentType: DocumentType;
  documentNumber: string;
  documentDate: string;
}

export interface MatchResult {
  poNumber: string;
  status: MatchStatus;
  violations: Violation[];
  itemResults: ItemMatchResult[];
  linkedDocuments: LinkedDocument[];
  computedAt: string;
}

// ── Summary ────────────────────────────────────────────────────────────────

export interface AssociatedDocumentRow {
  documentId: string;
  documentType: 'grn' | 'invoice';
  documentNumber: string;
  documentDate: string;
  totalQty: number;
  grossAmount: number;
  cumulativeInvoicedQty?: number;
  cumulativeReceivedQty?: number;
}

export interface SummaryStatusRow {
  totalInvoicedQty: number;
  totalReceivedQty: number;
  pendingQty: number;
  status: MatchStatus;
}

export interface SummaryResult {
  poNumber: string;
  poAmount: number;
  totalInvoiced: number;
  totalReceived: number;
  pendingQty: number;
  currentStatus: MatchStatus;
  associatedDocuments: AssociatedDocumentRow[];
  statusRow: SummaryStatusRow;
  computedAt: string;
}

// ── Upload ─────────────────────────────────────────────────────────────────

export interface UploadResponse {
  documentId: string;
  documentType: DocumentType;
  poNumber: string;
  status: string;
  warnings: string[];
}
