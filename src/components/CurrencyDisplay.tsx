"use client";

import { useCurrency } from "@/hooks/useCurrency";

interface CurrencyDisplayProps {
  amount: number;
  className?: string;
  showSymbol?: boolean;
  decimals?: number;
}

export default function CurrencyDisplay({ 
  amount, 
  className = "", 
  showSymbol = true,
  decimals = 2
}: CurrencyDisplayProps) {
  const { formatAmount, currency, isLoading } = useCurrency();

  if (isLoading) {
    return <span className={className}>...</span>;
  }

  if (!showSymbol) {
    return (
      <span className={className}>
        {amount.toLocaleString(currency.locale, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}
      </span>
    );
  }

  return (
    <span className={className}>
      {formatAmount(amount, { 
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals 
      })}
    </span>
  );
}




