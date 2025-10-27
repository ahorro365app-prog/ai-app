# 🎯 Comportamiento de Groq después de Whisper

## 📋 Resumen

Este documento describe cómo Groq LLM procesa y extrae información de las transcripciones de audio generadas por Whisper.

---

## 🔄 Flujo Completo

```
Audio → Whisper (transcripción) → Groq LLM (extracción) → JSON estructurado
```

1. **Usuario graba audio** → Por voz o archivo de audio
2. **Whisper transcribe** → Texto plano en español
3. **Groq procesa** → Extrae monto, categoría, tipo, descripción, fecha, etc.
4. **Se guarda en BD** → Tabla `predicciones_groq` + `transacciones`

---

## 🧠 Prompt de Sistema (Groq)

### Monedas Soportadas

Groq puede detectar estas monedas:

| Moneda | Código | Variaciones reconocidas |
|--------|--------|-------------------------|
| Boliviano | BOB | "bolivianos", "bs", "boliviano", "Bs" |
| Dólar estadounidense | USD | "dólares", "usd", "dollar", "$" |
| Euro | EUR | "euros", "eur", "euro" |
| Peso mexicano | MXN | "pesos mexicanos", "pesos", "mxn" |
| Peso argentino | ARS | "pesos argentinos", "ars", "peso argentino" |
| Peso chileno | CLP | "pesos chilenos", "clp" |
| Sol peruano | PEN | "soles", "pen", "sol peruano" |
| Peso colombiano | COP | "pesos colombianos", "cop" |

### Categorías Disponibles

Groq puede clasificar en estas categorías o crear nuevas más específicas:

- **comida**: alimentos, restaurantes, supermercado
- **transporte**: taxi, bus, gasolina, uber
- **educacion**: libros, cursos, fotocopias, material escolar
- **tecnologia**: computadoras, celulares, software
- **salud**: medicinas, doctores, hospital
- **entretenimiento**: cine, juegos, deportes
- **servicios**: luz, agua, internet, telefono
- **ropa**: vestimenta, zapatos, accesorios
- **hogar**: muebles, electrodomesticos, limpieza
- **otros**: cualquier cosa que no encaje

### Métodos de Pago

- **efectivo**: pagos en efectivo
- **tarjeta**: tarjeta de crédito, débito, visa, mastercard
- **transferencia**: transferencia bancaria
- **cheque**: cheque bancario
- **crypto**: criptomonedas, bitcoin
- **otro**: cualquier otro método

---

## 🔍 Funcionalidades Especiales

### 1. Detección de Fechas Relativas

Groq detecta y extrae referencias a fechas pasadas:

```typescript
// Palabras clave detectadas:
- "ayer" → fechaTexto: "ayer"
- "el día de ayer" → fechaTexto: "ayer"
- "hace 1 día" → fechaTexto: "hace 1 día"
- "hace 2 días" → fechaTexto: "hace 2 días"
- "hace una semana" → fechaTexto: "hace una semana"
```

Ejemplos:
- "Ayer compré comida por 50 bs" → Incluye `fechaTexto: "ayer"`
- "Hace 2 días pagué el taxi" → Incluye `fechaTexto: "hace 2 días"`

### 2. Detección de Pagos de Deudas

Groq detecta si la transacción es un pago de deuda:

```typescript
type GroqTransaction = {
  esPagoDeuda?: boolean;
  nombreDeuda?: string | null;
  // ... otros campos
};
```

Ejemplos:
- "Pagué 500 bs de la deuda de abed nego" 
  → `esPagoDeuda: true`, `nombreDeuda: "abed nego"`

- "Cancelé 200 bolivianos de mi préstamo del banco"
  → `esPagoDeuda: true`, `nombreDeuda: "préstamo del banco"`

### 3. Detección de Múltiples Transacciones

Groq puede separar múltiples transacciones en un solo texto:

