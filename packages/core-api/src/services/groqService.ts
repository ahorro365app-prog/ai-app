/* Servicio para procesar texto transcrito usando Groq (API compatible con OpenAI)
   Requiere: NEXT_PUBLIC_GROQ_API_KEY en .env.local
*/

import { logger } from '../lib/logger';
import { fetchWithTimeout } from '../lib/fetchWithTimeout';

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
  esPagoDeuda?: boolean; // Nueva propiedad
  nombreDeuda?: string | null; // Nombre de la deuda si es un pago
  fechaTexto?: string | null; // Texto de fecha relativa (ej: "ayer", "hace 2 días")
};

export type GroqMultipleResponse = {
  transacciones: GroqTransaction[];
  esMultiple: boolean;
};

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || '';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';

// Mapeo de países a zonas horarias
const countryTimezones: Record<string, string> = {
  'BO': 'America/La_Paz',      // Bolivia
  'AR': 'America/Argentina/Buenos_Aires', // Argentina
  'BR': 'America/Sao_Paulo',   // Brasil
  'CL': 'America/Santiago',    // Chile
  'CO': 'America/Bogota',      // Colombia
  'EC': 'America/Guayaquil',   // Ecuador
  'PE': 'America/Lima',        // Perú
  'PY': 'America/Asuncion',    // Paraguay
  'UY': 'America/Montevideo',  // Uruguay
  'VE': 'America/Caracas',     // Venezuela
  'MX': 'America/Mexico_City', // México
  'US': 'America/New_York',    // Estados Unidos
  'EU': 'Europe/Berlin',       // Eurozona
};

// Función auxiliar para obtener la fecha actual en zona horaria específica del país
function getCountryDate(countryCode: string = 'BO'): Date {
  const now = new Date();
  const timezone = countryTimezones[countryCode] || countryTimezones['BO']; // Default a Bolivia
  return new Date(now.toLocaleString("en-US", {timeZone: timezone}));
}

