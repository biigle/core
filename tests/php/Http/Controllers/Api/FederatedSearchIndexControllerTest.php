<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Jobs\GenerateFederatedSearchIndex;
use Biigle\Tests\FederatedSearchInstanceTest;
use Cache;
use Illuminate\Support\Facades\Bus;

class FederatedSearchIndexControllerTest extends ApiTestCase
{
    public function testIndexAuthenticationFailure()
    {
        $this->getJson('api/v1/federated-search-index')->assertStatus(401);
    }

    public function testIndexAuthenticationSuccess()
    {
        $instance = FederatedSearchInstanceTest::create([
            'local_token' => hash('sha256', 'mytoken'),
        ]);

        $this->getJson('api/v1/federated-search-index', [
            'Authorization' => 'Bearer mytoken',
        ])->assertStatus(200);
    }

    public function testIndexHeadAuthenticationFailure()
    {
        $this->json('HEAD', 'api/v1/federated-search-index')->assertStatus(401);
    }

    public function testIndexHeadAuthenticationSuccess()
    {
        $instance = FederatedSearchInstanceTest::create([
            'local_token' => hash('sha256', 'mytoken'),
        ]);

        $this->json('HEAD', 'api/v1/federated-search-index', [], [
            'Authorization' => 'Bearer mytoken',
        ])->assertStatus(200);
    }

    public function testIndex()
    {
        Bus::fake();

        $instance = FederatedSearchInstanceTest::create([
            'local_token' => hash('sha256', 'mytoken'),
        ]);

        Cache::set(config('biigle.federated_search.cache_key'), ['test'], 60);

        try {
            $this->getJson('api/v1/federated-search-index', [
                'Authorization' => 'Bearer mytoken',
            ])->assertExactJson(['test']);
        } finally {
            Cache::forget(config('biigle.federated_search.cache_key'));
        }

        Bus::assertNotDispatched(GenerateFederatedSearchIndex::class);
    }

    public function testIndexGenerateOnTheFly()
    {
        Bus::fake();

        $instance = FederatedSearchInstanceTest::create([
            'local_token' => hash('sha256', 'mytoken'),
        ]);

        $this->getJson('api/v1/federated-search-index', [
            'Authorization' => 'Bearer mytoken',
        ]);

        Bus::assertDispatched(GenerateFederatedSearchIndex::class);
    }
}
