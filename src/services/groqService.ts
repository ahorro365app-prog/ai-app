/* Servicio para procesar texto transcrito usando Groq (API compatible con OpenAI)
   Requiere: NEXT_PUBLIC_GROQ_API_KEY en .env.local
*/

import { logger } from '@/lib/logger';

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

type GroqMultipleResponse = {
  transacciones: GroqTransaction[];
  esMultiple: boolean;
};

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || '';
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
  // Usar zona horaria específica del país del usuario para evitar problemas de UTC
  const today = new Date();
  const countryTime = getCountryDate(userCountryCode);
  const timezone = countryTimezones[userCountryCode] || countryTimezones['BO'];
  
  logger.debug('📅 processRelativeDate llamado con:', dateText);
  logger.debug('📅 País del usuario:', userCountryCode);
  logger.debug('📅 Zona horaria:', timezone);
  logger.debug('📅 Fecha actual UTC:', today.toISOString());
  logger.debug('📅 Fecha actual país:', countryTime.toLocaleDateString('es-ES'));
  logger.debug('📅 Día de la semana actual:', countryTime.toLocaleDateString('es-ES', { weekday: 'long' }));
  
  // Normalizar el texto
  const normalizedText = dateText.toLowerCase().trim();
  
  // Crear fecha en zona horaria del país para evitar problemas de UTC
  const year = countryTime.getFullYear();
  const month = countryTime.getMonth();
  const day = countryTime.getDate();
  
  logger.debug('📅 Componentes de fecha actual:', { year, month, day });
  
  let targetDate: Date;
  
  // NUEVA REGLA: Solo permitir "ayer" o fechas futuras (que se rechazarán después)
  // Si detecta "ayer" o similar → fecha ayer
  // Si no detecta nada → retornar null (se usará fecha de hoy por defecto)
  if (normalizedText.includes('ayer') || normalizedText.includes('el día de ayer') || normalizedText.includes('hace 1 día') || normalizedText.includes('hace un día')) {
    logger.debug('📅 Detectado: ayer');
    // Crear fecha de ayer en zona horaria del país
    targetDate = new Date(year, month, day - 1);
    logger.debug('📅 Fecha de ayer creada:', targetDate.toLocaleDateString('es-ES'));
    logger.debug('📅 Día de la semana de ayer:', targetDate.toLocaleDateString('es-ES', { weekday: 'long' }));
  } else {
    // Si detecta cualquier otra fecha (hace 2 días, hace 3 días, etc.) → rechazar
    // Retornar error indicando que solo se permite ayer
    logger.warn('⚠️ Fecha detectada que no es "ayer":', dateText);
    logger.warn('⚠️ Solo se permiten transacciones para ayer o hoy');
    return { 
      error: 'DATE_NOT_ALLOWED', 
      message: 'Solo se pueden crear transacciones para ayer o hoy. Si no mencionas una fecha, se usará la fecha de hoy.', 
      daysDiff: 0 
    };
  }
  
  // Verificar que la fecha calculada sea solo ayer (1 día atrás)
  const todayCountry = new Date(year, month, day);
  const daysDiff = Math.floor((todayCountry.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
  logger.debug('📅 Diferencia en días:', daysDiff);
  
  // Solo permitir ayer (1 día atrás) o hoy (0 días)
  if (daysDiff > 1) {
    logger.error('❌ Fecha más antigua que ayer, no válida');
    logger.error('❌ Fecha solicitada:', targetDate.toLocaleDateString('es-ES'));
    logger.error('❌ Fecha actual:', todayCountry.toLocaleDateString('es-ES'));
    logger.error('❌ Días de diferencia:', daysDiff);
    return { 
      error: 'DATE_TOO_OLD', 
      message: 'Solo se pueden crear transacciones para ayer o hoy', 
      daysDiff 
    };
  }
  
  // Formatear como YYYY-MM-DD en zona horaria del país
  const result = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
  logger.debug('✅ Fecha calculada:', result);
  logger.debug('✅ Fecha calculada país:', targetDate.toLocaleDateString('es-ES'));
  logger.debug('✅ Día de la semana calculado:', targetDate.toLocaleDateString('es-ES', { weekday: 'long' }));
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

    // Timeout de 8 segundos para prevenir requests colgados
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos

    try {
      const response = await fetch(GROQ_ENDPOINT, {
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
        }),
        signal: controller.signal // Agregar signal para timeout
      });

      clearTimeout(timeoutId);

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
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        logger.error('❌ Request timeout (8s) al procesar texto con Groq');
        throw new Error('Request timeout después de 8s');
      }
      throw fetchError;
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

