<?php
class Database {
    // Instancia única
    private static ?Database $instance = null;

    // Recurso de conexión PostgreSQL
    private $connection;

    // Configuración de conexión
    private string $host = 'sqa.iuvade.com';
    private string $port = '5432';
    private string $dbname = 'homeplan';
    private string $user = 'homeplan';
    private string $password = 'ucsp';

    /**
     * Constructor privado (patrón Singleton)
     */
    private function __construct() {
        $this->connect();
    }

    /**
     * Evitar la clonación (Singleton)
     */
    private function __clone() {}

    /**
     * Obtener la instancia única de la base de datos
     */
    public static function getInstance(): Database {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    /**
     * Conexión a PostgreSQL
     */
    private function connect(): void {
        $connectionString = sprintf(
            "host=%s port=%s dbname=%s user=%s password=%s",
            $this->host,
            $this->port,
            $this->dbname,
            $this->user,
            $this->password
        );

        $this->connection = pg_connect($connectionString);

        if (!$this->connection) {
            throw new Exception("❌ Error al conectar a la base de datos PostgreSQL");
        }
    }

    /**
     * Obtener el recurso de conexión
     */
    public function getConnection() {
        return $this->connection;
    }

    /**
     * Ejecutar una consulta (SELECT, INSERT, UPDATE, DELETE)
     */
    public function query(string $sql) {
        $result = pg_query($this->connection, $sql);

        if (!$result) {
            throw new Exception("❌ Error en la consulta: " . pg_last_error($this->connection));
        }

        return $result;
    }

    /**
     * Ejecutar una consulta con parámetros (más seguro)
     */
    public function queryParams(string $sql, array $params) {
        $result = pg_query_params($this->connection, $sql, $params);

        if (!$result) {
            throw new Exception("❌ Error en la consulta con parámetros: " . pg_last_error($this->connection));
        }

        return $result;
    }

    /**
     * Obtener todas las filas como arreglo asociativo
     */
    public function fetchAll($result): array {
        $rows = [];
        while ($row = pg_fetch_assoc($result)) {
            $rows[] = $row;
        }
        return $rows;
    }

    /**
     * Cerrar conexión manualmente (opcional)
     */
    public function close(): void {
        if ($this->connection) {
            pg_close($this->connection);
            $this->connection = null;
            self::$instance = null;
        }
    }
}
?>