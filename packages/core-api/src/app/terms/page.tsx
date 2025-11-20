import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos del Servicio - Ahorro365',
  description: 'Términos y condiciones de uso de Ahorro365',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Términos del Servicio</h1>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-sm text-gray-500 mb-6">
            <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Aceptación de los Términos</h2>
            <p className="text-gray-700 mb-4">
              Al acceder y usar Ahorro365, aceptas estar sujeto a estos términos y condiciones. 
              Si no estás de acuerdo con alguna parte de estos términos, no debes usar nuestro servicio.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Descripción del Servicio</h2>
            <p className="text-gray-700 mb-4">
              Ahorro365 es una aplicación de gestión de finanzas personales que te permite:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Registrar y categorizar tus transacciones financieras</li>
              <li>Enviar transacciones por WhatsApp (audio o texto)</li>
              <li>Analizar tus gastos e ingresos</li>
              <li>Establecer metas de ahorro</li>
              <li>Gestionar deudas y pagos</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Uso Aceptable</h2>
            <p className="text-gray-700 mb-4">Al usar Ahorro365, te comprometes a:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Usar el servicio solo para fines personales y legales</li>
              <li>Proporcionar información precisa y actualizada</li>
              <li>No intentar acceder a cuentas de otros usuarios</li>
              <li>No usar el servicio para actividades fraudulentas o ilegales</li>
              <li>Respetar los límites de uso del servicio</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Cuentas de Usuario</h2>
            <p className="text-gray-700 mb-4">
              Eres responsable de:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Mantener la confidencialidad de tu cuenta</li>
              <li>Todas las actividades que ocurran bajo tu cuenta</li>
              <li>Notificarnos inmediatamente de cualquier uso no autorizado</li>
              <li>Proporcionar información precisa al registrarte</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Límites del Servicio</h2>
            <p className="text-gray-700 mb-4">
              Ahorro365 tiene los siguientes límites según tu plan:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Plan Free:</strong> Funcionalidades básicas</li>
              <li><strong>Plan Smart:</strong> Funcionalidades avanzadas</li>
              <li><strong>Plan Pro:</strong> Todas las funcionalidades</li>
              <li>Mensajes de WhatsApp: máximo 100 caracteres (texto) o 15 segundos (audio)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Propiedad Intelectual</h2>
            <p className="text-gray-700 mb-4">
              Todo el contenido de Ahorro365, incluyendo diseño, código, logos y marcas, es propiedad de Ahorro365 
              o sus licenciantes. No puedes copiar, modificar o distribuir nuestro contenido sin autorización.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Limitación de Responsabilidad</h2>
            <p className="text-gray-700 mb-4">
              Ahorro365 se proporciona "tal cual" sin garantías de ningún tipo. No garantizamos:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Que el servicio esté siempre disponible o libre de errores</li>
              <li>La exactitud de los análisis o reportes</li>
              <li>Que el servicio cumpla con todos tus requisitos específicos</li>
            </ul>
            <p className="text-gray-700 mt-4">
              No seremos responsables de daños indirectos, incidentales o consecuentes derivados del uso del servicio.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Modificaciones del Servicio</h2>
            <p className="text-gray-700 mb-4">
              Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto del servicio 
              en cualquier momento, con o sin previo aviso.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Terminación</h2>
            <p className="text-gray-700 mb-4">
              Podemos terminar o suspender tu cuenta inmediatamente, sin previo aviso, si violas estos términos 
              o realizas actividades fraudulentas.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Ley Aplicable</h2>
            <p className="text-gray-700 mb-4">
              Estos términos se rigen por las leyes de Bolivia. Cualquier disputa será resuelta en los tribunales 
              competentes de Bolivia.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. Contacto</h2>
            <p className="text-gray-700 mb-4">
              Si tienes preguntas sobre estos términos, puedes contactarnos en:
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