ANTES DE PROCESAR CUALQUIER TEXTO, DEBES BUSCAR PALABRAS DE FECHA.

PALABRAS DE FECHA QUE DEBES BUSCAR:

FECHAS RELATIVAS:
- "ayer" → SIEMPRE incluir fechaTexto: "ayer"
- "el día de ayer" → SIEMPRE incluir fechaTexto: "ayer"
- "hace 1 día" → SIEMPRE incluir fechaTexto: "hace 1 día"
- "hace 2 días" → SIEMPRE incluir fechaTexto: "hace 2 días"
- "hace 3 días" → SIEMPRE incluir fechaTexto: "hace 3 días"
- "hace una semana" → SIEMPRE incluir fechaTexto: "hace una semana"

FECHAS ESPECÍFICAS:
- "martes 14 de octubre" → SIEMPRE incluir fechaTexto: "martes 14 de octubre"
- "lunes 15 de octubre" → SIEMPRE incluir fechaTexto: "lunes 15 de octubre"
- "viernes 18 de octubre" → SIEMPRE incluir fechaTexto: "viernes 18 de octubre"
- "el día martes" → SIEMPRE incluir fechaTexto: "el día martes"
- "el lunes pasado" → SIEMPRE incluir fechaTexto: "el lunes pasado"

EJEMPLOS OBLIGATORIOS:
- "Ayer pagué 140 bolivianos" → DEBE incluir fechaTexto: "ayer"
- "El día martes 14 de octubre pagué internet" → DEBE incluir fechaTexto: "martes 14 de octubre"
- "El lunes pasado compré comida" → DEBE incluir fechaTexto: "el lunes pasado"
- "Hace 2 días compré comida" → DEBE incluir fechaTexto: "hace 2 días"

REGLAS ESTRICTAS PARA FECHAS:
1. SIEMPRE busca las palabras: "ayer", "hace", "días", "semana", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo", "octubre", "noviembre", "diciembre"
2. Si encuentras CUALQUIERA de estas palabras, incluye fechaTexto
3. NO calcules fechas exactas, solo extrae el texto completo de la fecha
4. Si NO hay palabras de fecha, NO incluyas fechaTexto

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

TIPOS DE TRANSACCIÓN:
- gasto: cuando se gasta dinero (comprar, pagar, gastar)
- ingreso: cuando se recibe dinero (vender, cobrar, recibir)

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

    // Timeout de 8 segundos para prevenir requests colgados
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos

    try {
      const response = await fetch(GROQ_ENDPOINT, {
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
        }),
        signal: controller.signal // Agregar signal para timeout
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      logger.debug('🤖 Groq API response recibida:', data);
      const content = data?.choices?.[0]?.message?.content?.trim();
      logger.debug('🤖 Groq content extraído:', content);
      if (!content) {
        logger.error('❌ No hay contenido en la respuesta de Groq');
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
              logger.error('❌ Error de fecha:', fechaCalculada.message);
              logger.error('❌ Días de diferencia:', fechaCalculada.daysDiff);
              // Marcar la transacción con error de fecha
              (transaction as any).fechaError = fechaCalculada;
            } else {
              logger.error('❌ No se pudo calcular la fecha');
            }
          } else {
            logger.debug('📅 No hay fechaTexto en la transacción');
            logger.debug('📅 Campos disponibles:', Object.keys(transaction));
            logger.debug('📅 Contenido completo de la transacción:', JSON.stringify(transaction, null, 2));
          }
        });
      } else {
        logger.error('❌ No hay transacciones para procesar');
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
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        logger.error('❌ Request timeout (8s) al procesar múltiples transacciones con Groq');
        throw new Error('Request timeout después de 8s');
      }
      throw fetchError;
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


