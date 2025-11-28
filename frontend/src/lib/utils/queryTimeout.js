/**
 * Wrapper para queries con timeout
 * Previene que queries colguen indefinidamente
 */

/**
 * Ejecuta una query con timeout
 * @param {Function} queryFn - Función que retorna una Promise con la query
 * @param {number} timeoutMs - Timeout en milisegundos (default: 25s)
 * @returns {Promise} Resultado de la query
 */
export async function withQueryTimeout(queryFn, timeoutMs = 25000) {
  return Promise.race([
    queryFn(),
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Query timeout después de ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]);
}

/**
 * Wrapper para pool.query con timeout
 * @param {Pool} pool - Pool de conexiones
 * @param {string} query - Query SQL
 * @param {Array} params - Parámetros de la query
 * @param {number} timeoutMs - Timeout en milisegundos
 * @returns {Promise} Resultado de la query
 */
export async function queryWithTimeout(pool, query, params = [], timeoutMs = 25000) {
  return withQueryTimeout(
    () => pool.query(query, params),
    timeoutMs
  );
}

