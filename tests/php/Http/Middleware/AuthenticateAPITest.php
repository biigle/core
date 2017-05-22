<?php

namespace Biigle\Tests\Http\Middleware;

use TestCase;
use Carbon\Carbon;
use Biigle\Tests\UserTest;
use Biigle\Tests\ApiTokenTest;

class MiddlewareAuthenticateAPITest extends TestCase
{
    public function testNoCredentials()
    {
        $token = ApiTokenTest::create([
            // 'test_token'
            'hash' => '$2y$10$.rR7YrU9K2ZR4xgPbKs1x.AGUUKIA733CT72eC6I2piTiPY59V7.O',
        ]);
        $this->get('/api/v1/users');
        $this->assertResponseStatus(401);
    }

    public function testWrongCredentials()
    {
        $token = ApiTokenTest::create([
            // 'test_token'
            'hash' => '$2y$10$.rR7YrU9K2ZR4xgPbKs1x.AGUUKIA733CT72eC6I2piTiPY59V7.O',
        ]);
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
        $token = ApiTokenTest::create([
            // 'test_token'
            'hash' => '$2y$10$.rR7YrU9K2ZR4xgPbKs1x.AGUUKIA733CT72eC6I2piTiPY59V7.O',
        ]);
        $this->call('GET', '/api/v1/users', [], [], [], [
            'PHP_AUTH_USER' => $token->owner->email,
            'PHP_AUTH_PW' => 'test_token',
        ]);
        $this->assertResponseOk();

        $token2 = ApiTokenTest::create([
            'owner_id' => $token->owner->id,
            // 'test_token2'
            'hash' => '$2y$10$bqKeHzuH0hf9gIOUBnzd0ezQkVkUU12faCOu2twnBguONfx8.XhlO',
        ]);

        $this->call('GET', '/api/v1/users', [], [], [], [
            'PHP_AUTH_USER' => $token2->owner->email,
            'PHP_AUTH_PW' => 'test_token2',
        ]);
        $this->assertResponseOk();
    }

    public function testEmailCaseInsensitive()
    {
        $token = ApiTokenTest::create([
            // 'test_token'
            'hash' => '$2y$10$.rR7YrU9K2ZR4xgPbKs1x.AGUUKIA733CT72eC6I2piTiPY59V7.O',
        ]);

        $token->owner->email = 'test@test.com';
        $token->owner->save();

        $this->call('GET', '/api/v1/users', [], [], [], [
            'PHP_AUTH_USER' => 'Test@Test.com',
            'PHP_AUTH_PW' => 'test_token',
        ]);
        $this->assertResponseOk();
    }

    public function testTouchToken()
    {
        $token = ApiTokenTest::create([
            // 'test_token'
            'hash' => '$2y$10$.rR7YrU9K2ZR4xgPbKs1x.AGUUKIA733CT72eC6I2piTiPY59V7.O',
        ]);
        $token->updated_at = Carbon::now(-5);
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