// Función para procesar fechas relativas (máximo 7 días atrás)
function processRelativeDate(dateText: string, userCountryCode: string = 'BO'): string | null | { error: string; message: string; daysDiff: number } {
  // ⚠️ RESTRICCIÓN: SOLO se permite "ayer" o "el día de ayer"
  // Todas las demás fechas serán rechazadas
  
  const countryTime = getCountryDate(userCountryCode);
  const timezone = countryTimezones[userCountryCode] || countryTimezones['BO'];
  
  logger.debug('📅 processRelativeDate llamado con:', dateText);
  logger.debug('📅 País del usuario:', userCountryCode);
  logger.debug('📅 Zona horaria:', timezone);
  logger.debug('📅 Fecha actual país:', countryTime.toLocaleDateString('es-ES'));
  
  // Normalizar el texto
  const normalizedText = dateText.toLowerCase().trim();
  
  // Crear fecha en zona horaria del país
  const year = countryTime.getFullYear();
  const month = countryTime.getMonth();
  const day = countryTime.getDate();
  
  logger.debug('📅 Componentes de fecha actual:', { year, month, day });
  
  let targetDate: Date | null = null;
  
  // ⚠️ SOLO procesar "ayer" o "el día de ayer"
  if (normalizedText.includes('ayer') || normalizedText.includes('el día de ayer')) {
    logger.debug('📅 Detectado: ayer (PERMITIDO)');
    // Crear fecha de ayer en zona horaria del país
    targetDate = new Date(year, month, day - 1);
    logger.debug('📅 Fecha de ayer creada:', targetDate.toLocaleDateString('es-ES'));
  } else {
    // Cualquier otra fecha es rechazada
    logger.debug('❌ Fecha rechazada (solo se permite "ayer"):', dateText);
    logger.debug('❌ Fechas como "hace 2 días", "hace una semana", "el lunes pasado", "mañana", etc. NO están permitidas');
    return { 
      error: 'DATE_NOT_ALLOWED', 
      message: 'Solo se pueden crear transacciones para "ayer" o "hoy". Fechas pasadas (más de ayer) o futuras no están permitidas.', 
      daysDiff: -1 
    };
  }
  
  if (!targetDate) {
    logger.debug('❌ No se pudo procesar la fecha:', dateText);
    return { 
      error: 'DATE_NOT_ALLOWED', 
      message: 'Solo se pueden crear transacciones para "ayer" o "hoy".', 
      daysDiff: -1 
    };
  }
  
  // Verificar que la fecha calculada sea exactamente ayer (1 día de diferencia)
  const todayCountry = new Date(year, month, day);
  const daysDiff = Math.floor((todayCountry.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
  logger.debug('📅 Diferencia en días:', daysDiff);
  
  // Solo permitir exactamente 1 día de diferencia (ayer)
  if (daysDiff !== 1) {
    logger.debug('❌ Fecha no es ayer, diferencia:', daysDiff, 'días');
    logger.debug('❌ Fecha solicitada:', targetDate.toLocaleDateString('es-ES'));
    logger.debug('❌ Fecha actual:', todayCountry.toLocaleDateString('es-ES'));
    return { 
      error: 'DATE_NOT_YESTERDAY', 
      message: 'Solo se pueden crear transacciones para "ayer" o "hoy".', 
      daysDiff 
    };
  }
  
  // Formatear como YYYY-MM-DD en zona horaria del país
  const result = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
  logger.debug('✅ Fecha calculada (ayer):', result);
  logger.debug('✅ Fecha calculada país:', targetDate.toLocaleDateString('es-ES'));
  return result;
}

export async function processTextWithGroq(text: string, userCountryCode: string = 'BO'): Promise<GroqExtraction | null> {
  if (!text || !text.trim()) return null;
  if (!GROQ_API_KEY) {
    logger.warn('⚠️ GROQ_API_KEY no configurada. Saltando procesamiento Groq.');
    return null;
  }

  try {
    const systemPrompt = `Eres un asistente experto en finanzas personales que extrae información de transacciones.

MONEDAS SOPORTADAS (reconoce estas monedas y sus variaciones):
- Boliviano (BOB): "bolivianos", "bs", "boliviano", "bolivianos bolivianos"
- Dólar estadounidense (USD): "dólares", "dolares", "usd", "dollar", "dollars", "$"
- Euro (EUR): "euros", "eur", "euro"
- Peso mexicano (MXN): "pesos mexicanos", "pesos", "mxn", "peso mexicano"
- Peso argentino (ARS): "pesos argentinos", "pesos", "ars", "peso argentino"
- Peso chileno (CLP): "pesos chilenos", "pesos", "clp", "peso chileno"
- Sol peruano (PEN): "soles", "pen", "sol peruano", "soles peruanos"
- Peso colombiano (COP): "pesos colombianos", "pesos", "cop", "peso colombiano"

CATEGORÍAS DISPONIBLES (usa estas como referencia, pero puedes crear otras más específicas si es apropiado):
- comida: alimentos, restaurantes, supermercado
- transporte: taxi, bus, gasolina, uber
- educacion: libros, cursos, fotocopias, material escolar
- tecnologia: computadoras, celulares, software
- salud: medicinas, doctores, hospital
- entretenimiento: cine, juegos, deportes
- servicios: luz, agua, internet, telefono
- ropa: vestimenta, zapatos, accesorios
- hogar: muebles, electrodomesticos, limpieza
- otros: cualquier cosa que no encaje en las anteriores

MÉTODOS DE PAGO DISPONIBLES:
- efectivo: pagos en efectivo, dinero en efectivo
- tarjeta: tarjeta de crédito, débito, visa, mastercard
- transferencia: transferencia bancaria, transferencia electrónica
- cheque: cheque, cheque bancario
- crypto: criptomonedas, bitcoin, ethereum
- otro: cualquier otro método no especificado

DETECCIÓN DE FECHAS (MUY IMPORTANTE):
SIEMPRE busca palabras que indiquen fechas pasadas en el texto. Si encuentras alguna, incluye el campo "fechaTexto".

PALABRAS CLAVE PARA FECHAS PASADAS:
- "ayer" → fechaTexto: "ayer"
- "el día de ayer" → fechaTexto: "ayer"  
- "hace 1 día" → fechaTexto: "hace 1 día"
- "hace 2 días" → fechaTexto: "hace 2 días"
- "hace 3 días" → fechaTexto: "hace 3 días"
- "hace una semana" → fechaTexto: "hace una semana"
- "hace dos días" → fechaTexto: "hace 2 días"

EJEMPLOS OBLIGATORIOS:
- "El día de ayer me compré zapatillas" → DEBE incluir fechaTexto: "ayer"
- "Ayer gasté dinero" → DEBE incluir fechaTexto: "ayer"
- "Hace 2 días compré comida" → DEBE incluir fechaTexto: "hace 2 días"

REGLAS ESTRICTAS:
1. SIEMPRE busca palabras de fecha en el texto
2. Si encuentras "ayer", "hace X días", etc., incluye fechaTexto
3. Si NO hay palabras de fecha, NO incluyas fechaTexto
4. NO calcules fechas exactas, solo extrae el texto de fecha

DETECCIÓN DE PAGOS DE DEUDAS:
Si el texto menciona pagos de deudas, préstamos o cuentas específicas, marca esPagoDeuda: true y extrae el nombre de la deuda.
Ejemplos de pagos de deudas:
- "acabo de pagar 500 bs de la deuda de abed nego" → esPagoDeuda: true, nombreDeuda: "abed nego"
- "pagué 200 bolivianos de mi préstamo del banco" → esPagoDeuda: true, nombreDeuda: "préstamo del banco"
- "cancelé 100 bs de mi cuenta de la tienda" → esPagoDeuda: true, nombreDeuda: "cuenta de la tienda"

INSTRUCCIONES IMPORTANTES:
1. Si encuentras MÚLTIPLES transacciones con DIFERENTES categorías, sepáralas
2. Si encuentras una categoría más específica y útil que las predeterminadas, úsala
3. Para fotocopias, libros, cursos → usa "educacion" 
4. Para transporte → usa "transporte"
5. Para comida → usa "comida"
6. Si es algo muy específico, crea una categoría descriptiva (ej: "farmacia", "gimnasio", "barberia")
7. Si no se especifica método de pago, usa "efectivo" por defecto
8. Detecta métodos de pago mencionados en el texto (ej: "pagué con tarjeta", "transferencia", "en efectivo")
9. DETECTA PAGOS DE DEUDAS: Si menciona pagos de deudas específicas, marca esPagoDeuda: true y extrae el nombre
10. RECONOCE TODAS LAS MONEDAS: Detecta cualquier moneda mencionada y extrae el monto correctamente
11. DETECTA FECHAS: Si menciona fechas pasadas o futuras, extrae la fecha y conviértela a formato ISO (YYYY-MM-DD)

EJEMPLOS DE SEPARACIÓN:
- "Compré comida por 20 bolivianos y pagué 5 bolivianos de fotocopias" → 2 transacciones separadas
- "Gasté 15 en transporte y 10 en comida" → 2 transacciones separadas
- "Compré pan por 5 bolivianos, leche por 8 bolivianos y huevos por 12 bolivianos" → 1 transacción (misma categoría)

Devuelve JSON con: transacciones (array), esMultiple (boolean).`;

    const userPrompt = `Analiza esta transacción: "${text}"

Ejemplos de separación de transacciones:
- "Compré comida por 20 bolivianos y pagué 5 bolivianos de fotocopias" → 
  {
    "transacciones": [
      {"monto": 20, "categoria": "comida", "tipo": "gasto", "descripcion": "comida", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null},
      {"monto": 5, "categoria": "educacion", "tipo": "gasto", "descripcion": "fotocopias", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null}
    ],
    "esMultiple": true
  }

- "Compré pan por 5 bolivianos, leche por 8 bolivianos y huevos por 12 bolivianos" →
  {
    "transacciones": [
      {"monto": 25, "categoria": "comida", "tipo": "gasto", "descripcion": "pan, leche y huevos", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null}
    ],
    "esMultiple": false
  }

- "Acabo de pagar 500 bolivianos de la deuda de abed nego" →
  {
    "transacciones": [
      {"monto": 500, "categoria": "otros", "tipo": "gasto", "descripcion": "pago de deuda", "metodoPago": "efectivo", "esPagoDeuda": true, "nombreDeuda": "abed nego"}
    ],
    "esMultiple": false
  }

Ejemplos con diferentes monedas:
- "Gasté 50 dólares en comida" → {"monto": 50, "categoria": "comida", "tipo": "gasto", "descripcion": "comida", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null}
- "Pagué 30 euros de transporte" → {"monto": 30, "categoria": "transporte", "tipo": "gasto", "descripcion": "transporte", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null}
- "Compré ropa por 100 pesos mexicanos" → {"monto": 100, "categoria": "ropa", "tipo": "gasto", "descripcion": "ropa", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null}
- "Ahorré 200 soles para mi meta" → {"monto": 200, "categoria": "otros", "tipo": "ingreso", "descripcion": "ahorro para meta", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null}

Ejemplos con fechas (OBLIGATORIO incluir fechaTexto):
- "El día de ayer me compré zapatillas por 24 bolivianos" → {"monto": 24, "categoria": "ropa", "tipo": "gasto", "descripcion": "zapatillas", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null, "fechaTexto": "ayer"}
- "Ayer gasté 50 bolivianos en comida" → {"monto": 50, "categoria": "comida", "tipo": "gasto", "descripcion": "comida", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null, "fechaTexto": "ayer"}
- "Hace 3 días compré ropa por 100 bs" → {"monto": 100, "categoria": "ropa", "tipo": "gasto", "descripcion": "ropa", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null, "fechaTexto": "hace 3 días"}
- "El lunes pasado pagué 200 bolivianos de fotocopias" → {"monto": 200, "categoria": "educacion", "tipo": "gasto", "descripcion": "fotocopias", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null, "fechaTexto": "hace una semana"}

Ejemplos SIN fechas (NO incluir fechaTexto):
- "Gasté 50 bolivianos en comida" → {"monto": 50, "categoria": "comida", "tipo": "gasto", "descripcion": "comida", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null}
- "Compré ropa por 100 bs" → {"monto": 100, "categoria": "ropa", "tipo": "gasto", "descripcion": "ropa", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null}

Devuelve solo JSON válido:`;

    // Usar fetchWithTimeout para evitar que el request cuelgue indefinidamente
    const response = await fetchWithTimeout(
      GROQ_ENDPOINT,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          temperature: 0.2,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      },
      8000 // 8 segundos timeout
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) return { raw: data } as GroqExtraction;

    // Intentar parsear JSON
    try {
      const parsed: GroqMultipleResponse = JSON.parse(content);
      logger.debug('🤖 Groq result:', parsed);
      
      // Procesar fechas relativas usando nuestra función local
      if (parsed.transacciones.length > 0) {
        parsed.transacciones.forEach(transaction => {
          if (transaction.fechaTexto) {
            const fechaCalculada = processRelativeDate(transaction.fechaTexto, userCountryCode);
            if (fechaCalculada) {
              // Agregar la fecha calculada como 'fecha' para compatibilidad
              (transaction as any).fecha = fechaCalculada;
            }
          }
        });
      }
      
      // Si es múltiple, devolver la primera transacción para compatibilidad
      // TODO: Actualizar el modal para manejar múltiples transacciones
      if (parsed.esMultiple && parsed.transacciones.length > 0) {
        logger.debug('🔄 Detectadas múltiples transacciones:', parsed.transacciones.length);
        return { ...parsed.transacciones[0], raw: data } as GroqExtraction; // Temporal: devolver solo la primera
      } else if (parsed.transacciones.length > 0) {
        return { ...parsed.transacciones[0], raw: data } as GroqExtraction;
      }
      return { raw: data } as GroqExtraction;
    } catch {
      // Si no es JSON puro, intentar extraer bloque JSON
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed: GroqMultipleResponse = JSON.parse(match[0]);
          logger.debug('🤖 Groq result (extracted):', parsed);
          
          if (parsed.esMultiple && parsed.transacciones.length > 0) {
            logger.debug('🔄 Detectadas múltiples transacciones (extracted):', parsed.transacciones.length);
            return { ...parsed.transacciones[0], raw: data } as GroqExtraction;
          } else if (parsed.transacciones.length > 0) {
            return { ...parsed.transacciones[0], raw: data } as GroqExtraction;
          }
          return { raw: data } as GroqExtraction;
        } catch {
          return { raw: data } as GroqExtraction;
        }
      }
      return { raw: data } as GroqExtraction;
    }
  } catch (err) {
    logger.error('❌ Error procesando texto con Groq:', err);
    return null;
  }
}

