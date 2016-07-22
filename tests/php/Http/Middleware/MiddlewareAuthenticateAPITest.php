<?php

use Dias\User;

class MiddlewareAuthenticateAPITest extends TestCase
{

    public function testNoCredentials()
    {
        $token = ApiTokenTest::create(['hash' => bcrypt('test_token')]);
        $this->get('/api/v1/users');
        $this->assertResponseStatus(401);
    }

    public function testWrongCredentials()
    {
        $token = ApiTokenTest::create(['hash' => bcrypt('test_token')]);
        $this->call('GET', '/api/v1/users', [], [], [], [
            'PHP_AUTH_USER' => $token->owner->email,
            'PHP_AUTH_PW' => 'test_tokens',
        ]);
        $this->assertResponseStatus(401);

        $this->call('GET', '/api/v1/users', [], [], [], [
            'PHP_AUTH_USER' => $token->owner->email.'s',
            'PHP_AUTH_PW' => 'test_token',
        ]);
        $this->assertResponseStatus(401);
    }

    public function testNoToken()
    {
        $user = UserTest::create();
        $this->call('GET', '/api/v1/users', [], [], [], [
            'PHP_AUTH_USER' => $user->email,
            'PHP_AUTH_PW' => 'test_token',
        ]);
        $this->assertResponseStatus(401);
    }

    public function testSuccess()
    {
        $token = ApiTokenTest::create(['hash' => bcrypt('test_token')]);
        $this->call('GET', '/api/v1/users', [], [], [], [
            'PHP_AUTH_USER' => $token->owner->email,
            'PHP_AUTH_PW' => 'test_token',
        ]);
        $this->assertResponseOk();

        $token2 = ApiTokenTest::create([
            'owner_id' => $token->owner->id,
            'hash' => bcrypt('test_token2')
        ]);

        $this->call('GET', '/api/v1/users', [], [], [], [
            'PHP_AUTH_USER' => $token2->owner->email,
            'PHP_AUTH_PW' => 'test_token2',
        ]);
        $this->assertResponseOk();
    }

    public function testTouchToken()
    {
        $token = ApiTokenTest::create(['hash' => bcrypt('test_token')]);
        $token->updated_at = Carbon\Carbon::now(-5);
        $token->save();

        $this->assertEquals($token->updated_at, $token->fresh()->updated_at);

        $this->call('GET', '/api/v1/users', [], [], [], [
            'PHP_AUTH_USER' => $token->owner->email,
            'PHP_AUTH_PW' => 'test_token',
        ]);
        $this->assertResponseOk();

        $this->assertNotEquals($token->updated_at, $token->fresh()->updated_at);
    }
}
