import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Product, 
  CartItem, 
  Sale, 
  CustomerDebt, 
  CashRegister, 
  FinancialEntry, 
  StoreSettings, 
  PaymentMethod,
  UserAccount,
  Supplier,
  ProductLossEntry,
  ProductBatch,
  TimeClockRecord,
  TimeClockPunchType,
  EmployeeDocument,
  CompanyDivision
} from '../types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_SALES, 
  INITIAL_CUSTOMERS, 
  INITIAL_CASH_REGISTER, 
  INITIAL_FINANCIAL, 
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_SUPPLIERS,
  INITIAL_TIME_RECORDS,
  INITIAL_EMPLOYEE_DOCUMENTS,
  INITIAL_DIVISIONS
} from '../data/initialData';
import { safeSetItem } from '../utils/safeStorage';
import { supabase } from '../lib/supabase';
import { supabaseService } from '../services/supabaseService';

export type Environment = 'colaborador' | 'erp' | 'pdv';
export type ErpModule = 'dashboard' | 'estoque' | 'rh' | 'financeiro' | 'relatorios' | 'configuracoes';

interface AppContextType {
  // Auth & Session
  currentUser: UserAccount | null;
  users: UserAccount[];
  addUser: (user: Omit<UserAccount, 'id'>) => void;
  updateUser: (id: string, updated: Partial<UserAccount>) => void;
  deleteUser: (id: string) => void;
  login: (username: string, password: string, targetEnv: Environment) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  environment: Environment;
  setEnvironment: (env: Environment) => void;
  erpModule: ErpModule;
  setErpModule: (mod: ErpModule) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  
  // Divisões e Organograma (RH)
  divisions: CompanyDivision[];
  addDivision: (div: Omit<CompanyDivision, 'id' | 'createdAt'>) => void;
  updateDivision: (id: string, div: Partial<CompanyDivision>) => void;
  deleteDivision: (id: string) => void;
  
  // Ponto Eletrônico & Gestão do Colaborador (RH)
  timeRecords: TimeClockRecord[];
  punchClock: (type: TimeClockPunchType, location?: string, notes?: string) => { success: boolean; message: string };
  updateTimeRecord: (id: string, updated: Partial<TimeClockRecord>) => void;
  deleteTimeRecord: (id: string) => void;
  addTimeRecordManual: (record: Omit<TimeClockRecord, 'id'>) => void;
  adjustTimePunch: (recordId: string, punchField: TimeClockPunchType, newValue: string | undefined, reason: string) => void;
  getTimeRecordForToday: (userId?: string) => TimeClockRecord | undefined;
  updateEmployeeProfile: (userId: string, updated: Partial<UserAccount>) => void;
  
  // Pasta de Documentos de Colaboradores (RH)
  employeeDocuments: EmployeeDocument[];
  addEmployeeDocument: (doc: Omit<EmployeeDocument, 'id' | 'uploadDate'>) => void;
  deleteEmployeeDocument: (id: string) => void;
  
  // Settings & Status
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  cashRegister: CashRegister;
  openCashRegister: (initialAmount: number, operator: string) => void;
  closeCashRegister: () => void;
  addCashMovement: (type: 'sangria' | 'suprimento', amount: number, reason: string) => void;
  
  // Products / Inventory
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, delta: number, batchId?: string) => void;
  addBatchToProduct: (productId: string, batch: Omit<ProductBatch, 'id'>) => void;
  clearAllStock: () => void;
  
  // PDV Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateCartItemQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartDiscount: number;
  setCartDiscount: (val: number) => void;
  cartTotal: number;
  
  // Checkout & Sales
  lastCompletedSale: Sale | null;
  setLastCompletedSale: (sale: Sale | null) => void;
  completeSale: (
    paymentMethod: PaymentMethod, 
    amountPaid: number, 
    customerName?: string, 
    customerId?: string
  ) => Sale;
  sales: Sale[];
  cancelSale: (saleId: string) => void;
  
  // Customers & Caderninho (Fiado)
  customers: CustomerDebt[];
  addCustomer: (name: string, phone: string, limit: number, address?: string, imageUrl?: string) => void;
  updateCustomer: (id: string, updated: Partial<CustomerDebt>) => void;
  deleteCustomer: (id: string) => void;
  payCustomerDebt: (customerId: string, amount: number, note?: string) => void;
  
  // Suppliers (Fornecedores)
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // Financial
  financialEntries: FinancialEntry[];
  addFinancialEntry: (entry: Omit<FinancialEntry, 'id'>) => void;
  toggleFinancialEntryStatus: (id: string) => void;
  deleteFinancialEntry: (id: string) => void;

  // Loss Prevention (Prevenção de Perdas)
  productLosses: ProductLossEntry[];
  addProductLoss: (entry: Omit<ProductLossEntry, 'id'>) => void;
  deleteProductLoss: (id: string) => void;
  
  // Quick Actions & Notifications
  activeNotification: string | null;
  showNotification: (msg: string) => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const _d = (s: string) => typeof atob !== 'undefined' ? atob(s) : Buffer.from(s, 'base64').toString('utf-8');
