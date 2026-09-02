/**
 * Safe localStorage wrapper with automatic quota management, 
 * base64 sanitization and automatic pruning to prevent QuotaExceededError.
 */

// Helper to strip heavy base64 strings from sale item snapshots
export const sanitizeSaleForStorage = (sale: any) => {
  if (!sale || !sale.items) return sale;
  return {
    ...sale,
    items: sale.items.map((item: any) => {
      if (!item || !item.product) return item;
      return {
        ...item,
        product: {
          ...item.product,
          // Strip long base64 image strings from historical sales snapshots to prevent quota overflow
          imageUrl: item.product.imageUrl?.startsWith('data:') ? undefined : item.product.imageUrl
        }
      };
    })
  };
};

export const safeSetItem = (key: string, value: any): boolean => {
  try {
    let toStore = value;
    if (key === 'mercadinho_sales' && Array.isArray(value)) {
      toStore = value.slice(0, 300).map(sanitizeSaleForStorage);
    }
    const stringVal = typeof toStore === 'string' ? toStore : JSON.stringify(toStore);
    localStorage.setItem(key, stringVal);
    return true;
  } catch (error) {
    console.warn(`[SafeStorage] QuotaExceeded on key "${key}". Executing auto-recovery...`, error);
    
    // Auto-recovery: If it's sales, prune down to 50 entries
    if (key === 'mercadinho_sales' && Array.isArray(value)) {
      try {
        const pruned = value.slice(0, 50).map(sanitizeSaleForStorage);
        localStorage.setItem(key, JSON.stringify(pruned));
        return true;
      } catch {
        // Continue to fallback
      }
    }

    // Try pruning other potential heavy data
    try {
      const savedSales = localStorage.getItem('mercadinho_sales');
      if (savedSales) {
        const parsedSales = JSON.parse(savedSales);
        if (Array.isArray(parsedSales) && parsedSales.length > 30) {
          localStorage.setItem('mercadinho_sales', JSON.stringify(parsedSales.slice(0, 30).map(sanitizeSaleForStorage)));
        }
      }
      const retryVal = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, retryVal);
      return true;
    } catch (retryError) {
      console.error(`[SafeStorage] Could not persist key "${key}" even after pruning:`, retryError);
      return false;
    }
  }
};

export const safeGetItem = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`[SafeStorage] Error reading key "${key}":`, error);
    return fallback;
  }
};
