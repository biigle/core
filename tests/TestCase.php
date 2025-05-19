<?php

use Biigle\Tests\CreatesApplication;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Queue;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;

class TestCase extends BaseTestCase
{
    use CreatesApplication, MockeryPHPUnitIntegration, RefreshDatabase;

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

        $this->withoutVite();
    }

    /**
     * Determine if an in-memory database is being used.
     *
     * @return bool
     */
    protected function usingInMemoryDatabase()
    {
        // We are not using SQLite in-memory (which can be detected automatically) but
        // Postgres on a ramdisk, so we hardcode this to true. This will make the tests
        // reuse the PDO object for speedup.
        return true;
    }
}
