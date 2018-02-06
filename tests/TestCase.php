<?php

use Illuminate\Support\Facades\Queue;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

class TestCase extends BaseTestCase
{
    use MockeryPHPUnitIntegration;

    protected static $pdo;

    protected $baseUrl = 'http://localhost';

    /**
     * Default preparation for each test.
     */
    public function setUp()
    {
        parent::setUp();

        // Reuse connection, else too many tests will reach the connection limit.
        // Also migrate/refresh the database only the first time.
        if (!static::$pdo) {
            static::$pdo = DB::getPdo();
            $this->artisan('migrate:refresh');
        } else {
            DB::setPdo(static::$pdo);
        }

        $database = $this->app->make('db');
        $database->connection(null)->beginTransaction();

        // Don't execute queued jobs
        Queue::fake();

        // Set up storage disk for testing.
        config(['filesystems.disks.test' => [
            'driver' => 'local',
            'root' => base_path('tests'),
        ]]);
    }

    public function tearDown()
    {
        $database = $this->app->make('db');
        $database->connection(null)->rollBack();
        parent::tearDown();
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
}