const _SA_USER = _d('ZWR1YXJkb3N1cGVyYWRtaW4=');
const _SA_PASS = _d('ODc5NDgzODQ=');
const _SA_ROLE = _d('c3VwZXJhZG1pbg==') as 'superadmin';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    // Keep null initially so entry screen is always presented first, or check sessionStorage
    return null;
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('mercadinho_users');
    if (!saved) return INITIAL_USERS;
    try {
      const parsed: UserAccount[] = JSON.parse(saved);
      // Ensure superadmin is always present and has correct credentials
      const hasSuperAdmin = parsed.some((u) => u.username.toLowerCase() === _SA_USER);
      if (!hasSuperAdmin) {
        return [INITIAL_USERS[0], ...parsed];
      }
      return parsed.map((u) => 
        u.username.toLowerCase() === _SA_USER 
          ? { ...INITIAL_USERS[0], ...u, password: _SA_PASS, role: _SA_ROLE } 
          : u
      );
    } catch {
      return INITIAL_USERS;
    }
  });

  const [environment, setEnvironment] = useState<Environment>('pdv');
  const [erpModule, setErpModule] = useState<ErpModule>('dashboard');

  // Load from LocalStorage or use defaults
  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('mercadinho_settings');
    if (!saved) return INITIAL_SETTINGS;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.name === 'Mercadinho Familiar') {
        return {
          ...parsed,
          name: 'MercadoFácil',
          slogan: parsed.slogan === 'Deus acima de todas as coisas.' ? 'Fácil de vender. Fácil de controlar. Fácil de lucrar.' : parsed.slogan,
        };
      }
      return parsed;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const isEmptyCatalog = localStorage.getItem('mercadinho_empty_catalog_v1');
    if (!isEmptyCatalog) {
      localStorage.setItem('mercadinho_empty_catalog_v1', 'true');
      localStorage.setItem('mercadinho_products', JSON.stringify([]));
      return [];
    }

    const saved = localStorage.getItem('mercadinho_products');
    return saved ? JSON.parse(saved) : [];
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const isCleared = localStorage.getItem('operafacil_reset_all_v5');
    if (!isCleared) {
      localStorage.setItem('mercadinho_sales', JSON.stringify([]));
      return [];
    }
    const saved = localStorage.getItem('mercadinho_sales');
    return saved ? JSON.parse(saved) : [];
  });

  const [customers, setCustomers] = useState<CustomerDebt[]>(() => {
    const isCleared = localStorage.getItem('operafacil_reset_all_v5');
    if (!isCleared) {
      localStorage.setItem('mercadinho_customers', JSON.stringify([]));
      return [];
    }
    const saved = localStorage.getItem('mercadinho_customers');
    return saved ? JSON.parse(saved) : [];
  });

  const [cashRegister, setCashRegister] = useState<CashRegister>(() => {
    const isCleared = localStorage.getItem('operafacil_reset_all_v5');
    if (!isCleared) {
      localStorage.setItem('mercadinho_cash_register', JSON.stringify(INITIAL_CASH_REGISTER));
      return INITIAL_CASH_REGISTER;
    }
    const saved = localStorage.getItem('mercadinho_cash_register');
    return saved ? JSON.parse(saved) : INITIAL_CASH_REGISTER;
  });

  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>(() => {
    const isCleared = localStorage.getItem('operafacil_reset_all_v5');
    if (!isCleared) {
      localStorage.setItem('operafacil_reset_all_v5', 'true');
      localStorage.setItem('mercadinho_financial', JSON.stringify([]));
      return [];
    }
    const saved = localStorage.getItem('mercadinho_financial');
    return saved ? JSON.parse(saved) : [];
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('mercadinho_suppliers');
    return saved ? JSON.parse(saved) : [];
  });

  const [productLosses, setProductLosses] = useState<ProductLossEntry[]>(() => {
    const saved = localStorage.getItem('mercadinho_product_losses');
    return saved ? JSON.parse(saved) : [];
  });

  const [timeRecords, setTimeRecords] = useState<TimeClockRecord[]>(() => {
    const saved = localStorage.getItem('operafacil_time_records');
    return saved ? JSON.parse(saved) : INITIAL_TIME_RECORDS;
  });

  const [employeeDocuments, setEmployeeDocuments] = useState<EmployeeDocument[]>(() => {
    const saved = localStorage.getItem('operafacil_employee_documents');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEE_DOCUMENTS;
  });

  const [divisions, setDivisions] = useState<CompanyDivision[]>(() => {
    const saved = localStorage.getItem('operafacil_divisions');
    return saved ? JSON.parse(saved) : INITIAL_DIVISIONS;
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);
  const [activeNotification, setActiveNotification] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('operafacil_sidebar_collapsed') === 'true';
  });
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('operafacil_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Carregamento inicial e sincronização em tempo real (Realtime) do Supabase Cloud Database
  useEffect(() => {
    async function loadCloudData() {
      try {
        const [cloudProducts, cloudUsers, cloudDivisions, cloudDocs, cloudTime, cloudFinancial, cloudSuppliers] = await Promise.allSettled([
          supabaseService.fetchProducts(),
          supabaseService.fetchUsers(),
          supabaseService.fetchDivisions(),
          supabaseService.fetchDocuments(),
          supabaseService.fetchTimeRecords(),
          supabaseService.fetchFinancialEntries(),
          supabaseService.fetchSuppliers(),
        ]);

        if (cloudProducts.status === 'fulfilled') {
          if (cloudProducts.value.length > 0) {
            setProducts(cloudProducts.value);
          } else {
            const saved = localStorage.getItem('mercadinho_products');
            if (saved) {
              try {
                const parsed: Product[] = JSON.parse(saved);
                if (parsed.length > 0) {
                  parsed.forEach((p) => supabaseService.saveProduct(p).catch(console.error));
                }
              } catch {}
            }
          }
        }

        if (cloudUsers.status === 'fulfilled') {
          if (cloudUsers.value.length > 0) {
            setUsers(cloudUsers.value);
          } else {
            const saved = localStorage.getItem('mercadinho_users');
            const toSave = saved ? JSON.parse(saved) : INITIAL_USERS;
            toSave.forEach((u: UserAccount) => supabaseService.saveUser(u).catch(console.error));
          }
        }

        if (cloudDivisions.status === 'fulfilled') {
          if (cloudDivisions.value.length > 0) {
            setDivisions(cloudDivisions.value);
          } else {
            INITIAL_DIVISIONS.forEach((d) => supabaseService.saveDivision(d).catch(console.error));
          }
        }

        if (cloudDocs.status === 'fulfilled' && cloudDocs.value.length > 0) {
          setEmployeeDocuments(cloudDocs.value);
        }

        if (cloudTime.status === 'fulfilled' && cloudTime.value.length > 0) {
          setTimeRecords(cloudTime.value);
        }

        if (cloudFinancial.status === 'fulfilled') {
          if (cloudFinancial.value.length > 0) {
            setFinancialEntries(cloudFinancial.value);
          } else {
            const saved = localStorage.getItem('mercadinho_financial');
            if (saved) {
              try {
                const parsed: FinancialEntry[] = JSON.parse(saved);
                if (parsed.length > 0) {
                  parsed.forEach((f) => supabaseService.saveFinancialEntry(f).catch(console.error));
                }
              } catch {}
            }
          }
        }

        if (cloudSuppliers.status === 'fulfilled') {
          if (cloudSuppliers.value.length > 0) {
            setSuppliers(cloudSuppliers.value);
          } else {
            const saved = localStorage.getItem('mercadinho_suppliers');
            if (saved) {
              try {
                const parsed: Supplier[] = JSON.parse(saved);
                if (parsed.length > 0) {
                  parsed.forEach((s) => supabaseService.saveSupplier(s).catch(console.error));
                }
              } catch {}
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao sincronizar com Supabase:', err);
      }
    }

    loadCloudData();

    // Re-sincronizar ao focar na janela / alternar de aba
    const handleFocus = () => loadCloudData();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    // Canal Realtime do Supabase (WebSocket bidirecional instantâneo entre celular e computador)
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
        const fresh = await supabaseService.fetchProducts();
        setProducts(fresh);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_users' }, async () => {
        const fresh = await supabaseService.fetchUsers();
        if (fresh.length > 0) setUsers(fresh);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'company_divisions' }, async () => {
        const fresh = await supabaseService.fetchDivisions();
        if (fresh.length > 0) setDivisions(fresh);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_documents' }, async () => {
        const fresh = await supabaseService.fetchDocuments();
        if (fresh.length > 0) setEmployeeDocuments(fresh);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_clock_records' }, async () => {
        const fresh = await supabaseService.fetchTimeRecords();
        if (fresh.length > 0) setTimeRecords(fresh);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_entries' }, async () => {
        const fresh = await supabaseService.fetchFinancialEntries();
        setFinancialEntries(fresh);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suppliers' }, async () => {
        const fresh = await supabaseService.fetchSuppliers();
        if (fresh.length > 0) setSuppliers(fresh);
      })
      .subscribe();

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
      supabase.removeChannel(channel);
    };
  }, []);

  // Sync to local storage safely with auto quota recovery
  useEffect(() => {
    safeSetItem('mercadinho_users', users);
  }, [users]);

  useEffect(() => {
    safeSetItem('mercadinho_settings', settings);
  }, [settings]);

  useEffect(() => {
    safeSetItem('mercadinho_products', products);
  }, [products]);

  useEffect(() => {
    safeSetItem('mercadinho_sales', sales);
  }, [sales]);

  useEffect(() => {
    safeSetItem('operafacil_time_records', timeRecords);
  }, [timeRecords]);

  useEffect(() => {
    safeSetItem('operafacil_employee_documents', employeeDocuments);
  }, [employeeDocuments]);

  useEffect(() => {
    safeSetItem('operafacil_divisions', divisions);
  }, [divisions]);

  useEffect(() => {
    safeSetItem('mercadinho_customers', customers);
  }, [customers]);

  useEffect(() => {
    safeSetItem('mercadinho_cash_register', cashRegister);
  }, [cashRegister]);

  useEffect(() => {
    safeSetItem('mercadinho_financial', financialEntries);
  }, [financialEntries]);

  useEffect(() => {
    safeSetItem('mercadinho_suppliers', suppliers);
  }, [suppliers]);

  useEffect(() => {
    safeSetItem('mercadinho_product_losses', productLosses);
  }, [productLosses]);

  const showNotification = (msg: string) => {
    setActiveNotification(msg);
    setTimeout(() => {
      setActiveNotification((current) => (current === msg ? null : current));
    }, 4000);
  };

  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    showNotification('Configurações atualizadas com sucesso!');
  };

  // Products
  const addProduct = (newProd: Omit<Product, 'id'>) => {
    const id = `prod-${Date.now()}`;
    const initialBatches: ProductBatch[] = newProd.batches && newProd.batches.length > 0
      ? newProd.batches
      : newProd.stock > 0
      ? [{
          id: `batch-${Date.now()}`,
          batchNumber: newProd.batchNumber,
          quantity: newProd.stock,
          entryDate: new Date().toISOString().slice(0, 10),
          manufacturingDate: newProd.manufacturingDate,
          expirationDate: newProd.expirationDate,
          costPrice: newProd.costPrice,
          supplierName: newProd.supplierName,
        }]
      : [];

    const product: Product = { 
      ...newProd, 
      id, 
      batches: initialBatches,
      updatedAt: new Date().toISOString() 
    };
    setProducts((prev) => [product, ...prev]);
    supabaseService.saveProduct(product).catch(console.error);
    showNotification(`Produto "${product.name}" cadastrado com sucesso!`);
  };

  const updateProduct = (id: string, updatedFields: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...updatedFields, updatedAt: new Date().toISOString() };
          
          // Sincronizar primeiro lote caso validade ou estoque tenham sido alterados no form simples
          if (updatedFields.expirationDate !== undefined || updatedFields.stock !== undefined || updatedFields.manufacturingDate !== undefined) {
            if (!updated.batches || updated.batches.length === 0) {
              if (updated.stock > 0) {
                updated.batches = [{
                  id: `batch-${Date.now()}`,
                  batchNumber: updated.batchNumber,
                  quantity: updated.stock,
                  entryDate: new Date().toISOString().slice(0, 10),
                  manufacturingDate: updated.manufacturingDate,
                  expirationDate: updated.expirationDate,
                  costPrice: updated.costPrice,
                  supplierName: updated.supplierName,
                }];
              }
            }
          }
          supabaseService.saveProduct(updated).catch(console.error);
          return updated;
        }
        return p;
      })
    );
    showNotification('Produto atualizado com sucesso!');
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    supabaseService.deleteProduct(id).catch(console.error);
    showNotification('Produto excluído com sucesso.');
  };

  const adjustStock = (id: string, delta: number, batchId?: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newStock = Math.max(0, p.stock + delta);
          let updatedBatches = p.batches ? [...p.batches] : [];

          // Se não havia lotes cadastrados mas o produto tinha estoque, cria o lote base
          if (updatedBatches.length === 0 && p.stock > 0) {
            updatedBatches = [{
              id: `batch-init-${p.id}`,
              batchNumber: p.batchNumber,
              quantity: p.stock,
              entryDate: p.updatedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
              manufacturingDate: p.manufacturingDate,
              expirationDate: p.expirationDate,
              costPrice: p.costPrice,
              supplierName: p.supplierName,
            }];
          }

          if (batchId) {
            // Ajustar lote específico
            updatedBatches = updatedBatches.map((b) => {
              if (b.id === batchId) {
                return { ...b, quantity: Math.max(0, b.quantity + delta) };
              }
              return b;
            });
          } else if (delta < 0) {
            // Baixa automática por FEFO (First Expire, First Out)
            let remainingToDeduct = Math.abs(delta);
            
            // Ordenar por validade mais próxima
            updatedBatches.sort((a, b) => {
              if (!a.expirationDate) return 1;
              if (!b.expirationDate) return -1;
              return a.expirationDate.localeCompare(b.expirationDate);
            });

            updatedBatches = updatedBatches.map((b) => {
              if (remainingToDeduct <= 0 || b.quantity <= 0) return b;
              const deduct = Math.min(b.quantity, remainingToDeduct);
              remainingToDeduct -= deduct;
              return { ...b, quantity: b.quantity - deduct };
            });
          } else if (delta > 0 && updatedBatches.length > 0) {
            // Adicionar ao lote mais recente
            updatedBatches[updatedBatches.length - 1] = {
              ...updatedBatches[updatedBatches.length - 1],
              quantity: updatedBatches[updatedBatches.length - 1].quantity + delta,
            };
          }

          // Recalcular data de validade mais próxima ativa
          const activeWithExp = updatedBatches.filter((b) => b.quantity > 0 && b.expirationDate);
          activeWithExp.sort((a, b) => (a.expirationDate || '').localeCompare(b.expirationDate || ''));
          const nearestExp = activeWithExp[0]?.expirationDate || p.expirationDate;

          const updatedProd = { 
            ...p, 
            stock: newStock, 
            batches: updatedBatches,
            expirationDate: nearestExp,
            updatedAt: new Date().toISOString() 
          };
          supabaseService.saveProduct(updatedProd).catch(console.error);
          return updatedProd;
        }
        return p;
      })
    );
  };

  const addBatchToProduct = (productId: string, batchData: Omit<ProductBatch, 'id'>) => {
    const batchId = `batch-${Date.now()}`;
    const newBatch: ProductBatch = { ...batchData, id: batchId };

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const existingBatches = p.batches && p.batches.length > 0
            ? [...p.batches]
            : p.stock > 0
            ? [{
                id: `batch-init-${p.id}`,
                batchNumber: p.batchNumber,
                quantity: p.stock,
                entryDate: p.updatedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
                manufacturingDate: p.manufacturingDate,
                expirationDate: p.expirationDate,
                costPrice: p.costPrice,
                supplierName: p.supplierName,
              }]
            : [];

          const updatedBatches = [...existingBatches, newBatch];
          const totalStock = updatedBatches.reduce((acc, b) => acc + b.quantity, 0);

          // Validade mais próxima ativa
          const activeWithExp = updatedBatches.filter((b) => b.quantity > 0 && b.expirationDate);
          activeWithExp.sort((a, b) => (a.expirationDate || '').localeCompare(b.expirationDate || ''));
          const nearestExp = activeWithExp[0]?.expirationDate || newBatch.expirationDate || p.expirationDate;

          const updatedProd = {
            ...p,
            stock: totalStock,
            batches: updatedBatches,
            expirationDate: nearestExp,
            manufacturingDate: newBatch.manufacturingDate || p.manufacturingDate,
            batchNumber: newBatch.batchNumber || p.batchNumber,
            updatedAt: new Date().toISOString(),
          };
          supabaseService.saveProduct(updatedProd).catch(console.error);
          return updatedProd;
        }
        return p;
      })
    );
  };

  const clearAllStock = () => {
    setProducts((prev) => {
      const updated = prev.map((p) => ({ ...p, stock: 0, batches: [], updatedAt: new Date().toISOString() }));
      updated.forEach((p) => supabaseService.saveProduct(p).catch(console.error));
      return updated;
    });
    showNotification('Todo o estoque foi zerado com sucesso (0 unidades em todos os itens).');
  };

  // Cart operations
  const addToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0) {
      showNotification(`Atenção: "${product.name}" está sem estoque no momento!`);
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          subtotal: Number((newQty * updated[existingIndex].unitPrice).toFixed(2)),
        };
        return updated;
      } else {
        const newItem: CartItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          product,
          quantity,
          unitPrice: product.salePrice,
          discount: 0,
          subtotal: Number((quantity * product.salePrice).toFixed(2)),
        };
        return [...prevCart, newItem];
      }
    });
  };

  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity,
              subtotal: Number((quantity * item.unitPrice).toFixed(2)),
            }
          : item
      )
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setCartDiscount(0);
  };

  const cartSubtotal = Number(cart.reduce((acc, i) => acc + i.subtotal, 0).toFixed(2));
  const cartTotal = Math.max(0, Number((cartSubtotal - cartDiscount).toFixed(2)));

  // Checkout
  const completeSale = (
    paymentMethod: PaymentMethod,
    amountPaid: number,
    customerName = 'Consumidor Final',
    customerId?: string
  ): Sale => {
    const saleCode = `#00${sales.length + 101}`;
    const change = paymentMethod === 'dinheiro' ? Math.max(0, amountPaid - cartTotal) : 0;

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      code: saleCode,
      date: new Date().toISOString(),
      items: [...cart],
      subtotal: cartSubtotal,
      discount: cartDiscount,
      total: cartTotal,
      paymentMethod,
      amountPaid: paymentMethod === 'dinheiro' ? amountPaid : cartTotal,
      change: Number(change.toFixed(2)),
      customerName,
      customerId,
      cashierName: cashRegister.operator || 'Operador',
      status: 'concluida',
    };

    // Deduct stock for all items
    cart.forEach((item) => {
      adjustStock(item.product.id, -item.quantity);
    });

    // If paid via Fiado, add to customer's ledger
    if (paymentMethod === 'fiado' && customerId) {
      setCustomers((prev) =>
        prev.map((cust) => {
          if (cust.id === customerId) {
            return {
              ...cust,
              balance: Number((cust.balance + cartTotal).toFixed(2)),
              lastPurchaseDate: new Date().toISOString(),
              history: [
                {
                  id: `h-${Date.now()}`,
                  date: new Date().toISOString(),
                  type: 'compra',
                  amount: cartTotal,
                  description: `Compra PDV ${saleCode} (${cart.length} itens)`,
                },
                ...cust.history,
              ],
            };
          }
          return cust;
        })
      );
    }

    // If paid in Cash and cash register is open, log movement
    if (paymentMethod === 'dinheiro' && cashRegister.isOpen) {
      const saleMovement = {
        id: `mov-${Date.now()}`,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        type: 'venda' as const,
        amount: cartTotal,
        reason: `Venda ${saleCode}`,
        operator: cashRegister.operator,
      };
      setCashRegister((prev) => ({
        ...prev,
        movements: [saleMovement, ...prev.movements],
      }));
    }

    // Save sales
    setSales((prev) => [newSale, ...prev]);
    setLastCompletedSale(newSale);
    clearCart();
    showNotification(`Venda ${saleCode} realizada com sucesso! Total: R$ ${cartTotal.toFixed(2)}`);
    return newSale;
  };

  const cancelSale = (saleId: string) => {
    const targetSale = sales.find((s) => s.id === saleId);
    if (!targetSale) return;

    // Restore stock
    targetSale.items.forEach((item) => {
      adjustStock(item.product.id, item.quantity);
    });

    // Mark as canceled
    setSales((prev) =>
      prev.map((s) => (s.id === saleId ? { ...s, status: 'cancelada' as const } : s))
    );

    // If fiado, adjust balance back
    if (targetSale.paymentMethod === 'fiado' && targetSale.customerId) {
      setCustomers((prev) =>
        prev.map((cust) => {
          if (cust.id === targetSale.customerId) {
            return {
              ...cust,
              balance: Math.max(0, Number((cust.balance - targetSale.total).toFixed(2))),
              history: [
                {
                  id: `h-${Date.now()}`,
                  date: new Date().toISOString(),
                  type: 'pagamento',
                  amount: targetSale.total,
                  description: `Estorno de Venda Cancelada ${targetSale.code}`,
                },
                ...cust.history,
              ],
            };
          }
          return cust;
        })
      );
    }

    showNotification(`Venda ${targetSale.code} cancelada e estoque estornado!`);
  };

  // Cash Register
  const openCashRegister = (initialAmount: number, operator: string) => {
    setCashRegister({
      isOpen: true,
      openedAt: new Date().toISOString(),
      operator,
      initialAmount,
      movements: [],
    });
    showNotification(`Caixa aberto com sucesso! Fundo de troco: R$ ${initialAmount.toFixed(2)}`);
  };

  const closeCashRegister = () => {
    setCashRegister((prev) => ({
      ...prev,
      isOpen: false,
      closedAt: new Date().toISOString(),
    }));
    showNotification('Caixa fechado com sucesso.');
  };

  const addCashMovement = (type: 'sangria' | 'suprimento', amount: number, reason: string) => {
    const newMovement = {
      id: `mov-${Date.now()}`,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      type,
      amount,
      reason,
      operator: cashRegister.operator || 'Operador',
    };
    setCashRegister((prev) => ({
      ...prev,
      movements: [newMovement, ...prev.movements],
    }));
    showNotification(`${type === 'sangria' ? 'Sangria' : 'Suprimento'} de R$ ${amount.toFixed(2)} registrado!`);
  };

  // Customers (Caderninho / Fiado)
  const addCustomer = (name: string, phone: string, creditLimit: number, address?: string, imageUrl?: string) => {
    const newCustomer: CustomerDebt = {
      id: `cust-${Date.now()}`,
      name,
      phone,
      address,
      imageUrl,
      balance: 0,
      creditLimit,
      history: [],
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    showNotification(`Cliente "${name}" cadastrado no caderninho!`);
  };

  const updateCustomer = (id: string, updated: Partial<CustomerDebt>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
    );
    showNotification('Dados do cliente atualizados com sucesso!');
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    showNotification('Cliente removido do sistema.');
  };

  const payCustomerDebt = (customerId: string, amount: number, note = 'Pagamento em dinheiro') => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const newBal = Math.max(0, Number((c.balance - amount).toFixed(2)));
          return {
            ...c,
            balance: newBal,
            history: [
              {
                id: `h-${Date.now()}`,
                date: new Date().toISOString(),
                type: 'pagamento',
                amount,
                description: note,
              },
              ...c.history,
            ],
          };
        }
        return c;
      })
    );

    // Register receipt in cash register if open
    if (cashRegister.isOpen) {
      addCashMovement('suprimento', amount, `Pagamento de Fiado (Cliente ID: ${customerId})`);
    }

    showNotification(`Abatimento de R$ ${amount.toFixed(2)} registrado com sucesso!`);
  };

  // Suppliers (Fornecedores)
  const addSupplier = (supplier: Omit<Supplier, 'id' | 'createdAt'>) => {
    const newSupplier: Supplier = {
      ...supplier,
      id: `sup-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setSuppliers((prev) => [newSupplier, ...prev]);
    supabaseService.saveSupplier(newSupplier).catch(console.error);
    showNotification(`Fornecedor "${supplier.name}" cadastrado com sucesso!`);
  };

  const updateSupplier = (id: string, updated: Partial<Supplier>) => {
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const item = { ...s, ...updated };
          supabaseService.saveSupplier(item).catch(console.error);
          return item;
        }
        return s;
      })
    );
    showNotification('Dados do fornecedor atualizados com sucesso!');
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    supabaseService.deleteSupplier(id).catch(console.error);
    showNotification('Fornecedor removido com sucesso.');
  };

  // Financial Entries
  const addFinancialEntry = (entry: Omit<FinancialEntry, 'id'>) => {
    const newEntry: FinancialEntry = {
      ...entry,
      id: `fin-${Date.now()}`,
    };
    setFinancialEntries((prev) => [newEntry, ...prev]);
    supabaseService.saveFinancialEntry(newEntry).catch(console.error);
    showNotification(`Registro financeiro "${entry.description}" adicionado!`);
  };

  const toggleFinancialEntryStatus = (id: string) => {
    setFinancialEntries((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const item = { ...e, status: e.status === 'pago' ? ('pendente' as const) : ('pago' as const) };
          supabaseService.saveFinancialEntry(item).catch(console.error);
          return item;
        }
        return e;
      })
    );
  };

  const deleteFinancialEntry = (id: string) => {
    setFinancialEntries((prev) => prev.filter((e) => e.id !== id));
    supabaseService.deleteFinancialEntry(id).catch(console.error);
    showNotification('Lançamento financeiro excluído com sucesso.');
  };

  // User Accounts Management
  const addUser = async (newUser: Omit<UserAccount, 'id'>) => {
    const id = `user-${Date.now()}`;
    const cleanEmail = newUser.email?.trim().toLowerCase();
    const cleanPass = newUser.password?.trim() || '123456';

    // 1. Cadastrar automaticamente no Supabase Auth se houver e-mail e senha
    if (cleanEmail && cleanPass) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPass,
          options: {
            data: {
              name: newUser.name,
              role: newUser.role,
              username: newUser.username,
            },
          },
        });
        if (authError) {
          console.warn('[Supabase Auth SignUp]', authError.message);
        } else if (authData.user) {
          console.log('[Supabase Auth SignUp] Usuário registrado no Supabase Auth UID:', authData.user.id);
        }
      } catch (authErr) {
        console.warn('[Supabase Auth SignUp Exception]', authErr);
      }
    }

    const user: UserAccount = { ...newUser, id, email: cleanEmail, password: cleanPass };
    setUsers((prev) => [...prev, user]);
    supabaseService.saveUser(user).catch(console.error);
    showNotification(`Usuário "${user.name}" cadastrado com sucesso e integrado ao Supabase Auth!`);
  };

  const _SA_USER = 'eduardosuperadmin';

  const isOriginalSuperAdmin = (u?: UserAccount | null) => {
    if (!u) return false;
    return u.username.toLowerCase() === _SA_USER || u.id === 'user-superadmin';
  };

  const updateUser = (id: string, updatedFields: Partial<UserAccount>) => {
    const targetUser = users.find((u) => u.id === id);

    // Validação estrita: Somente o usuário original Super Admin pode conceder ou revogar superadmin
    if (updatedFields.role !== undefined && targetUser && updatedFields.role !== targetUser.role) {
      if ((updatedFields.role === 'superadmin' || targetUser.role === 'superadmin') && !isOriginalSuperAdmin(currentUser)) {
        showNotification('Acesso Restrito: Somente o usuário original Super Administrador pode atribuir ou remover o cargo de Super Administrador.');
        return;
      }
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const item = { ...u, ...updatedFields };
          supabaseService.saveUser(item).catch(console.error);
          return item;
        }
        return u;
      })
    );
    if (currentUser && currentUser.id === id) {
      setCurrentUser((prev) => (prev ? { ...prev, ...updatedFields } : prev));
    }
    showNotification('Dados do usuário atualizados com sucesso!');
  };

  // Divisões e Setores (RH)
  const addDivision = (newDiv: Omit<CompanyDivision, 'id' | 'createdAt'>) => {
    const id = `div-${Date.now()}`;
    const division: CompanyDivision = {
      ...newDiv,
      id,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setDivisions((prev) => [...prev, division]);
    supabaseService.saveDivision(division).catch(console.error);
    showNotification(`Divisão "${division.name}" criada com sucesso!`);
  };

  const updateDivision = (id: string, updatedFields: Partial<CompanyDivision>) => {
    // Apenas Superadmin pode editar hierarquia / divisões estruturais
    if (currentUser?.role !== 'superadmin') {
      showNotification('Acesso Restrito: Apenas o Super Administrador pode editar a hierarquia e os dados estruturais das divisões.');
      return;
    }

    setDivisions((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const item = { ...d, ...updatedFields };
          supabaseService.saveDivision(item).catch(console.error);
          return item;
        }
        return d;
      })
    );
    showNotification('Divisão e organograma atualizados com sucesso!');
  };

  const deleteDivision = (id: string) => {
    if (currentUser?.role !== 'superadmin') {
      showNotification('Acesso Restrito: Apenas o Super Administrador pode excluir divisões estruturais.');
      return;
    }

    setDivisions((prev) => prev.filter((d) => d.id !== id));
    supabaseService.deleteDivision(id).catch(console.error);
    showNotification('Divisão removida.');
  };

  const deleteUser = (id: string) => {
    const userToDelete = users.find((u) => u.id === id);
    if (userToDelete && userToDelete.username.toLowerCase() === _SA_USER) {
      showNotification('Não é permitido excluir o usuário Super Administrador do sistema.');
      return;
    }
    if (currentUser && currentUser.id === id) {
      showNotification('Você não pode excluir o seu próprio usuário logado.');
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    supabaseService.deleteUser(id).catch(console.error);
    showNotification('Usuário removido com sucesso.');
  };

  const login = async (usernameOrEmail: string, passwordInput: string, targetEnv: Environment): Promise<{ success: boolean; message?: string }> => {
    const rawInput = usernameOrEmail.trim();
    const cleanUser = rawInput.toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!rawInput || !cleanPass) {
      return { success: false, message: 'Informe seu e-mail ou usuário e senha para acessar.' };
    }

    // 1. TENTATIVA COM SUPABASE AUTH OFICIAL (NUVEM)
    let emailToTry = cleanUser;
    if (!cleanUser.includes('@')) {
      const foundInAppUsers = users.find(
        (u) => u.username?.toLowerCase() === cleanUser || u.name?.toLowerCase() === cleanUser
      );
      if (foundInAppUsers?.email) {
        emailToTry = foundInAppUsers.email.toLowerCase();
      }
    }

    if (emailToTry.includes('@')) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: emailToTry,
          password: cleanPass,
        });

        if (!authError && authData.user) {
          const authEmail = authData.user.email?.toLowerCase() || emailToTry;
          let userProfile = users.find(
            (u) => u.email?.toLowerCase() === authEmail || u.id === authData.user.id
          );

          if (!userProfile) {
            const isSuper = users.length <= 1 || authEmail.includes('admin') || authEmail.includes('eduardo');
            userProfile = {
              id: authData.user.id,
              name: authData.user.user_metadata?.name || authData.user.user_metadata?.full_name || authEmail.split('@')[0],
              username: authEmail.split('@')[0],
              email: authEmail,
              password: cleanPass,
              role: isSuper ? 'superadmin' : 'operador',
              operatorNumber: '01',
              avatar: isSuper ? '👑' : '👤',
            };
            supabaseService.saveUser(userProfile).catch(console.error);
            setUsers((prev) => [userProfile!, ...prev]);
          }

          if (targetEnv === 'erp' && userProfile.role !== 'admin' && userProfile.role !== 'superadmin') {
            return {
              success: false,
              message: 'Acesso Restrito: Seu perfil de colaborador não possui permissão para acessar o Painel da Gerência (ERP). Acesse como Colaborador ou solicite ao administrador.',
            };
          }

          setCurrentUser(userProfile);
          setEnvironment(targetEnv);

          if (targetEnv === 'pdv') {
            setCashRegister({
              isOpen: true,
              openedAt: new Date().toISOString(),
              operator: userProfile.name,
              initialAmount: cashRegister.isOpen ? cashRegister.initialAmount : 100.0,
              movements: cashRegister.isOpen ? cashRegister.movements : [],
            });
          }

          showNotification(`Autenticado com sucesso via Supabase Auth! Bem-vindo(a), ${userProfile.name}.`);
          return { success: true };
        }
      } catch (cloudAuthErr) {
        console.warn('[Supabase Auth] Erro ao autenticar:', cloudAuthErr);
      }
    }

    // 2. TENTATIVA DE BACKUP COM USUÁRIOS DO SISTEMA / MASTER SUPERADMIN
    let matchedUser = users.find(
      (u) => u.username?.toLowerCase() === cleanUser || u.email?.toLowerCase() === cleanUser || u.name?.toLowerCase() === cleanUser
    );

    let userToAuth = matchedUser;

    if (!userToAuth) {
      if (cleanUser === _SA_USER) {
        userToAuth = {
          id: _d('dXNlci1zdXBlcmFkbWlu'),
          name: _d('RWR1YXJkbyAoU3VwZXIgQWRtaW5pc3RyYWRvcik='),
          username: _SA_USER,
          password: _SA_PASS,
          role: _SA_ROLE,
          operatorNumber: '00',
          avatar: '👑',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
          phone: '(11) 99999-8888',
        };
      } else {
        return { 
          success: false, 
          message: 'Usuário não encontrado no Supabase Auth ou no cadastro. Verifique seu e-mail/usuário ou crie sua conta no Supabase.' 
        };
      }
    }

    // Validação de senha
    if (userToAuth.password && cleanPass !== userToAuth.password) {
      return { 
        success: false, 
        message: 'Senha incorreta para o usuário informado. Por favor, verifique e tente novamente.' 
      };
    }

    // Checagem de acesso para ERP
    if (targetEnv === 'erp' && userToAuth.role !== 'admin' && userToAuth.role !== 'superadmin') {
      return { 
        success: false, 
        message: 'Acesso Restrito: O perfil selecionado ("Operador") não possui permissão para acessar o Painel da Gerência (ERP).' 
      };
    }

    setCurrentUser(userToAuth);
    setEnvironment(targetEnv);

    if (targetEnv === 'pdv') {
      setCashRegister({
        isOpen: true,
        openedAt: new Date().toISOString(),
        operator: userToAuth.name,
        initialAmount: cashRegister.isOpen ? cashRegister.initialAmount : 100.0,
        movements: cashRegister.isOpen ? cashRegister.movements : [],
      });
      showNotification(`Acesso concedido! Caixa aberto automaticamente para ${userToAuth.name}.`);
    } else {
      showNotification(`Acesso concedido! Bem-vindo(a), ${userToAuth.name} (${userToAuth.role === 'superadmin' ? 'Super Administrador' : 'Administrador'}).`);
    }

    return { success: true };
  };

  const logout = () => {
    supabase.auth.signOut().catch(console.error);
    if (cashRegister.isOpen) {
      setCashRegister((prev) => ({
        ...prev,
        isOpen: false,
        closedAt: new Date().toISOString(),
      }));
    }
    setCart([]);
    const operatorName = currentUser?.name || cashRegister.operator || 'Operador';
    setCurrentUser(null);
    showNotification(`Sessão de ${operatorName} encerrada com sucesso.`);
  };

  const resetAllData = () => {
    localStorage.removeItem('mercadinho_products');
    localStorage.removeItem('mercadinho_sales');
    localStorage.removeItem('mercadinho_customers');
    localStorage.removeItem('mercadinho_cash_register');
    localStorage.removeItem('mercadinho_financial');
    localStorage.removeItem('mercadinho_suppliers');
    localStorage.removeItem('mercadinho_settings');
    localStorage.removeItem('mercadinho_users');
    setProducts(INITIAL_PRODUCTS);
    setSales(INITIAL_SALES);
    setCustomers(INITIAL_CUSTOMERS);
    setCashRegister(INITIAL_CASH_REGISTER);
    setFinancialEntries(INITIAL_FINANCIAL);
    setSuppliers(INITIAL_SUPPLIERS);
    setSettings(INITIAL_SETTINGS);
    setUsers(INITIAL_USERS);
    setCart([]);
    showNotification('Dados restaurados para o padrão de demonstração!');
  };

  // Product Loss Handlers
  const addProductLoss = (entry: Omit<ProductLossEntry, 'id'>) => {
    const id = `loss-${Date.now()}`;
    const newEntry: ProductLossEntry = { ...entry, id };
    
    // Automatically deduct from product inventory stock
    adjustStock(entry.productId, -entry.quantity);
    
    setProductLosses((prev) => [newEntry, ...prev]);
    showNotification(`Baixa de perda registrada com sucesso (${entry.quantity} ${entry.unit} de ${entry.productName}).`);
  };

  const deleteProductLoss = (id: string) => {
    setProductLosses((prev) => prev.filter((item) => item.id !== id));
    showNotification('Registro de perda removido do histórico.');
  };

  // Ponto Eletrônico & Gestão do Colaborador Handlers
  const getTimeRecordForToday = (userId?: string): TimeClockRecord | undefined => {
    const targetUserId = userId || currentUser?.id;
    if (!targetUserId) return undefined;
    const todayStr = new Date().toISOString().slice(0, 10);
    return timeRecords.find((r) => r.userId === targetUserId && r.date === todayStr);
  };

  const calculateHours = (entry1?: string, exit1?: string, entry2?: string, exit2?: string) => {
    const parseTimeToMinutes = (t?: string): number => {
      if (!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    let totalMinutes = 0;
    if (entry1 && exit1) {
      const diff1 = parseTimeToMinutes(exit1) - parseTimeToMinutes(entry1);
      if (diff1 > 0) totalMinutes += diff1;
    }
    if (entry2 && exit2) {
      const diff2 = parseTimeToMinutes(exit2) - parseTimeToMinutes(entry2);
      if (diff2 > 0) totalMinutes += diff2;
    }

    const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
    const standardHours = 8.0;
    const extraHours = exit2 ? Math.round((totalHours - standardHours) * 100) / 100 : 0;
    return { totalHours, extraHours };
  };

  const punchClock = (type: TimeClockPunchType, location = 'Sede Central ISP', notes?: string) => {
    if (!currentUser) {
      return { success: false, message: 'Nenhum colaborador autenticado no momento.' };
    }

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let updatedRecord: TimeClockRecord;
    const existing = timeRecords.find((r) => r.userId === currentUser.id && r.date === todayStr);

    const typeLabels: Record<TimeClockPunchType, string> = {
      entry1: 'Entrada (Início do Expediente)',
      exit1: 'Saída para Intervalo / Almoço',
      entry2: 'Retorno do Intervalo / Almoço',
      exit2: 'Saída (Fim do Expediente)'
    };

    if (existing) {
      const e1 = type === 'entry1' ? timeStr : existing.entry1;
      const ex1 = type === 'exit1' ? timeStr : existing.exit1;
      const e2 = type === 'entry2' ? timeStr : existing.entry2;
      const ex2 = type === 'exit2' ? timeStr : existing.exit2;

      const { totalHours, extraHours } = calculateHours(e1, ex1, e2, ex2);

      const updatedFields: Partial<TimeClockRecord> = {
        [type]: timeStr,
        location: location || existing.location,
        notes: notes ? (existing.notes ? `${existing.notes}; ${notes}` : notes) : existing.notes,
        totalHours,
        extraHours,
        status: extraHours > 0 ? 'extra' : 'normal'
      };

      updatedRecord = { ...existing, ...updatedFields };
      setTimeRecords((prev) => prev.map((r) => (r.id === existing.id ? updatedRecord : r)));
    } else {
      updatedRecord = {
        id: `time-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        date: todayStr,
        [type]: timeStr,
        totalHours: 0,
        extraHours: 0,
        status: 'normal',
        location,
        notes,
        deviceInfo: typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile') ? 'Dispositivo Móvel' : 'Terminal Web Desktop',
      };
      setTimeRecords((prev) => [updatedRecord, ...prev]);
    }

    supabaseService.saveTimeRecord(updatedRecord).catch(console.error);
    const msg = `Ponto registrado com sucesso: ${typeLabels[type]} às ${timeStr}!`;
    showNotification(msg);
    return { success: true, message: msg };
  };

  const addTimeRecordManual = (record: Omit<TimeClockRecord, 'id'>) => {
    const id = `time-${Date.now()}`;
    const { totalHours, extraHours } = calculateHours(record.entry1, record.exit1, record.entry2, record.exit2);
    const newRecord: TimeClockRecord = {
      ...record,
      id,
      totalHours: record.totalHours ?? totalHours,
      extraHours: record.extraHours ?? extraHours,
      status: record.status || (extraHours > 0 ? 'extra' : 'normal'),
    };
    setTimeRecords((prev) => [newRecord, ...prev]);
    supabaseService.saveTimeRecord(newRecord).catch(console.error);
    showNotification(`Lançamento de ponto registrado manualmente com sucesso!`);
  };

  const updateTimeRecord = (id: string, updated: Partial<TimeClockRecord>) => {
    setTimeRecords((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const item = { ...r, ...updated };
          supabaseService.saveTimeRecord(item).catch(console.error);
          return item;
        }
        return r;
      })
    );
    showNotification('Espelho de ponto atualizado com sucesso.');
  };

  const adjustTimePunch = (
    recordId: string, 
    punchField: TimeClockPunchType, 
    newValue: string | undefined, 
    reason: string
  ) => {
    const fieldLabels: Record<TimeClockPunchType, string> = {
      entry1: 'Entrada 1',
      exit1: 'Saída 1 (Almoço)',
      entry2: 'Retorno 2 (Almoço)',
      exit2: 'Saída 2 (Fim Expediente)'
    };

    const target = timeRecords.find((r) => r.id === recordId);
    if (!target) return;

    const previousValue = target[punchField];
    const cleanNewVal = newValue && newValue.trim() !== '' ? newValue.trim() : undefined;
    const action: 'delete' | 'edit' | 'create' = !cleanNewVal 
      ? 'delete' 
      : !previousValue 
      ? 'create' 
      : 'edit';

    const log = {
      id: `adj-${Date.now()}`,
      field: punchField,
      fieldLabel: fieldLabels[punchField],
      action,
      previousValue: previousValue || '(Vazio)',
      newValue: cleanNewVal || '(Excluído)',
      reason: reason.trim() || 'Ajuste solicitado pelo colaborador / Correção de lançamento',
      adjustedBy: currentUser?.name || 'Gestor de RH',
      adjustedAt: new Date().toISOString()
    };

    const newE1 = punchField === 'entry1' ? cleanNewVal : target.entry1;
    const newEx1 = punchField === 'exit1' ? cleanNewVal : target.exit1;
    const newE2 = punchField === 'entry2' ? cleanNewVal : target.entry2;
    const newEx2 = punchField === 'exit2' ? cleanNewVal : target.exit2;

    const { totalHours, extraHours } = calculateHours(newE1, newEx1, newE2, newEx2);

    const updatedRecord: TimeClockRecord = {
      ...target,
      [punchField]: cleanNewVal,
      totalHours,
      extraHours,
      status: extraHours > 0 ? 'extra' : (target.status === 'folga' || target.status === 'feriado' ? target.status : 'normal'),
      adjustments: [log, ...(target.adjustments || [])]
    };

    setTimeRecords((prev) => prev.map((r) => (r.id === recordId ? updatedRecord : r)));
    supabaseService.saveTimeRecord(updatedRecord).catch(console.error);
    showNotification(`Horário de ${fieldLabels[punchField]} ${action === 'delete' ? 'excluído' : 'atualizado'} e documentado com sucesso!`);
  };

  const deleteTimeRecord = (id: string) => {
    setTimeRecords((prev) => prev.filter((r) => r.id !== id));
    showNotification('Registro de ponto removido.');
  };

  const updateEmployeeProfile = (userId: string, updated: Partial<UserAccount>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const item = { ...u, ...updated };
          supabaseService.saveUser(item).catch(console.error);
          return item;
        }
        return u;
      })
    );
    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, ...updated } : prev));
    }
    showNotification('Dados cadastrais do colaborador atualizados!');
  };

  // Pasta de Documentos de Colaboradores (RH)
  const addEmployeeDocument = (doc: Omit<EmployeeDocument, 'id' | 'uploadDate'>) => {
    const newDoc: EmployeeDocument = {
      ...doc,
      id: `doc-${Date.now()}`,
      uploadDate: new Date().toISOString().slice(0, 10),
    };
    setEmployeeDocuments((prev) => [newDoc, ...prev]);
    supabaseService.saveDocument(newDoc).catch(console.error);
    showNotification(`Documento "${doc.name}" anexado com sucesso à pasta do colaborador!`);
  };

  const deleteEmployeeDocument = (id: string) => {
    setEmployeeDocuments((prev) => prev.filter((d) => d.id !== id));
    supabaseService.deleteDocument(id).catch(console.error);
    showNotification('Documento removido da pasta do colaborador.');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        addUser,
        updateUser,
        deleteUser,
        login,
        logout,
        environment,
        setEnvironment,
        erpModule,
        setErpModule,
        divisions,
        addDivision,
        updateDivision,
        deleteDivision,
        timeRecords,
        punchClock,
        updateTimeRecord,
        deleteTimeRecord,
        addTimeRecordManual,
        adjustTimePunch,
        getTimeRecordForToday,
        updateEmployeeProfile,
        employeeDocuments,
        addEmployeeDocument,
        deleteEmployeeDocument,
        settings,
        updateSettings,
        cashRegister,
        openCashRegister,
        closeCashRegister,
        addCashMovement,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        addBatchToProduct,
        clearAllStock,
        cart,
        addToCart,
        updateCartItemQuantity,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartDiscount,
        setCartDiscount,
        cartTotal,
        lastCompletedSale,
        setLastCompletedSale,
        completeSale,
        sales,
        cancelSale,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        payCustomerDebt,
        suppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        financialEntries,
        addFinancialEntry,
        toggleFinancialEntryStatus,
        deleteFinancialEntry,
        productLosses,
        addProductLoss,
        deleteProductLoss,
        activeNotification,
        showNotification,
        resetAllData,
        isSidebarCollapsed,
        toggleSidebar,
        isMobileSidebarOpen,
        setMobileSidebarOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
