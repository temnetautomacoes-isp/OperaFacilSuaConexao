import { supabase } from '../lib/supabase';
import { Product, UserAccount, CompanyDivision, EmployeeDocument, TimeClockRecord, FinancialEntry, Supplier } from '../types';

export interface GondolaCategoryItem {
  id: string;
  name: string;
  aisle?: string;
  icon?: string;
  color?: string;
  displayOrder?: number;
}

export const supabaseService = {
  // -------------------------------------------------------------
  // PRODUCTS
  // -------------------------------------------------------------
  async fetchProducts(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((d) => ({
      id: d.id,
      barcode: d.barcode || '',
      name: d.name,
      category: d.category || 'Geral',
      unit: d.unit || 'un',
      costPrice: Number(d.cost_price || 0),
      salePrice: Number(d.sale_price || 0),
      stock: Number(d.stock || 0),
      minStock: Number(d.min_stock || 0),
      imageUrl: d.image_url || '',
      supplierId: d.supplier_id,
      supplierName: d.supplier_name,
      expirationDate: d.expiration_date,
      batchNumber: d.batch_number,
      updatedAt: d.updated_at,
    }));
  },

  async saveProduct(product: Product): Promise<void> {
    await supabase.from('products').upsert({
      id: product.id,
      barcode: product.barcode,
      name: product.name,
      category: product.category,
      unit: product.unit,
      cost_price: product.costPrice,
      sale_price: product.salePrice,
      stock: product.stock,
      min_stock: product.minStock,
      image_url: product.imageUrl,
      supplier_id: product.supplierId,
      supplier_name: product.supplierName,
      expiration_date: product.expirationDate,
      batch_number: product.batchNumber,
      updated_at: new Date().toISOString(),
    });
  },

  async deleteProduct(id: string): Promise<void> {
    await supabase.from('products').delete().eq('id', id);
  },

  // -------------------------------------------------------------
  // USERS
  // -------------------------------------------------------------
  async fetchUsers(): Promise<UserAccount[]> {
    const { data, error } = await supabase.from('app_users').select('*');
    if (error || !data) return [];
    return data.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      password: u.password,
      role: u.role,
      operatorNumber: u.operator_number,
      avatar: u.avatar,
      avatarUrl: u.avatar_url,
      phone: u.phone,
      department: u.department,
      position: u.position,
      registrationCode: u.registration_code,
      admissionDate: u.admission_date,
      workSchedule: u.work_schedule,
      hierarchyLevel: u.hierarchy_level,
      cpf: u.cpf,
      rg: u.rg,
      email: u.email,
      address: u.address,
      cnh: u.cnh,
      pixKey: u.pix_key,
      bankInfo: u.bank_info,
      emergencyContact: u.emergency_contact,
      bloodType: u.blood_type,
      permissions: u.permissions,
    }));
  },

  async saveUser(user: UserAccount): Promise<void> {
    await supabase.from('app_users').upsert({
      id: user.id,
      name: user.name,
      username: user.username,
      password: user.password || '123',
      role: user.role,
      operator_number: user.operatorNumber,
      avatar: user.avatar,
      avatar_url: user.avatarUrl,
      phone: user.phone,
      department: user.department,
      position: user.position,
      registration_code: user.registrationCode,
      admission_date: user.admissionDate,
      work_schedule: user.workSchedule,
      hierarchy_level: user.hierarchyLevel,
      cpf: user.cpf,
      rg: user.rg,
      email: user.email,
      address: user.address,
      cnh: user.cnh,
      pix_key: user.pixKey,
      bank_info: user.bankInfo,
      emergency_contact: user.emergencyContact,
      blood_type: user.bloodType,
      permissions: user.permissions || {},
    });
  },

  async deleteUser(id: string): Promise<void> {
    await supabase.from('app_users').delete().eq('id', id);
  },

  // -------------------------------------------------------------
  // DIVISIONS (FLOW N8N)
  // -------------------------------------------------------------
  async fetchDivisions(): Promise<CompanyDivision[]> {
    const { data, error } = await supabase.from('company_divisions').select('*');
    if (error || !data) return [];
    return data.map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      leaderId: d.leader_id,
      color: d.color,
      createdAt: d.created_at,
    }));
  },

  async saveDivision(division: CompanyDivision): Promise<void> {
    await supabase.from('company_divisions').upsert({
      id: division.id,
      name: division.name,
      description: division.description,
      leader_id: division.leaderId,
      color: division.color,
    });
  },

  async deleteDivision(id: string): Promise<void> {
    await supabase.from('company_divisions').delete().eq('id', id);
  },

  // -------------------------------------------------------------
  // EMPLOYEE DOCUMENTS
  // -------------------------------------------------------------
  async fetchDocuments(): Promise<EmployeeDocument[]> {
    const { data, error } = await supabase.from('employee_documents').select('*');
    if (error || !data) return [];
    return data.map((doc) => ({
      id: doc.id,
      userId: doc.user_id,
      name: doc.name,
      category: doc.category,
      fileName: doc.file_name,
      fileSize: doc.file_size,
      fileUrl: doc.file_url,
      uploadDate: doc.upload_date,
      notes: doc.notes,
    }));
  },

  async saveDocument(doc: EmployeeDocument): Promise<void> {
    await supabase.from('employee_documents').upsert({
      id: doc.id,
      user_id: doc.userId,
      name: doc.name,
      category: doc.category,
      file_name: doc.fileName,
      file_size: doc.fileSize,
      file_url: doc.fileUrl,
      upload_date: doc.uploadDate,
      notes: doc.notes,
    });
  },

  async deleteDocument(id: string): Promise<void> {
    await supabase.from('employee_documents').delete().eq('id', id);
  },

  // -------------------------------------------------------------
  // TIME CLOCK RECORDS
  // -------------------------------------------------------------
  async fetchTimeRecords(): Promise<TimeClockRecord[]> {
    const { data, error } = await supabase.from('time_clock_records').select('*').order('date', { ascending: false });
    if (error || !data) return [];
    return data.map((r) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name,
      date: r.date,
      entry1: r.entry1,
      exit1: r.exit1,
      entry2: r.entry2,
      exit2: r.exit2,
      totalHours: Number(r.total_hours || 0),
      extraHours: Number(r.extra_hours || 0),
      status: r.status,
      notes: r.notes,
      location: r.location,
    }));
  },

  async saveTimeRecord(rec: TimeClockRecord): Promise<void> {
    await supabase.from('time_clock_records').upsert({
      id: rec.id,
      user_id: rec.userId,
      user_name: rec.userName,
      date: rec.date,
      entry1: rec.entry1,
      exit1: rec.exit1,
      entry2: rec.entry2,
      exit2: rec.exit2,
      total_hours: rec.totalHours,
      extra_hours: rec.extraHours,
      status: rec.status,
      notes: rec.notes,
      location: rec.location,
    });
  },

  // -------------------------------------------------------------
  // FINANCIAL ENTRIES
  // -------------------------------------------------------------
  async fetchFinancialEntries(): Promise<FinancialEntry[]> {
    const { data, error } = await supabase.from('financial_entries').select('*').order('date', { ascending: false });
    if (error || !data) return [];
    return data.map((e) => ({
      id: e.id,
      type: e.type,
      category: e.category,
      description: e.description,
      amount: Number(e.amount || 0),
      date: e.date,
      dueDate: e.due_date,
      status: e.status,
      paymentMethod: e.payment_method,
      supplierId: e.supplier_id,
      invoiceNumber: e.invoice_number,
      notes: e.notes,
    }));
  },

  async saveFinancialEntry(entry: FinancialEntry): Promise<void> {
    await supabase.from('financial_entries').upsert({
      id: entry.id,
      type: entry.type,
      category: entry.category,
      description: entry.description,
      amount: entry.amount,
      date: entry.date,
      due_date: entry.dueDate,
      status: entry.status,
      payment_method: entry.paymentMethod,
      supplier_id: entry.supplierId,
      invoice_number: entry.invoiceNumber,
      notes: entry.notes,
    });
  },

  async deleteFinancialEntry(id: string): Promise<void> {
    await supabase.from('financial_entries').delete().eq('id', id);
  },

  // -------------------------------------------------------------
  // SUPPLIERS
  // -------------------------------------------------------------
  async fetchSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabase.from('suppliers').select('*');
    if (error || !data) return [];
    return data.map((s) => ({
      id: s.id,
      name: s.name,
      tradeName: s.trade_name,
      cnpj: s.cnpj,
      category: s.category,
      phone: s.phone,
      email: s.email,
      contactPerson: s.contact_person,
      pixKey: s.pix_key,
      paymentTerms: s.payment_terms,
      address: s.address,
      notes: s.notes,
      createdAt: s.created_at,
    }));
  },

  async saveSupplier(supplier: Supplier): Promise<void> {
    await supabase.from('suppliers').upsert({
      id: supplier.id,
      name: supplier.name,
      trade_name: supplier.tradeName,
      cnpj: supplier.cnpj,
      category: supplier.category,
      phone: supplier.phone,
      email: supplier.email,
      contact_person: supplier.contactPerson,
      pix_key: supplier.pixKey,
      payment_terms: supplier.paymentTerms,
      address: supplier.address,
      notes: supplier.notes,
    });
  },

  async deleteSupplier(id: string): Promise<void> {
    await supabase.from('suppliers').delete().eq('id', id);
  },
};
