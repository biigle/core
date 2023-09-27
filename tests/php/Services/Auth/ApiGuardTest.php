<?php

namespace Biigle\Tests\Services\Auth;

use Biigle\Tests\ApiTokenTest;
use Biigle\Tests\UserTest;
use Carbon\Carbon;
use TestCase;

class ApiGuardTest extends TestCase
{
    public function testNoCredentials()
    {
        $response = $this->get('/api/v1/users');
        $response->assertRedirect('login');
    }

    public function testNoCredentialsJson()
    {
        $response = $this->json('GET', '/api/v1/users');
        $response->assertStatus(401);
    }

    public function testWrongCredentials()
    {
        $token = ApiTokenTest::create([
            // 'test_token'
            'hash' => '$2y$10$.rR7YrU9K2ZR4xgPbKs1x.AGUUKIA733CT72eC6I2piTiPY59V7.O',
        ]);
        $response = $this->json('GET', '/api/v1/users', [], [
            'PHP_AUTH_USER' => $token->owner->email,
            'PHP_AUTH_PW' => 'test_tokens',
        ]);
        $response->assertStatus(401);

        $response = $this->json('GET', '/api/v1/users', [], [
            'PHP_AUTH_USER' => $token->owner->email.'s',
            'PHP_AUTH_PW' => 'test_token',
        ]);
        $response->assertStatus(401);
    }

    public function testNoToken()
    {
        $user = UserTest::create();
        $response = $this->json('GET', '/api/v1/users', [], [
            'PHP_AUTH_USER' => $user->email,
            'PHP_AUTH_PW' => 'test_token',
        ]);
        $response->assertStatus(401);
    }

    public function testSuccess()
    {
        $token = ApiTokenTest::create([
            // 'test_token'
            'hash' => '$2y$10$.rR7YrU9K2ZR4xgPbKs1x.AGUUKIA733CT72eC6I2piTiPY59V7.O',
        ]);
        $response = $this->call('GET', '/api/v1/users', [], [], [], [
            'PHP_AUTH_USER' => $token->owner->email,
            'PHP_AUTH_PW' => 'test_token',
        ]);
        $response->assertStatus(200);

        $token2 = ApiTokenTest::create([
            'owner_id' => $token->owner->id,
            // 'test_token2'
            'hash' => '$2y$10$bqKeHzuH0hf9gIOUBnzd0ezQkVkUU12faCOu2twnBguONfx8.XhlO',
        ]);

        $response = $this->json('GET', '/api/v1/users', [], [
            'PHP_AUTH_USER' => $token2->owner->email,
            'PHP_AUTH_PW' => 'test_token2',
        ]);
        $response->assertStatus(200);
    }

    public function testEmailCaseInsensitive()
    {
        $token = ApiTokenTest::create([
            // 'test_token'
            'hash' => '$2y$10$.rR7YrU9K2ZR4xgPbKs1x.AGUUKIA733CT72eC6I2piTiPY59V7.O',
        ]);

        $token->owner->email = 'test@test.com';
        $token->owner->save();

        $response = $this->call('GET', '/api/v1/users', [], [], [], [
            'PHP_AUTH_USER' => 'Test@Test.com',
            'PHP_AUTH_PW' => 'test_token',
        ]);
        $response->assertStatus(200);
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

        $response = $this->call('GET', '/api/v1/users', [], [], [], [
            'PHP_AUTH_USER' => $token->owner->email,
            'PHP_AUTH_PW' => 'test_token',
        ]);
        $response->assertStatus(200);

        $this->assertNotEquals($token->updated_at, $token->fresh()->updated_at);
    }
}
