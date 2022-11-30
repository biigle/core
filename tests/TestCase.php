<?php

use Biigle\Tests\CreatesApplication;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Queue;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TestCase extends BaseTestCase
{
    use CreatesApplication, MockeryPHPUnitIntegration, RefreshDatabase;

    public static $cachedPdo;

    protected $baseUrl = 'http://localhost';

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
    }
}
