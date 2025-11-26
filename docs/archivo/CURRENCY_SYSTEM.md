# 🌍 Sistema de Moneda Dinámica

## Descripción
El sistema de moneda dinámica detecta automáticamente el país del usuario y muestra los precios en su moneda local.

## Características

### 🔍 Detección Automática
- **Geolocalización por IP**: Utiliza la API de `ipapi.co` para detectar el país del usuario
- **Fallback por navegador**: Si la geolocalización falla, usa el idioma del navegador
- **Almacenamiento local**: Guarda la preferencia en `localStorage` para evitar múltiples detecciones

### 💰 Monedas Soportadas

#### América Latina
- 🇦🇷 Argentina - Peso argentino (ARS) - $
- 🇧🇴 Bolivia - Boliviano (BOB) - Bs
- 🇧🇷 Brasil - Real brasileño (BRL) - R$
- 🇨🇱 Chile - Peso chileno (CLP) - $
- 🇨🇴 Colombia - Peso colombiano (COP) - $
- 🇨🇷 Costa Rica - Colón costarricense (CRC) - ₡
- 🇩🇴 República Dominicana - Peso dominicano (DOP) - RD$
- 🇪🇨 Ecuador - Dólar estadounidense (USD) - $
- 🇸🇻 El Salvador - Dólar estadounidense (USD) - $
- 🇬🇹 Guatemala - Quetzal guatemalteco (GTQ) - Q
- 🇭🇳 Honduras - Lempira hondureño (HNL) - L
- 🇲🇽 México - Peso mexicano (MXN) - $
- 🇳🇮 Nicaragua - Córdoba nicaragüense (NIO) - C$
- 🇵🇦 Panamá - Balboa panameño (PAB) - B/.
- 🇵🇾 Paraguay - Guaraní paraguayo (PYG) - ₲
- 🇵🇪 Perú - Sol peruano (PEN) - S/
- 🇺🇾 Uruguay - Peso uruguayo (UYU) - $U
- 🇻🇪 Venezuela - Bolívar venezolano (VES) - Bs.S

#### Otras Regiones
- 🇺🇸 Estados Unidos - Dólar (USD) - $
- 🇨🇦 Canadá - Dólar canadiense (CAD) - C$
- 🇪🇸 España - Euro (EUR) - €
- 🇬🇧 Reino Unido - Libra esterlina (GBP) - £

## Uso

### Hook `useCurrency`

```tsx
import { useCurrency } from "@/hooks/useCurrency";

function MyComponent() {
  const { currency, formatAmount, isLoading } = useCurrency();
  
  return (
    <div>
      {isLoading ? '...' : formatAmount(100)}
      {/* Muestra: $100.00, Bs 100.00, €100.00, etc. según el país */}
    </div>
  );
}
```

### Componente `CurrencyDisplay`

```tsx
import CurrencyDisplay from "@/components/CurrencyDisplay";

function MyComponent() {
  return (
    <CurrencyDisplay 
      amount={100} 
      className="text-2xl font-bold"
      decimals={2}
    />
  );
}
```

## API del Hook

### Propiedades retornadas

```typescript
{
  currency: {
    code: string;      // Código ISO (USD, EUR, etc.)
    symbol: string;    // Símbolo ($, €, etc.)
    name: string;      // Nombre completo
    locale: string;    // Locale para formato (es-MX, en-US, etc.)
  },
  country: string | null;           // Código del país (US, BO, etc.)
  isLoading: boolean;                // Estado de carga
  formatAmount: (amount: number) => string;  // Función para formatear
  changeCurrency: (countryCode: string) => void;  // Cambiar manualmente
  availableCountries: string[];      // Lista de países disponibles
}
```

### Métodos

#### `formatAmount(amount, options?)`
Formatea un número como moneda según el país del usuario.

```tsx
formatAmount(1234.56)
// Bolivia: Bs 1,234.56
// USA: $1,234.56
// España: 1.234,56 €
```

#### `changeCurrency(countryCode)`
Cambia manualmente la moneda del usuario.

```tsx
changeCurrency('MX')  // Cambia a Peso mexicano
```

## Almacenamiento

El sistema guarda dos valores en `localStorage`:
- `userCurrency`: Objeto JSON con la configuración de moneda
- `userCountry`: Código del país (2 letras)

## Detección de País

1. **Primera opción**: API de geolocalización por IP (`ipapi.co`)
2. **Segunda opción**: Idioma del navegador (`navigator.language`)
3. **Fallback**: USD (Dólar estadounidense)

## Internacionalización

El sistema usa `Intl.NumberFormat` para formatear correctamente según:
- Separadores de miles y decimales
- Posición del símbolo de moneda
- Convenciones locales

## Páginas Actualizadas

✅ Dashboard - `/dashboard`
✅ Perfil - `/profile`
✅ Planes gratuitos - `/free`
✅ Facturación - `/billing`

## Ejemplo Completo

```tsx
"use client";

import { useCurrency } from "@/hooks/useCurrency";
import CurrencyDisplay from "@/components/CurrencyDisplay";

export default function PricingPage() {
  const { currency, formatAmount, country, isLoading } = useCurrency();

  return (
    <div>
      <h1>Precio: {formatAmount(99.99)}/mes</h1>
      
      <p>País detectado: {country}</p>
      <p>Moneda: {currency.name} ({currency.code})</p>
      
      <CurrencyDisplay 
        amount={199.99} 
        className="text-3xl font-bold"
      />
    </div>
  );
}
```

## Notas Técnicas

- ⚡ La detección se ejecuta solo una vez por sesión
- 💾 Los datos se cachean en `localStorage`
- 🌐 Compatible con SSR (Server Side Rendering)
- 📱 Funciona en móvil y desktop
- 🔄 No requiere recarga de página para cambiar moneda

## Roadmap Futuro

- [ ] Conversión de tasas en tiempo real
- [ ] Soporte para más monedas
- [ ] API para actualizar precios por región
- [ ] Panel de admin para gestión de precios




