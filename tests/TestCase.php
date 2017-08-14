<?php

use Illuminate\Support\Facades\Queue;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

class TestCase extends BaseTestCase
{
    protected static $pdo;

    protected $baseUrl = 'http://localhost';

    /**
     * Default preparation for each test.
     */
    public function setUp()
    {
        parent::setUp();

        // reuse connection, else too many tests will reach the connection limit
        if (!static::$pdo) {
            if ($this->isSqlite()) {
                // activate foreign key integrity checks on SQLite
                DB::statement('PRAGMA foreign_keys = ON;');
            }
            static::$pdo = DB::getPdo();
        } else {
            DB::setPdo(static::$pdo);
        }

        $this->artisan('migrate:refresh');

        // Don't execute queued jobs
        Queue::fake();
    }

    /**
     * Creates the application.
     *
     * @return \Illuminate\Foundation\Application
     */
    public function createApplication()
    {
        $app = require __DIR__.'/../bootstrap/app.php';

        $app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

        return $app;
    }

    public function isSqlite()
    {
        return DB::connection() instanceof Illuminate\Database\SQLiteConnection;
    }
}