// Nueva función para obtener todas las transacciones
async function processTranscriptionMultiple(text: string, userCountryCode: string = 'BO'): Promise<GroqMultipleResponse | null> {
  if (!GROQ_API_KEY) {
    logger.warn('⚠️ GROQ_API_KEY no configurada. Saltando procesamiento Groq.');
    return null;
  }

  try {
    const systemPrompt = `🚨 INSTRUCCIÓN CRÍTICA DE FECHAS - LEE ESTO PRIMERO 🚨

⚠️ RESTRICCIONES ESTRICTAS DE FECHAS - MUY IMPORTANTE ⚠️

SOLO SE PERMITEN ESTAS FECHAS:
✅ "ayer" o "el día de ayer" → fechaTexto: "ayer"
✅ Sin fecha mencionada → NO incluir fechaTexto (será "hoy" por defecto)

❌ FECHAS PROHIBIDAS (NO PERMITIDAS):
❌ "hace 2 días", "hace 3 días", "hace una semana" → NO PERMITIDO (más de ayer)
❌ "mañana", "pasado mañana", "el próximo lunes" → NO PERMITIDO (fechas futuras)
❌ "martes 14 de octubre", "el lunes pasado" → NO PERMITIDO (fechas específicas pasadas que no sean ayer)
❌ Cualquier fecha futura → NO PERMITIDO

REGLAS ESTRICTAS PARA FECHAS:
1. SOLO busca la palabra "ayer" o "el día de ayer"
2. Si encuentras "ayer" o "el día de ayer" → incluye fechaTexto: "ayer"
3. Si encuentras "hace 2 días", "hace 3 días", "hace una semana", "el lunes pasado", "martes 14", etc. → NO incluyas fechaTexto (la transacción será rechazada después)
4. Si encuentras "mañana", "pasado mañana", "el próximo lunes", etc. → NO incluyas fechaTexto (la transacción será rechazada después)
5. Si NO hay palabras de fecha → NO incluyas fechaTexto (será "hoy" por defecto)
6. NO calcules fechas exactas, solo extrae el texto "ayer" si está presente

EJEMPLOS CORRECTOS:
- "Ayer pagué 140 bolivianos" → fechaTexto: "ayer" ✅
- "El día de ayer compré comida" → fechaTexto: "ayer" ✅
- "Gasté 50 bolivianos en comida" → NO incluir fechaTexto (será "hoy") ✅

EJEMPLOS INCORRECTOS (NO incluir fechaTexto, la transacción será rechazada):
- "Hace 2 días compré comida" → NO incluir fechaTexto ❌
- "Hace una semana pagué internet" → NO incluir fechaTexto ❌
- "El lunes pasado compré ropa" → NO incluir fechaTexto ❌
- "Mañana pagaré 100 bs" → NO incluir fechaTexto ❌

---

Eres un asistente experto en finanzas personales que extrae información de transacciones.

MONEDAS SOPORTADAS (reconoce estas monedas y sus variaciones):
- Boliviano (BOB): "bolivianos", "bs", "boliviano", "bolivianos bolivianos"
- Dólar estadounidense (USD): "dólares", "dolares", "usd", "dollar", "dollars", "$"
- Euro (EUR): "euros", "eur", "euro"
- Peso mexicano (MXN): "pesos mexicanos", "pesos", "mxn", "peso mexicano"
- Peso argentino (ARS): "pesos argentinos", "pesos", "ars", "peso argentino"
- Peso chileno (CLP): "pesos chilenos", "pesos", "clp", "peso chileno"
- Sol peruano (PEN): "soles", "pen", "sol peruano", "soles peruanos"
- Peso colombiano (COP): "pesos colombianos", "pesos", "cop", "peso colombiano"

CATEGORÍAS DISPONIBLES (usa estas como referencia, pero puedes crear otras más específicas si es apropiado):
- comida: alimentos, restaurantes, supermercado
- transporte: taxi, bus, gasolina, uber
- educacion: libros, cursos, fotocopias, material escolar
- tecnologia: computadoras, celulares, software
- salud: medicinas, doctores, hospital
- entretenimiento: cine, juegos, deportes
- servicios: luz, agua, internet, telefono
- ropa: vestimenta, zapatos, accesorios
- hogar: muebles, electrodomesticos, limpieza
- otros: cualquier cosa que no encaje en las anteriores

TIPOS DE TRANSACCIÓN (REGLA CRÍTICA - LEE CON ATENCIÓN):
REGLA PRINCIPAL: Por defecto, TODO es GASTO a menos que explícitamente mencione recibir dinero.

- gasto (POR DEFECTO): Cualquier transacción que NO mencione recibir dinero
  * Ejemplos de GASTO: "50 taxi", "30 comida", "20 gasolina", "10 de zanahoria", "30 de alverja", "50 de zapallo"
  * Si NO tiene palabras como "me pagaron", "gané", "vendí", "cobré", "recibí" → ES GASTO
  * Productos, comida, servicios sin verbo explícito → ES GASTO
  * "Compré", "pagué", "gasté" → ES GASTO
  
- ingreso (SOLO si menciona recibir dinero explícitamente):
  * Palabras clave que indican INGRESO: "me pagaron", "me pagaron", "gané", "vendí", "cobré", "recibí", "ingresé"
  * Ejemplos de INGRESO: "me pagaron 350 de cardio plus", "Vendí 499 bs de FLEXS cap", "gané 100 bs"
  * Si NO tiene estas palabras clave → NO es ingreso, es GASTO

MÉTODOS DE PAGO DISPONIBLES:
- efectivo: dinero en efectivo, billetes, monedas
- tarjeta: tarjeta de crédito, débito, visa, mastercard
- transferencia: transferencia bancaria, pago móvil
- cheque: cheque, cheque bancario
- crypto: criptomonedas, bitcoin, ethereum
- otro: cualquier otro método no especificado

DETECCIÓN DE PAGOS DE DEUDAS:
Si el texto menciona pagos de deudas, préstamos o cuentas específicas, marca esPagoDeuda: true y extrae el nombre de la deuda.
Ejemplos de pagos de deudas:
- "acabo de pagar 500 bs de la deuda de abed nego" → esPagoDeuda: true, nombreDeuda: "abed nego"
- "pagué 200 bolivianos de mi préstamo del banco" → esPagoDeuda: true, nombreDeuda: "préstamo del banco"
- "cancelé 100 bs de mi cuenta de la tienda" → esPagoDeuda: true, nombreDeuda: "cuenta de la tienda"

INSTRUCCIONES IMPORTANTES:
1. Extrae el monto exacto mencionado
2. Identifica la categoría más apropiada
3. Determina si es gasto o ingreso
4. Extrae la descripción del producto/servicio
5. Identifica el método de pago (por defecto "efectivo" si no se especifica)
6. RECONOCE TODAS LAS MONEDAS: Detecta cualquier moneda mencionada y extrae el monto correctamente
7. SEPARA TRANSACCIONES: Si hay múltiples compras con diferentes categorías, sepáralas en transacciones individuales
8. DETECTA PAGOS DE DEUDA: Si menciona pagar una deuda específica, marca esPagoDeuda: true y extrae el nombre de la deuda

FORMATO DE RESPUESTA:
Devuelve SOLO un JSON válido con la siguiente estructura. NO incluyas texto explicativo, análisis, o comentarios. SOLO el JSON.

{
  "transacciones": [
    {
      "monto": número,
      "categoria": "string",
      "tipo": "gasto" o "ingreso",
      "descripcion": "string",
      "metodoPago": "string",
      "esPagoDeuda": boolean,
      "nombreDeuda": "string" o null,
      "fechaTexto": "string" o null
    }
  ],
  "esMultiple": boolean
}

IMPORTANTE: Responde ÚNICAMENTE con el JSON. No agregues texto antes, después, o explicaciones.`;

    const userPrompt = `Analiza esta transacción: "${text}"

IMPORTANTE: Responde ÚNICAMENTE con el JSON. No agregues texto explicativo, análisis, o comentarios.

REGLA CRÍTICA DE CLASIFICACIÓN:
- Por defecto, TODO es "gasto" a menos que explícitamente mencione recibir dinero
- Palabras que indican INGRESO: "me pagaron", "gané", "vendí", "cobré", "recibí"
- Si NO tiene estas palabras → ES "gasto"

⚠️ REGLA CRÍTICA DE FECHAS:
- SOLO se permite "ayer" o "el día de ayer" → incluir fechaTexto: "ayer"
- Si NO hay mención de fecha → NO incluir fechaTexto (será "hoy" por defecto)
- Si menciona "hace 2 días", "hace 3 días", "hace una semana", "el lunes pasado", "martes 14", etc. → NO incluir fechaTexto (la transacción será rechazada)
- Si menciona "mañana", "pasado mañana", "el próximo lunes", etc. → NO incluir fechaTexto (la transacción será rechazada)

Ejemplos de separación de transacciones:
- "50 taxi\n30 comida\n20 gasolina\nVendí 499 bs de FLEXS cap" → 
  {
    "transacciones": [
      {"monto": 50, "categoria": "transporte", "tipo": "gasto", "descripcion": "taxi", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null},
      {"monto": 30, "categoria": "comida", "tipo": "gasto", "descripcion": "comida", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null},
      {"monto": 20, "categoria": "transporte", "tipo": "gasto", "descripcion": "gasolina", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null},
      {"monto": 499, "categoria": "otros", "tipo": "ingreso", "descripcion": "FLEXS cap", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null}
    ],
    "esMultiple": true
  }

- "Compré comida por 20 bolivianos y pagué 5 bolivianos de fotocopias" → 
  {
    "transacciones": [
      {"monto": 20, "categoria": "comida", "tipo": "gasto", "descripcion": "comida", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null},
      {"monto": 5, "categoria": "educacion", "tipo": "gasto", "descripcion": "fotocopias", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null}
    ],
    "esMultiple": true
  }

- "Compré pan por 5 bolivianos, leche por 8 bolivianos y huevos por 12 bolivianos" →
  {
    "transacciones": [
      {"monto": 25, "categoria": "comida", "tipo": "gasto", "descripcion": "pan, leche y huevos", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null}
    ],
    "esMultiple": false
  }

- "Acabo de pagar 500 bolivianos de la deuda de abed nego" →
  {
    "transacciones": [
      {"monto": 500, "categoria": "otros", "tipo": "gasto", "descripcion": "pago de deuda", "metodoPago": "efectivo", "esPagoDeuda": true, "nombreDeuda": "abed nego"}
    ],
    "esMultiple": false
  }

Ejemplos con diferentes monedas:
- "Gasté 50 dólares en comida" → {"monto": 50, "categoria": "comida", "tipo": "gasto", "descripcion": "comida", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null}
- "Pagué 30 euros de transporte" → {"monto": 30, "categoria": "transporte", "tipo": "gasto", "descripcion": "transporte", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null}
- "Compré ropa por 100 pesos mexicanos" → {"monto": 100, "categoria": "ropa", "tipo": "gasto", "descripcion": "ropa", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null}
- "Ahorré 200 soles para mi meta" → {"monto": 200, "categoria": "otros", "tipo": "ingreso", "descripcion": "ahorro para meta", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null}

Ejemplos con fechas (SOLO "ayer" está permitido):
- "El día de ayer me compré zapatillas por 24 bolivianos" → {"monto": 24, "categoria": "ropa", "tipo": "gasto", "descripcion": "zapatillas", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null, "fechaTexto": "ayer"}
- "Ayer gasté 50 bolivianos en comida" → {"monto": 50, "categoria": "comida", "tipo": "gasto", "descripcion": "comida", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null, "fechaTexto": "ayer"}

⚠️ IMPORTANTE - FECHAS PROHIBIDAS (NO incluir fechaTexto):
Si el texto menciona "hace 2 días", "hace 3 días", "hace una semana", "el lunes pasado", "martes 14 de octubre", etc. → NO incluyas fechaTexto. La transacción será rechazada por el sistema.
Si el texto menciona "mañana", "pasado mañana", "el próximo lunes", etc. → NO incluyas fechaTexto. La transacción será rechazada por el sistema.

Ejemplos SIN fechas (será "hoy" por defecto):
- "Gasté 50 bolivianos en comida" → {"monto": 50, "categoria": "comida", "tipo": "gasto", "descripcion": "comida", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null}
- "Compré ropa por 100 bs" → {"monto": 100, "categoria": "ropa", "tipo": "gasto", "descripcion": "ropa", "metodoPago": "efectivo", "esPagoDeuda": false, "nombreDeuda": null}

Devuelve solo JSON válido:`;

    // Usar fetchWithTimeout para evitar que el request cuelgue indefinidamente
    const response = await fetchWithTimeout(
      GROQ_ENDPOINT,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      },
      8000 // 8 segundos timeout
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    logger.debug('🤖 Groq API response recibida:', data);
    const content = data?.choices?.[0]?.message?.content?.trim();
    logger.debug('🤖 Groq content extraído:', content);
    if (!content) {
      logger.debug('❌ No hay contenido en la respuesta de Groq');
      return null;
    }

    // Intentar parsear JSON
    try {
      logger.debug('🔄 Intentando parsear JSON de Groq...');
      const parsed: GroqMultipleResponse = JSON.parse(content);
      logger.debug('🤖 Groq multiple result:', parsed);
      logger.debug('🤖 Groq raw response:', JSON.stringify(parsed, null, 2));
      
      // Procesar fechas relativas usando nuestra función local
      logger.debug('🔄 Iniciando procesamiento de fechas...');
      logger.debug('📊 Total transacciones a procesar:', parsed.transacciones.length);
      
      if (parsed.transacciones.length > 0) {
        parsed.transacciones.forEach((transaction, index) => {
          logger.debug(`📅 Procesando transacción ${index + 1}:`, transaction);
          logger.debug(`📅 ¿Tiene fechaTexto?`, !!transaction.fechaTexto);
          logger.debug(`📅 fechaTexto valor:`, transaction.fechaTexto);
          logger.debug(`📅 Tipo de fechaTexto:`, typeof transaction.fechaTexto);
          
          if (transaction.fechaTexto) {
            logger.debug('📅 FechaTexto detectada:', transaction.fechaTexto);
            logger.debug('🔄 Llamando a processRelativeDate...');
            const fechaCalculada = processRelativeDate(transaction.fechaTexto, userCountryCode);
            logger.debug('📅 Resultado de processRelativeDate:', fechaCalculada);
            
            if (typeof fechaCalculada === 'string') {
              logger.debug('📅 Fecha calculada:', fechaCalculada);
              // Agregar la fecha calculada como 'fecha' para compatibilidad
              (transaction as any).fecha = fechaCalculada;
              logger.debug('📅 Transacción actualizada:', transaction);
              logger.debug('📅 Verificando fecha en transacción:', (transaction as any).fecha);
            } else if (fechaCalculada && typeof fechaCalculada === 'object' && 'error' in fechaCalculada) {
              logger.debug('❌ Error de fecha:', fechaCalculada.message);
              logger.debug('❌ Días de diferencia:', fechaCalculada.daysDiff);
              // Marcar la transacción con error de fecha
              (transaction as any).fechaError = fechaCalculada;
            } else {
              logger.debug('❌ No se pudo calcular la fecha');
            }
          } else {
            logger.debug('📅 No hay fechaTexto en la transacción');
            logger.debug('📅 Campos disponibles:', Object.keys(transaction));
            logger.debug('📅 Contenido completo de la transacción:', JSON.stringify(transaction, null, 2));
          }
        });
      } else {
        logger.debug('❌ No hay transacciones para procesar');
      }
      
      logger.debug('✅ Procesamiento de fechas completado');
      logger.debug('📊 Transacciones finales:', parsed.transacciones);
      
      return parsed;
    } catch {
      // Si no es JSON puro, intentar extraer bloque JSON
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed: GroqMultipleResponse = JSON.parse(match[0]);
          logger.debug('🤖 Groq multiple result (extracted):', parsed);
          return parsed;
        } catch {
          return null;
        }
      }
      return null;
    }
  } catch (err) {
    logger.error('❌ Error procesando texto con Groq:', err);
    return null;
  }
}

