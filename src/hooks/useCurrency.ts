"use client";

import { useEffect, useState, useMemo, useCallback } from "react";

interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

const currencyMap: Record<string, CurrencyConfig> = {
  // América Latina
  AR: { code: "ARS", symbol: "$", name: "Peso argentino", locale: "es-AR" },
  BO: { code: "BOB", symbol: "Bs", name: "Boliviano", locale: "es-BO" },
  BR: { code: "BRL", symbol: "R$", name: "Real brasileño", locale: "pt-BR" },
  CL: { code: "CLP", symbol: "$", name: "Peso chileno", locale: "es-CL" },
  CO: { code: "COP", symbol: "$", name: "Peso colombiano", locale: "es-CO" },
  CR: { code: "CRC", symbol: "₡", name: "Colón costarricense", locale: "es-CR" },
  DO: { code: "DOP", symbol: "RD$", name: "Peso dominicano", locale: "es-DO" },
  EC: { code: "USD", symbol: "$", name: "Dólar estadounidense", locale: "es-EC" },
  SV: { code: "USD", symbol: "$", name: "Dólar estadounidense", locale: "es-SV" },
  GT: { code: "GTQ", symbol: "Q", name: "Quetzal guatemalteco", locale: "es-GT" },
  HN: { code: "HNL", symbol: "L", name: "Lempira hondureño", locale: "es-HN" },
  MX: { code: "MXN", symbol: "$", name: "Peso mexicano", locale: "es-MX" },
  NI: { code: "NIO", symbol: "C$", name: "Córdoba nicaragüense", locale: "es-NI" },
  PA: { code: "PAB", symbol: "B/.", name: "Balboa panameño", locale: "es-PA" },
  PY: { code: "PYG", symbol: "₲", name: "Guaraní paraguayo", locale: "es-PY" },
  PE: { code: "PEN", symbol: "S/", name: "Sol peruano", locale: "es-PE" },
  UY: { code: "UYU", symbol: "$U", name: "Peso uruguayo", locale: "es-UY" },
  VE: { code: "VES", symbol: "Bs.S", name: "Bolívar venezolano", locale: "es-VE" },
  
  // Norte América
  US: { code: "USD", symbol: "$", name: "Dólar estadounidense", locale: "en-US" },
  CA: { code: "CAD", symbol: "C$", name: "Dólar canadiense", locale: "en-CA" },
  
  // Europa
  ES: { code: "EUR", symbol: "€", name: "Euro", locale: "es-ES" },
  GB: { code: "GBP", symbol: "£", name: "Libra esterlina", locale: "en-GB" },
  
  // Por defecto
  DEFAULT: { code: "USD", symbol: "$", name: "Dólar estadounidense", locale: "en-US" },
};

export function useCurrency() {
  const [currency, setCurrency] = useState<CurrencyConfig>(currencyMap.DEFAULT);
  const [country, setCountry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Intentar obtener la moneda guardada en localStorage
    const savedCurrency = localStorage.getItem('userCurrency');
    const savedCountry = localStorage.getItem('userCountry');

    if (savedCurrency && savedCountry) {
      setCurrency(JSON.parse(savedCurrency));
      setCountry(savedCountry);
      setIsLoading(false);
      return;
    }

    // Detectar país mediante API de geolocalización
    detectCountryAndCurrency();
  }, []);

  const detectCountryAndCurrency = async () => {
    try {
      // Intentar con ipapi.co (gratis, sin API key)
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.country_code) {
        const countryCode = data.country_code;
        const currencyConfig = currencyMap[countryCode] || currencyMap.DEFAULT;
        
        setCurrency(currencyConfig);
        setCountry(countryCode);
        
        // Guardar en localStorage
        localStorage.setItem('userCurrency', JSON.stringify(currencyConfig));
        localStorage.setItem('userCountry', countryCode);
      } else {
        // Fallback: intentar con el navegador
        detectFromBrowser();
      }
    } catch (error) {
      console.error('Error detecting country:', error);
      detectFromBrowser();
    } finally {
      setIsLoading(false);
    }
  };

  const detectFromBrowser = () => {
    try {
      // Intentar detectar desde el idioma del navegador
      const browserLang = navigator.language || 'en-US';
      const langCountry = browserLang.split('-')[1]?.toUpperCase();
      
      if (langCountry && currencyMap[langCountry]) {
        const currencyConfig = currencyMap[langCountry];
        setCurrency(currencyConfig);
        setCountry(langCountry);
        
        localStorage.setItem('userCurrency', JSON.stringify(currencyConfig));
        localStorage.setItem('userCountry', langCountry);
      }
    } catch (error) {
      console.error('Error detecting from browser:', error);
    }
  };

  // Memoizar formatAmount para evitar recrearlo en cada render
  const formatAmount = useCallback((amount: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    }).format(amount);
  }, [currency.locale, currency.code]);

  const changeCurrency = useCallback((countryCode: string) => {
    const currencyConfig = currencyMap[countryCode] || currencyMap.DEFAULT;
    setCurrency(currencyConfig);
    setCountry(countryCode);
    
    localStorage.setItem('userCurrency', JSON.stringify(currencyConfig));
    localStorage.setItem('userCountry', countryCode);
  }, []);

  // Memoizar la lista de países disponibles
  const availableCountries = useMemo(() => 
    Object.keys(currencyMap).filter(k => k !== 'DEFAULT'),
    []
  );

  return {
    currency,
    country,
    isLoading,
    formatAmount,
    changeCurrency,
    availableCountries,
    setCountry,
    setCurrency,
  };
}

