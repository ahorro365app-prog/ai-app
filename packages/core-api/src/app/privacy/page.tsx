import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad - Ahorro365',
  description: 'Política de privacidad de Ahorro365',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Política de Privacidad</h1>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-sm text-gray-500 mb-6">
            <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Información que Recopilamos</h2>
            <p className="text-gray-700 mb-4">
              Ahorro365 recopila la siguiente información para proporcionar y mejorar nuestros servicios:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Información de cuenta:</strong> Número de teléfono, email (opcional)</li>
              <li><strong>Datos financieros:</strong> Transacciones, gastos, ingresos, categorías</li>
              <li><strong>Datos de uso:</strong> Interacciones con la aplicación, preferencias</li>
              <li><strong>Datos de WhatsApp:</strong> Mensajes de audio y texto para procesar transacciones</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Cómo Usamos tu Información</h2>
            <p className="text-gray-700 mb-4">Utilizamos tu información para:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Procesar y registrar tus transacciones financieras</li>
              <li>Proporcionar análisis y reportes de tus gastos</li>
              <li>Mejorar nuestros servicios y funcionalidades</li>
              <li>Enviar códigos de verificación cuando sea necesario</li>
              <li>Responder a tus consultas y solicitudes de soporte</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Compartir Información</h2>
            <p className="text-gray-700 mb-4">
              No vendemos, alquilamos ni compartimos tu información personal con terceros, excepto:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Proveedores de servicios que nos ayudan a operar (hosting, bases de datos)</li>
              <li>Cuando sea requerido por ley o autoridades competentes</li>
              <li>Con tu consentimiento explícito</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Seguridad de los Datos</h2>
            <p className="text-gray-700 mb-4">
              Implementamos medidas de seguridad técnicas y organizativas para proteger tu información:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Cifrado de datos en tránsito y en reposo</li>
              <li>Autenticación segura</li>
              <li>Acceso restringido a información personal</li>
              <li>Monitoreo continuo de seguridad</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Tus Derechos</h2>
            <p className="text-gray-700 mb-4">Tienes derecho a:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Acceder a tu información personal</li>
              <li>Corregir información incorrecta</li>
              <li>Solicitar la eliminación de tus datos</li>
              <li>Exportar tus datos</li>
              <li>Retirar tu consentimiento en cualquier momento</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Retención de Datos</h2>
            <p className="text-gray-700 mb-4">
              Conservamos tu información mientras tu cuenta esté activa o según sea necesario para proporcionar nuestros servicios. 
              Puedes solicitar la eliminación de tus datos en cualquier momento.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Cambios a esta Política</h2>
            <p className="text-gray-700 mb-4">
              Podemos actualizar esta política de privacidad ocasionalmente. Te notificaremos de cambios significativos 
              mediante la aplicación o por email.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Contacto</h2>
            <p className="text-gray-700 mb-4">
              Si tienes preguntas sobre esta política de privacidad o sobre cómo manejamos tu información, 
              puedes contactarnos en:
            </p>
            <p className="text-gray-700">
              <strong>Email:</strong> ahorro365app@gmail.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

