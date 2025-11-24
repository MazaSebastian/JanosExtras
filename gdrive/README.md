## Enviar respaldos a Google Drive

Para subir automáticamente los `.sql` generados en `backups/` a tu cuenta de Google Drive, podés usar [Rclone](https://rclone.org/). A continuación, todos los pasos para dejarlo funcionando:

### 1. Instalar Rclone
```bash
brew install rclone
```
> Si no usás Homebrew, [descargá Rclone desde su sitio](https://rclone.org/downloads/).

### 2. Configurar la conexión con Google Drive
1. Ejecutá:
   ```bash
   rclone config
   ```
2. Elegí `n` para crear un nuevo remote y dale un nombre, por ejemplo `gdrive`.
3. Tipo de almacenamiento: elegí `drive`.
4. SeguÍ las instrucciones para vincular tu cuenta de Google (abrirá un link de autorización).  
5. Al finalizar, quedará creada la sección `gdrive` en `~/.config/rclone/rclone.conf`.

### 3. Probar que funcione
Subí un archivo de prueba:
```bash
rclone copy backups/archivo_prueba.sql gdrive:RespaldosBD
```
- `backup/...` es la ruta local.
- `gdrive:RespaldosBD` es la carpeta remota (se creará automáticamente si no existe).

Verificá en tu Google Drive que el archivo aparezca.

### 4. Script para subir el backup más reciente
En la raíz del proyecto, creá un archivo `scripts/upload_backup.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." &>/dev/null && pwd)"
LATEST_BACKUP="$(ls -t "$ROOT_DIR/backups"/*.sql | head -n 1)"
REMOTE_FOLDER="gdrive:RespaldosBD"

if [ -z "${LATEST_BACKUP:-}" ]; then
  echo "No se encontró ningún archivo en backups/. Ejecutá primero el script de backup."
  exit 1
fi

echo "📤 Subiendo $LATEST_BACKUP a $REMOTE_FOLDER..."
rclone copy "$LATEST_BACKUP" "$REMOTE_FOLDER"
echo "✅ Copia enviada a Google Drive."
```
No olvides darle permisos:
```bash
chmod +x scripts/upload_backup.sh
```

### 5. Automatizarlo semanalmente (cron)
Abrí el crontab:
```bash
crontab -e
```
Y añadí:
```
0 3 * * 1 cd /Users/sebamaza/Desktop/SISTEMA\ EXTRAS\ JANOS && 
PG_DUMP_BIN="/opt/homebrew/opt/postgresql@17/bin/pg_dump" ./scripts/backup.sh &&
./scripts/upload_backup.sh >> /Users/sebamaza/Desktop/SISTEMA\ EXTRAS JANOS/logs/backup.log 2>&1
```
Explicación:
- `0 3 * * 1` => corre todos los lunes a las 03:00 AM.
- Primero se genera el `.sql` con `backup.sh`.
- Luego se llama a `upload_backup.sh` para subirlo a Drive.
- El log se guarda en `logs/backup.log` (crea el directorio `logs/` si no existe).

### 6. Consideraciones
- Asegurate de tener espacio suficiente en Google Drive.
- Revisa periódicamente el archivo `logs/backup.log` por si aparece algún error.
- Cada cierto tiempo, limpia la carpeta `backups/` si ya tenés los respaldos en Drive.

Con esto tus dumps semanales se enviarán automáticamente a Google Drive sin intervención manual. Continúa manteniendo tus `.env` locales en un lugar seguro, ya que contienen credenciales. ¡Listo!။

