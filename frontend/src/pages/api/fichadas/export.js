import { authenticateToken } from '@/lib/auth';
import { Fichada } from '@/lib/models/Fichada';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    // Verificar autenticación y rol de admin
    const auth = authenticateToken(req);
    if (auth.error || auth.user.rol !== 'admin') {
        return res.status(401).json({ error: 'No autorizado' });
    }

    try {
        const { startDate, endDate } = req.query;

        // Obtener datos
        const fichadas = await Fichada.getExportData({ startDate, endDate });

        // Generar CSV
        const header = ['ID', 'Fecha y Hora', 'Tipo', 'DJ', 'Salón', 'Comentario'];

        // Función helper para escapar campos CSV
        const escapeCsv = (field) => {
            if (field === null || field === undefined) return '';
            const stringField = String(field);
            if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                return `"${stringField.replace(/"/g, '""')}"`;
            }
            return stringField;
        };

        const csvRows = fichadas.map(row => {
            const fecha = new Date(row.registrado_en).toLocaleString('es-AR');
            return [
                row.id,
                fecha,
                row.tipo === 'ingreso' ? 'INGRESÓ' : 'SALIÓ',
                row.dj_nombre,
                row.salon_nombre || 'Sin Salón',
                row.comentario
            ].map(escapeCsv).join(',');
        });

        const csvContent = [header.join(','), ...csvRows].join('\n');

        // Configurar headers para descarga
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=reporte_fichadas_${new Date().toISOString().slice(0, 10)}.csv`);

        return res.status(200).send(csvContent);

    } catch (error) {
        console.error('Error exportando fichadas:', error);
        return res.status(500).json({ error: 'Error al exportar datos' });
    }
}
