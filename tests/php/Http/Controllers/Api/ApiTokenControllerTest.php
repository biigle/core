<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Tests\ApiTokenTest;

class ApiTokenControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $token = ApiTokenTest::create();
        $token2 = ApiTokenTest::create();

        $this->doTestApiRoute('GET', '/api/v1/api-tokens');

        $expect = [
            'id' => $token->id,
            'owner_id' => $token->owner_id,
            'purpose' => $token->purpose,
            'created_at' => $token->created_at->toJson(),
            'updated_at' => $token->updated_at->toJson(),
        ];

        $this->be($token->owner);
        $this->get('/api/v1/api-tokens')
            ->assertExactJson([$expect]);
    }

    public function testStoreWithToken()
    {
        $token = ApiTokenTest::create([
            // 'test_token', hashed with 4 rounds as defined in phpunit.xml
            'hash' => '$2y$04$9Ncj6qJVqenJ13VtdtV5yOca8rQyN1UwATdGpAQ80FeRjS67.Efaq',
        ]);
        $response = $this->call('POST', '/api/v1/api-tokens', [], [], [], [
            'PHP_AUTH_USER' => $token->owner->email,
            'PHP_AUTH_PW' => 'test_token',
        ]);
        // route allows only session cookie authentication
        $response->assertStatus(401);
    }

    public function testStore()
    {
        $this->doTestApiRoute('POST', '/api/v1/api-tokens');

        $token = ApiTokenTest::create([
            // 'test_token', hashed with 4 rounds as defined in phpunit.xml
            'hash' => '$2y$04$9Ncj6qJVqenJ13VtdtV5yOca8rQyN1UwATdGpAQ80FeRjS67.Efaq',
        ]);

        $this->be($token->owner);
        $response = $this->json('POST', '/api/v1/api-tokens');
        // missing purpose
        $response->assertStatus(422);

        $this->assertEquals(1, $token->owner->apiTokens()->count());

        $response = $this->json('POST', '/api/v1/api-tokens', ['purpose' => 'abc'])
            ->assertJsonFragment(['purpose' => 'abc']);

        $response->assertSuccessful();
        $this->assertEquals(2, $token->owner->apiTokens()->count());
        $this->assertStringContainsString('"token":"', $response->getContent());

        $response = $this->post('/api/v1/api-tokens', ['purpose' => 'def'])
            ->assertSessionHas('token');
    }

    public function testStoreAuthorization()
    {
        $this->beGlobalGuest();
        $this->json('POST', '/api/v1/api-tokens', ['purpose' => 'abc'])
            ->assertStatus(403);

        $this->beUser();
        $this->json('POST', '/api/v1/api-tokens', ['purpose' => 'abc'])
            ->assertSuccessful();

        $this->beGlobalAdmin();
        $this->json('POST', '/api/v1/api-tokens', ['purpose' => 'abc'])
            ->assertSuccessful();
    }

    public function testDestroy()
    {
        $token = ApiTokenTest::create();
        $id = $token->id;

        $token2 = ApiTokenTest::create();
        $id2 = $token2->id;

        $this->doTestApiRoute('DELETE', "/api/v1/api-tokens/{$id}");

        $this->be($token->owner);

        $response = $this->delete('/api/v1/api-tokens/999');
        $response->assertStatus(404);

        $response = $this->json('DELETE', "/api/v1/api-tokens/{$id}");
        $response->assertStatus(200);
        $this->assertNull($token->fresh());

        $response = $this->delete("/api/v1/api-tokens/{$id2}");
        $response->assertStatus(404);
        $this->assertNotNull($token2->fresh());

        $this->be($token2->owner);
        $response = $this->delete("/api/v1/api-tokens/{$id2}")
            ->assertSessionHas('deleted', true);
    }
}