**Ejemplo 1 - Separación exitosa:**
```
Input: "Compré comida por 20 bolivianos y pagué 5 bolivianos de fotocopias"
Output: {
  "transacciones": [
    { "monto": 20, "categoria": "comida", ... },
    { "monto": 5, "categoria": "educacion", ... }
  ],
  "esMultiple": true
}
```

**Ejemplo 2 - Misma categoría (no separa):**
```
Input: "Compré pan por 5 bs, leche por 8 bs y huevos por 12 bs"
Output: {
  "transacciones": [
    { "monto": 25, "categoria": "comida", "descripcion": "pan, leche, huevos" }
  ],
  "esMultiple": false
}
```

---

## 📊 Tipo de Respuesta

```typescript
type GroqExtraction = {
  monto?: number | null;
  categoria?: string | null;
  tipo?: 'gasto' | 'ingreso' | null;
  descripcion?: string | null;
  metodoPago?: string | null;
  raw?: any;
};

export type GroqTransaction = {
  monto: number | null;
  categoria: string | null;
  tipo: 'gasto' | 'ingreso' | null;
  descripcion: string | null;
  metodoPago: string | null;
  esPagoDeuda?: boolean;
  nombreDeuda?: string | null;
  fechaTexto?: string | null;
};
```

---

## 🌍 Contexto por País

### Función con Contexto Local

```typescript
export async function extractExpenseWithCountryContext(
  transcripcion: string,
  countryCode: string
): Promise<GroqExtraction | null>
```

**Proceso:**

1. **Obtiene reglas del país** desde tabla `reglas_pais` en Supabase
2. **Construye contexto local** con slang y palabras clave
3. **Inyecta contexto** antes de la transcripción
4. **Procesa con Groq** usando el contexto adicional

**Ejemplo de contexto:**

```typescript
// Para Bolivia (BOL):
Contexto local: 
En BOL, categoría transporte: taxi, trufi, micro, bus. 
trufi = taxi compartido; micro = bus urbano

Transcripción: Pagué 15 bs de trufi
```

**Resultado:**
```json
{
  "monto": 15,
  "categoria": "transporte",
  "tipo": "gasto",
  "descripcion": "trufi (taxi compartido)",
  "moneda": "Bs"
}
```

---

## ⚙️ Configuración

### Variables de Entorno

```bash
# .env.local
GROQ_API_KEY=tu_clave_aqui
NEXT_PUBLIC_GROQ_API_KEY=tu_clave_aqui
```

### Modelo de Groq

```typescript
const GROQ_MODEL = 'llama-3.1-8b-instant';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
```

---

## 📝 Ejemplos de Procesamiento

### Ejemplo 1: Transacción Simple

```
Input (transcripción): "Gasté 30 bolivianos en transporte"
```

```json
{
  "monto": 30,
  "categoria": "transporte",
  "tipo": "gasto",
  "descripcion": "transporte",
  "metodoPago": "efectivo",
  "moneda": "Bs"
}
```

### Ejemplo 2: Con Fecha Relativa

```
Input: "Ayer compré comida por 50 bs"
```

```json
{
  "monto": 50,
  "categoria": "comida",
  "tipo": "gasto",
  "descripcion": "comida",
  "metodoPago": "efectivo",
  "moneda": "Bs",
  "fechaTexto": "ayer"
}
```

### Ejemplo 3: Pago de Deuda

```
Input: "Acabo de pagar 500 bs de la deuda de Juan Pérez"
```

```json
{
  "monto": 500,
  "categoria": "otros",
  "tipo": "gasto",
  "descripcion": "pago de deuda a Juan Pérez",
  "metodoPago": "efectivo",
  "moneda": "Bs",
  "esPagoDeuda": true,
  "nombreDeuda": "Juan Pérez"
}
```

### Ejemplo 4: Múltiples Transacciones

```
Input: "Compré comida por 20 bs y pagué 5 bs de fotocopias"
```

