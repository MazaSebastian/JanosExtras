import { useState } from 'react';
import { adicionalesTecnicaAPI, salonesAPI } from '@/services/api';
import { format } from 'date-fns';
import { LoadingButton } from '@/components/Loading';
import styles from '@/styles/AdicionalesTecnica.module.css';

export default function AdicionalesTecnicaAdmin() {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setUploadError('Por favor, selecciona un archivo PDF');
        setSelectedFile(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('El archivo no debe exceder 10MB');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Por favor, selecciona un archivo PDF');
      return;
    }

    try {
      setUploading(true);
      setUploadError('');
      setUploadSuccess(null);

      const formData = new FormData();
      formData.append('pdf', selectedFile);
      
      console.log('Enviando archivo:', selectedFile.name, 'Tipo:', selectedFile.type, 'Tamaño:', selectedFile.size);

      const response = await adicionalesTecnicaAPI.uploadPDF(formData);

      setUploadSuccess({
        guardados: response.data.guardados,
        total: response.data.total,
        datos: response.data.datos,
        errores: response.data.errores,
      });

      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('pdf-upload');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Error al subir PDF:', error);
      console.error('Detalles completos:', error.response?.data);
      
      let errorMessage = error.response?.data?.error || 
        error.response?.data?.detalles || 
        'Error al procesar el PDF. Por favor, verifica el formato del documento.';
      
      // Agregar sugerencia si está disponible
      if (error.response?.data?.sugerencia) {
        errorMessage += `\n\nSugerencia: ${error.response.data.sugerencia}`;
      }
      
      // Agregar detalles técnicos si están disponibles
      if (error.response?.data?.detalles && error.response?.data?.error !== error.response?.data?.detalles) {
        errorMessage += `\n\nDetalles: ${error.response.data.detalles}`;
      }
      
      setUploadError(errorMessage);
      
      if (error.response?.data?.textoExtraido) {
        console.log('Texto extraído del PDF:', error.response.data.textoExtraido);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.adminPanel}>
      <div className={styles.header}>
        <h2>Adicionales Técnica</h2>
        <p className={styles.subtitle}>
          Sube un PDF con la grilla de salones/fechas/adicionales para procesar automáticamente
        </p>
      </div>

      <div className={styles.uploadSection}>
        <div className={styles.uploadBox}>
          <input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className={styles.fileInput}
            disabled={uploading}
          />
          <label htmlFor="pdf-upload" className={styles.fileLabel}>
            {selectedFile ? selectedFile.name : 'Seleccionar archivo PDF'}
          </label>
          <LoadingButton
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            loading={uploading}
            className={styles.uploadButton}
          >
            Subir y Procesar PDF
          </LoadingButton>
        </div>

        {uploadError && (
          <div className={styles.error}>
            <span>⚠️</span>
            <div style={{ whiteSpace: 'pre-line' }}>{uploadError}</div>
          </div>
        )}

        {uploadSuccess && (
          <div className={styles.success}>
            <h3>✅ PDF procesado exitosamente</h3>
            <p>
              Se guardaron <strong>{uploadSuccess.guardados}</strong> de{' '}
              <strong>{uploadSuccess.total}</strong> registros encontrados
            </p>
            {uploadSuccess.errores && uploadSuccess.errores.length > 0 && (
              <div className={styles.errores}>
                <strong>Errores encontrados:</strong>
                <ul>
                  {uploadSuccess.errores.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {uploadSuccess.datos && uploadSuccess.datos.length > 0 && (
              <div className={styles.preview}>
                <strong>Datos guardados:</strong>
                <ul>
                  {uploadSuccess.datos.slice(0, 10).map((item, index) => (
                    <li key={index}>
                      {item.salon} - {format(new Date(item.fecha), 'dd/MM/yyyy')} -{' '}
                      {Object.entries(item.adicionales)
                        .filter(([_, value]) => value === true || (typeof value === 'string' && value))
                        .map(([key]) => key)
                        .join(', ')}
                    </li>
                  ))}
                  {uploadSuccess.datos.length > 10 && (
                    <li>... y {uploadSuccess.datos.length - 10} más</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

