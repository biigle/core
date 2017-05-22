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
            'created_at' => (string) $token->created_at,
            'updated_at' => (string) $token->updated_at,
        ];

        if ($this->isSqlite()) {
            $expect['owner_id'] = "{$expect['owner_id']}";
        }

        $this->be($token->owner);
        $this->get('/api/v1/api-tokens')
            ->seeJsonEquals([$expect]);
    }

    public function testStore()
    {
        $this->doTestApiRoute('POST', '/api/v1/api-tokens');

        $token = ApiTokenTest::create([
            // 'test_token'
            'hash' => '$2y$10$.rR7YrU9K2ZR4xgPbKs1x.AGUUKIA733CT72eC6I2piTiPY59V7.O',
        ]);
        $this->call('POST', '/api/v1/api-tokens', [], [], [], [
            'PHP_AUTH_USER' => $token->owner->email,
            'PHP_AUTH_PW' => 'test_token',
        ]);
        // rout allows only session cookie authentication
        $this->assertResponseStatus(401);

        $this->be($token->owner);
        $this->json('POST', '/api/v1/api-tokens');
        // missing purpose
        $this->assertResponseStatus(422);

        $this->assertEquals(1, $token->owner->apiTokens()->count());

        $this->json('POST', '/api/v1/api-tokens', ['purpose' => 'abc'])
            ->seeJson(['purpose' => 'abc']);

        $this->assertResponseOk();
        $this->assertEquals(2, $token->owner->apiTokens()->count());
        $this->assertContains('"token":"', $this->response->getContent());

        $this->post('/api/v1/api-tokens', ['purpose' => 'def'])
            ->assertSessionHas('token');
    }

    public function testDestroy()
    {
        $token = ApiTokenTest::create();
        $id = $token->id;

        $token2 = ApiTokenTest::create();
        $id2 = $token2->id;

        $this->doTestApiRoute('DELETE', "/api/v1/api-tokens/{$id}");

        $this->be($token->owner);

        $this->delete('/api/v1/api-tokens/999');
        $this->assertResponseStatus(404);

        $this->json('DELETE', "/api/v1/api-tokens/{$id}");
        $this->assertResponseOk();
        $this->assertNull($token->fresh());

        $this->delete("/api/v1/api-tokens/{$id2}");
        $this->assertResponseStatus(404);
        $this->assertNotNull($token2->fresh());

        $this->be($token2->owner);
        $this->delete("/api/v1/api-tokens/{$id2}")
            ->assertSessionHas('deleted', true);
    }
}
