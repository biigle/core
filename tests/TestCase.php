<?php

use Biigle\Tests\CreatesApplication;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\RefreshDatabaseState;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Queue;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;

class TestCase extends BaseTestCase
{
    use CreatesApplication, MockeryPHPUnitIntegration, RefreshDatabase;
    use RefreshDatabase {
        refreshTestDatabase as protected originalRefreshTestDatabase;
    }

    public static $cachedPdo;
    public static $cachedVectorPdo;

    protected $baseUrl = 'http://localhost';

    protected $connectionsToTransact = [
        'pgsql',
        'pgvector',
    ];

    /**
     * Default preparation for each test.
     */
    public function setUp(): void
    {
        parent::setUp();

        // Don't execute queued jobs
        Queue::fake();

        // Set up storage disk for testing.
        config(['filesystems.disks.test' => [
            'driver' => 'local',
            'root' => base_path('tests'),
        ]]);
    }

    public function tearDown(): void
    {
        parent::tearDown();
    }

    protected function beforeRefreshingDatabase()
    {
        // Cache PDO for faster tests.
        if (static::$cachedPdo) {
            DB::setPdo(static::$cachedPdo);
        } else {
            static::$cachedPdo = DB::getPdo();
        }

        if (static::$cachedVectorPdo) {
            DB::connection('pgvector')->setPdo(static::$cachedVectorPdo);
        } else {
            static::$cachedVectorPdo = DB::connection('pgvector')->getPdo();
        }
    }

    // Custom implementation to wipe the vector database, too.
    protected function refreshTestDatabase()
    {
        if (! RefreshDatabaseState::$migrated) {
            $this->artisan('db:wipe', ['--database' => 'pgvector']);
        }

        $this->originalRefreshTestDatabase();
    }
}
