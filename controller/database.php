<?php
// CCD001
// Controlador - Clase Database.
// Propósito: manejar la conexión y consultas a PostgreSQL usando el patrón Singleton
// para reutilizar una única conexión durante la ejecución de la app.

class Database {
    // Instancia única (Singleton): asegura que solo exista un objeto Database
    private static ?Database $instance = null;

    // Recurso de conexión PostgreSQL (devuelto por pg_connect)
    private $connection;

    // Configuración de conexión (credenciales/host de la BD)
    private string $host = 'sqa.iuvade.com';
    private string $port = '5432';
    private string $dbname = 'homeplan';
    private string $user = 'homeplan';
    private string $password = 'ucsp';

    /**
     * Constructor privado (patrón Singleton)
     * - Evita que se creen instancias con "new Database()"
     * - Inicia la conexión a la base de datos automáticamente
     */
    private function __construct() {
        $this->connect(); // Abre conexión al crear la instancia única
    }

    /**
     * Evitar la clonación (Singleton)
     * - Impide duplicar la instancia usando clone
     */
    private function __clone() {}

    /**
     * Obtener la instancia única de la base de datos
     * - Si no existe instancia, la crea
     * - Si ya existe, reutiliza la misma conexión
     */
    public static function getInstance(): Database {
        if (self::$instance === null) {
            self::$instance = new Database(); // Crea la instancia única
        }
        return self::$instance;
    }

    /**
     * Conexión a PostgreSQL
     * - Construye el string de conexión con host/puerto/db/user/password
     * - Lanza excepción si la conexión falla
     */
    private function connect(): void {
        // Arma el connection string requerido por pg_connect
        $connectionString = sprintf(
            "host=%s port=%s dbname=%s user=%s password=%s",
            $this->host,
            $this->port,
            $this->dbname,
            $this->user,
            $this->password
        );

        // Abre conexión con PostgreSQL
        $this->connection = pg_connect($connectionString);

        // Manejo de error de conexión
        if (!$this->connection) {
            throw new Exception("❌ Error al conectar a la base de datos PostgreSQL");
        }
    }

    /**
     * Obtener el recurso de conexión
     * - Útil cuando otra capa necesita ejecutar operaciones directas con pg_*
     */
    public function getConnection() {
        return $this->connection;
    }

    /**
     * Ejecutar una consulta (SELECT, INSERT, UPDATE, DELETE)
     * @param string $sql Consulta SQL completa
     * @return resource Resultado de pg_query
     * @throws Exception si ocurre un error en la consulta
     */
    public function query(string $sql) {
        $result = pg_query($this->connection, $sql);

        // Si falla, lanza excepción con el error exacto de PostgreSQL
        if (!$result) {
            throw new Exception("❌ Error en la consulta: " . pg_last_error($this->connection));
        }

        return $result;
    }

    /**
     * Ejecutar una consulta con parámetros (más seguro)
     * - Evita SQL Injection al enviar valores separados del SQL
     * @param string $sql Consulta con placeholders ($1, $2, ...)
     * @param array $params Valores para reemplazar placeholders
     * @return resource Resultado de pg_query_params
     * @throws Exception si ocurre un error en la consulta
     */
    public function queryParams(string $sql, array $params) {
        if (!preg_match('/^\s*select/i', $sql)) {
            $sql = "select * from " . $sql;
        }
        $result = pg_query_params($this->connection, $sql, $params);
        // Si falla, lanza excepción con el error exacto
        if (!$result) {
            throw new Exception("❌ Error en la consulta con parámetros: " . pg_last_error($this->connection));
        }
        return $result;
    }
    public function executeParams(string $sql, array $params) {
        if (!preg_match('/^\s*select/i', $sql)) {
            $sql = "select " . $sql;
        }
        $result = pg_query_params($this->connection, $sql, $params);
        // Si falla, lanza excepción con el error exacto
        if (!$result) {
            throw new Exception("❌ Error en la consulta con parámetros: " . pg_last_error($this->connection));
        }
        return $result;
    }

    /**
     * Obtener todas las filas como arreglo asociativo
     * - Convierte un result de PostgreSQL a un array de filas (cada fila = array asociativo)
     * @param resource $result Resultado retornado por pg_query o pg_query_params
     * @return array Lista de filas
     */
    public function fetchAll($result): array {
        $rows = [];
        // Recorre el resultado fila por fila
        while ($row = pg_fetch_assoc($result)) {
            $rows[] = $row; // Agrega fila al arreglo final
        }
        return $rows;
    }

    /**
     * Cerrar conexión manualmente (opcional)
     * - Cierra la conexión y reinicia la instancia (permite reconectar luego)
     */
    public function close(): void {
        if ($this->connection) {
            pg_close($this->connection); // Cierra conexión PostgreSQL
            $this->connection = null;    // Limpia el recurso
            self::$instance = null;      // Reinicia Singleton
        }
    }
}
?>