// Extensión: Procesar con contexto por país desde Supabase
export async function extractExpenseWithCountryContext(
  transcripcion: string,
  countryCode: string
): Promise<GroqExtraction | null> {
  try {
    // Importar servicios dinámicamente (solo en servidor)
    const { getCountryRules } = await import('@/lib/countryRules');
    
    // 1. Obtener reglas del país
    const rules = await getCountryRules(countryCode);
    logger.debug(`🌍 Using rules for: ${rules.country_name}`);

    // 2. Construir contexto local con slang y palabras clave
    let contextoLocal = '';
    if (rules.ejemplos && rules.ejemplos.length > 0) {
      contextoLocal = rules.ejemplos
        .map(regla => {
          const slangKeys = Object.keys(regla.slang || {});
          const palabrasKeys = Object.keys(regla.palabras_clave || {});
          
          if (slangKeys.length > 0 || palabrasKeys.length > 0) {
            return `En ${countryCode}, categoría ${regla.categoria}: ${palabrasKeys.join(', ')}. ${slangKeys.map(k => `${k} = ${regla.slang[k]}`).join('; ')}`;
          }
          return '';
        })
        .filter(Boolean)
        .join('\n');
    }

    // 3. Si hay contexto local, agregarlo al principio de la transcripción
    let transcripcionConContexto = transcripcion;
    if (contextoLocal) {
      logger.debug('🌍 Aplicando contexto local:', contextoLocal);
      transcripcionConContexto = `Contexto local: ${contextoLocal}\n\nTranscripción: ${transcripcion}`;
    }

    // 4. Usar el servicio Groq existente con el contexto adicional
    const resultado = await processTextWithGroq(transcripcionConContexto, countryCode);

    // 5. Devolver resultado (el formato ya es el mismo que usa la app)
    return resultado;

  } catch (error: any) {
    logger.error('Error in extractExpenseWithCountryContext:', error);
    
    // Fallback: usar función base sin contexto
    return processTextWithGroq(transcripcion, countryCode);
  }
}

export const groqService = {
  processTranscription: processTextWithGroq,
  processTranscriptionMultiple: processTranscriptionMultiple,
  extractExpenseWithCountryContext: extractExpenseWithCountryContext
};