```json
{
  "transacciones": [
    {
      "monto": 20,
      "categoria": "comida",
      "tipo": "gasto",
      "descripcion": "comida",
      "metodoPago": "efectivo",
      "moneda": "Bs"
    },
    {
      "monto": 5,
      "categoria": "educacion",
      "tipo": "gasto",
      "descripcion": "fotocopias",
      "metodoPago": "efectivo",
      "moneda": "Bs"
    }
  ],
  "esMultiple": true
}
```

---

## 🔧 Reglas Estrictas del Prompt

1. **Siempre busca palabras de fecha** en el texto
2. Si encuentras "ayer", "hace X días", etc., **incluye fechaTexto**
3. Si NO hay palabras de fecha, **NO incluyas fechaTexto**
4. **NO calcules fechas exactas**, solo extrae el texto de fecha
5. **DETECTA PAGOS DE DEUDAS**: Marca `esPagoDeuda: true` si aplica
6. **RECONOCE TODAS LAS MONEDAS**: Detecta cualquier moneda mencionada
7. Si encuentras MÚLTIPLES transacciones con DIFERENTES categorías, **sepáralas**
8. Si no se especifica método de pago, usa **"efectivo" por defecto**

---

## 🗄️ Persistencia en Base de Datos

### Tabla: `predicciones_groq`

```sql
CREATE TABLE predicciones_groq (
  id UUID PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id),
  country_code VARCHAR(3) NOT NULL,
  transcripcion TEXT NOT NULL,
  resultado JSONB NOT NULL,
  confirmado BOOLEAN DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabla: `transacciones`

```sql
INSERT INTO transacciones (
  usuario_id,
  tipo,
  monto,
  categoria,
  descripcion,
  fecha
) VALUES (
  'user_id',
  'gasto',
  50,
  'comida',
  'Pagué 50 bs de comida',
  '2024-01-15'
);
```

---

## 📊 Flow Completo

```
1. Usuario graba audio
   ↓
2. Frontend envía a /api/audio/process
   ↓
3. Backend llama a Groq Whisper (transcribe)
   ↓
4. Backend obtiene country_code del usuario
   ↓
5. Backend llama a extractExpenseWithCountryContext()
   ↓
6. Función obtiene reglas del país en reglas_pais
   ↓
7. Construye contexto local con slang
   ↓
8. Inyecta contexto en la transcripción
   ↓
9. Groq LLM procesa y extrae datos
   ↓
10. Guarda en predicciones_groq
   ↓
11. Usuario confirma o corrige
   ↓
12. Sistema aprende de feedback
```

---

## ✅ Ventajas de este Sistema

1. **Contexto local**: Usa slang y palabras clave del país
2. **Multi-país**: Soporta Bolivia, Argentina, México, Perú, Colombia, Chile
3. **Feedback loop**: Los usuarios confirman predicciones
4. **Mejora continua**: El sistema aprende de correcciones
5. **Fechas relativas**: Detecta "ayer", "hace X días"
6. **Pagos de deuda**: Identifica pagos de deudas específicas
7. **Múltiples transacciones**: Separa transacciones en un solo audio
8. **Flexibilidad**: Crea categorías nuevas si es necesario

---

## 🧪 Testing

Para probar el comportamiento de Groq:

```typescript
// Ejemplo de test
const transcripcion = "Ayer compré pollo por 35 bolivianos";
const countryCode = "BOL";

const resultado = await extractExpenseWithCountryContext(
  transcripcion, 
  countryCode
);

console.log(resultado);
// {
//   monto: 35,
//   categoria: "comida",
//   tipo: "gasto",
//   fechaTexto: "ayer",
//   ...
// }
```

---

## 📚 Referencias

- `src/services/groqService.ts` - Servicio principal de Groq
- `src/lib/countryRules.ts` - Reglas por país desde Supabase
- `src/app/api/audio/process/route.ts` - Endpoint de procesamiento
- `create-feedback-tables.sql` - Tablas de feedback

---

**Última actualización:** Diciembre 2024

