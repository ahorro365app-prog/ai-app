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
  BO: { code: "BOB", symbol: "Bs.", name: "Boliviano", locale: "es-BO" },
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

  // Función para actualizar la moneda desde Supabase
  const updateCurrencyFromSupabase = useCallback((supabaseCurrency: string) => {
    const countryCode = Object.keys(currencyMap).find(key => 
      currencyMap[key].code === supabaseCurrency
    );
    
    if (countryCode) {
      const currencyConfig = currencyMap[countryCode];
      setCurrency(currencyConfig);
      setCountry(countryCode);
      
      // Actualizar localStorage también
      localStorage.setItem('userCurrency', JSON.stringify(currencyConfig));
      localStorage.setItem('userCountry', countryCode);
    }
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
    // Formatear solo el número sin símbolo de moneda
    const numberFormatter = new Intl.NumberFormat(currency.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    });
    
    const formattedNumber = numberFormatter.format(amount);
    
    // Agregar nuestro símbolo personalizado al principio
    return `${currency.symbol}${formattedNumber}`;
  }, [currency.locale, currency.symbol]);

  const changeCurrency = useCallback(async (countryCode: string) => {
    const currencyConfig = currencyMap[countryCode] || currencyMap.DEFAULT;
    setCurrency(currencyConfig);
    setCountry(countryCode);
    
    localStorage.setItem('userCurrency', JSON.stringify(currencyConfig));
    localStorage.setItem('userCountry', countryCode);
    
    // Guardar país en Supabase si hay usuario logueado
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Mapeo de country code a timezone
        const timezoneMap: Record<string, string> = {
          'BOL': 'America/La_Paz',
          'ARG': 'America/Argentina/Buenos_Aires',
          'MEX': 'America/Mexico_City',
          'PER': 'America/Lima',
          'COL': 'America/Bogota',
          'CHL': 'America/Santiago',
          'US': 'America/New_York',
          'ES': 'Europe/Madrid',
        };
        
        const countryCode3 = countryCode === 'BO' ? 'BOL' : 
                             countryCode === 'AR' ? 'ARG' : 
                             countryCode === 'MX' ? 'MEX' : 
                             countryCode === 'PE' ? 'PER' : 
                             countryCode === 'CO' ? 'COL' : 
                             countryCode === 'CL' ? 'CHL' : 
                             countryCode === 'US' ? 'US' : 
                             countryCode === 'ES' ? 'ES' : 'BOL';
        
        const timezone = timezoneMap[countryCode3] || 'America/La_Paz';
        
        await supabase
          .from('usuarios')
          .update({
            country_code: countryCode3,
            timezone: timezone,
            moneda: currencyConfig.code
          })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error updating country in Supabase:', error);
    }
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
    updateCurrencyFromSupabase,
  };
}

