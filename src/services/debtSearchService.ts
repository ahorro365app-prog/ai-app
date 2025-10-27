/**
 * Servicio para buscar deudas por nombre usando coincidencias difusas
 */

export interface DebtSearchResult {
  id: string;
  nombre: string;
  monto_total: number;
  monto_pagado: number;
  monto_restante: number;
  fecha_vencimiento?: string;
  es_mensual: boolean;
  dia_mensual?: number;
  historial_pagos: any[];
  coincidencia: number; // Porcentaje de coincidencia (0-100)
}

export interface DebtSearchOptions {
  threshold?: number; // Umbral mínimo de coincidencia (default: 60)
  maxResults?: number; // Máximo número de resultados (default: 5)
}

class DebtSearchService {
  /**
   * Busca deudas por nombre usando coincidencia difusa
   */
  async searchDebtsByName(
    searchName: string, 
    debts: any[], 
    options: DebtSearchOptions = {}
  ): Promise<DebtSearchResult[]> {
    const { threshold = 60, maxResults = 5 } = options;
    
    if (!searchName.trim() || debts.length === 0) {
      return [];
    }

    const normalizedSearchName = this.normalizeText(searchName);
    const results: DebtSearchResult[] = [];

    for (const debt of debts) {
      const normalizedDebtName = this.normalizeText(debt.nombre);
      
      // Calcular coincidencia usando algoritmo de Levenshtein mejorado
      const similarity = this.calculateSimilarity(normalizedSearchName, normalizedDebtName);
      
      if (similarity >= threshold) {
        results.push({
          id: debt.id,
          nombre: debt.nombre,
          monto_total: debt.monto_total,
          monto_pagado: debt.monto_pagado,
          monto_restante: debt.monto_total - debt.monto_pagado,
          fecha_vencimiento: debt.fecha_vencimiento,
          es_mensual: debt.es_mensual,
          dia_mensual: debt.dia_mensual,
          historial_pagos: debt.historial_pagos || [],
          coincidencia: Math.round(similarity)
        });
      }
    }

    // Ordenar por coincidencia descendente
    results.sort((a, b) => b.coincidencia - a.coincidencia);
    
    return results.slice(0, maxResults);
  }

  /**
   * Normaliza texto para búsqueda (elimina acentos, convierte a minúsculas, etc.)
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^\w\s]/g, '') // Eliminar caracteres especiales
      .trim();
  }

  /**
   * Calcula similitud entre dos textos usando algoritmo mejorado
   */
  private calculateSimilarity(text1: string, text2: string): number {
    if (text1 === text2) return 100;
    
    // Coincidencia exacta de palabras
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    
    let exactMatches = 0;
    for (const word1 of words1) {
      if (words2.includes(word1)) {
        exactMatches++;
      }
    }
    
    const wordSimilarity = (exactMatches / Math.max(words1.length, words2.length)) * 100;
    
    // Coincidencia de subcadenas
    const substringSimilarity = this.calculateSubstringSimilarity(text1, text2);
    
    // Coincidencia de Levenshtein
    const levenshteinSimilarity = this.calculateLevenshteinSimilarity(text1, text2);
    
    // Combinar métricas con pesos
    return Math.max(
      wordSimilarity * 0.5 + substringSimilarity * 0.3 + levenshteinSimilarity * 0.2,
      substringSimilarity,
      levenshteinSimilarity
    );
  }

  /**
   * Calcula similitud basada en subcadenas comunes
   */
  private calculateSubstringSimilarity(text1: string, text2: string): number {
    const longer = text1.length > text2.length ? text1 : text2;
    const shorter = text1.length > text2.length ? text2 : text1;
    
    if (longer.length === 0) return 100;
    
    // Buscar la subcadena común más larga
    let maxCommonLength = 0;
    for (let i = 0; i <= longer.length - shorter.length; i++) {
      let commonLength = 0;
      for (let j = 0; j < shorter.length; j++) {
        if (longer[i + j] === shorter[j]) {
          commonLength++;
        } else {
          maxCommonLength = Math.max(maxCommonLength, commonLength);
          commonLength = 0;
        }
      }
      maxCommonLength = Math.max(maxCommonLength, commonLength);
    }
    
    return (maxCommonLength / longer.length) * 100;
  }

  /**
   * Calcula similitud usando distancia de Levenshtein
   */
  private calculateLevenshteinSimilarity(text1: string, text2: string): number {
    const matrix = Array(text2.length + 1).fill(null).map(() => Array(text1.length + 1).fill(null));
    
    for (let i = 0; i <= text1.length; i++) {
      matrix[0][i] = i;
    }
    
    for (let j = 0; j <= text2.length; j++) {
      matrix[j][0] = j;
    }
    
    for (let j = 1; j <= text2.length; j++) {
      for (let i = 1; i <= text1.length; i++) {
        const indicator = text1[i - 1] === text2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // eliminación
          matrix[j - 1][i] + 1,     // inserción
          matrix[j - 1][i - 1] + indicator // sustitución
        );
      }
    }
    
    const distance = matrix[text2.length][text1.length];
    const maxLength = Math.max(text1.length, text2.length);
    
    return maxLength === 0 ? 100 : ((maxLength - distance) / maxLength) * 100;
  }

  /**
   * Extrae nombres de deudas del texto de transcripción
   */
  extractDebtNamesFromText(text: string): string[] {
    const debtPatterns = [
      // Patrones para detectar nombres de deudas
      /(?:deuda|debito|prestamo|cuenta)\s+(?:de|del|la|el)\s+([^,.\n]+)/gi,
      /(?:pagar|pago|pague)\s+(?:la|el)\s+(?:deuda|debito|prestamo|cuenta)\s+(?:de|del|la|el)\s+([^,.\n]+)/gi,
      /(?:pagar|pago|pague)\s+([^,.\n]+?)\s+(?:bolivianos|bs|pesos|\$)/gi,
      /(?:a|para)\s+([^,.\n]+?)\s+(?:bolivianos|bs|pesos|\$)/gi
    ];

    const names: string[] = [];
    
    for (const pattern of debtPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1]?.trim();
        if (name && name.length > 2 && name.length < 50) {
          names.push(name);
        }
      }
    }

    // Eliminar duplicados y normalizar
    return [...new Set(names.map(name => this.normalizeText(name)))];
  }
}

export const debtSearchService = new DebtSearchService();
export default debtSearchService;


