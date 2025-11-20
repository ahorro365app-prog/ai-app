import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Eliminación de Datos - Ahorro365',
  description: 'Instrucciones para eliminar tus datos de Ahorro365',
};

export default function DeleteDataPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Eliminación de Datos de Usuario</h1>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-sm text-gray-500 mb-6">
            <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Cómo Eliminar tus Datos</h2>
            <p className="text-gray-700 mb-4">
              Tienes derecho a solicitar la eliminación de todos tus datos personales de Ahorro365. 
              Puedes hacerlo de las siguientes maneras:
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Opción 1: Desde la Aplicación</h2>
            <ol className="list-decimal pl-6 text-gray-700 space-y-2">
              <li>Abre la aplicación Ahorro365</li>
              <li>Ve a tu perfil o configuración</li>
              <li>Busca la opción "Eliminar cuenta" o "Eliminar datos"</li>
              <li>Sigue las instrucciones para confirmar la eliminación</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Opción 2: Solicitud por Email</h2>
            <p className="text-gray-700 mb-4">
              Puedes enviar una solicitud de eliminación de datos a:
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Email:</strong> ahorro365app@gmail.com
            </p>
            <p className="text-gray-700 mb-4">
              Incluye en tu solicitud:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Tu número de teléfono registrado</li>
              <li>Tu email (si lo proporcionaste)</li>
              <li>Confirmación de que deseas eliminar todos tus datos</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">¿Qué Datos se Eliminan?</h2>
            <p className="text-gray-700 mb-4">
              Al solicitar la eliminación, se eliminarán permanentemente:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Tu cuenta de usuario</li>
              <li>Todas tus transacciones financieras</li>
              <li>Tus metas y objetivos de ahorro</li>
              <li>Tus deudas registradas</li>
              <li>Tus preferencias y configuraciones</li>
              <li>Historial de mensajes de WhatsApp procesados</li>
              <li>Cualquier otra información personal asociada a tu cuenta</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Tiempo de Procesamiento</h2>
            <p className="text-gray-700 mb-4">
              Procesaremos tu solicitud de eliminación dentro de <strong>30 días hábiles</strong> desde la recepción. 
              Te notificaremos por email cuando la eliminación se haya completado.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Datos que NO se Eliminan</h2>
            <p className="text-gray-700 mb-4">
              Algunos datos pueden conservarse por razones legales o técnicas:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Registros de transacciones financieras requeridos por ley (si aplica)</li>
              <li>Datos anonimizados para análisis agregados</li>
              <li>Logs de seguridad y auditoría (por períodos limitados)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Exportar Datos Antes de Eliminar</h2>
            <p className="text-gray-700 mb-4">
              Antes de eliminar tu cuenta, puedes exportar tus datos:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Desde la aplicación, ve a tu perfil</li>
              <li>Busca la opción "Exportar datos"</li>
              <li>Recibirás un archivo con todas tus transacciones y datos</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contacto</h2>
            <p className="text-gray-700 mb-4">
              Si tienes preguntas sobre la eliminación de datos o necesitas ayuda, contacta a:
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

