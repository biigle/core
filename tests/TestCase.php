<?php

use Biigle\Tests\CreatesApplication;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;
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
     * Assert that all following database queries stay within the configured parameter
     * limit (biigle.db_param_limit).
     */
    protected function assertQueriesWithinParamLimit(): void
    {
        $limit = config('biigle.db_param_limit');
        DB::listen(function ($query) use ($limit) {
            $this->assertLessThanOrEqual($limit, count($query->bindings), $query->sql);
        });
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
