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
            // 'test_token', hashed with 4 rounds as defined in phpunit.xml
            'hash' => '$2y$04$9Ncj6qJVqenJ13VtdtV5yOca8rQyN1UwATdGpAQ80FeRjS67.Efaq',
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
            // 'test_token', hashed with 4 rounds as defined in phpunit.xml
            'hash' => '$2y$04$9Ncj6qJVqenJ13VtdtV5yOca8rQyN1UwATdGpAQ80FeRjS67.Efaq',
        ]);
        $response = $this->call('GET', '/api/v1/users', [], [], [], [
            'PHP_AUTH_USER' => $token->owner->email,
            'PHP_AUTH_PW' => 'test_token',
        ]);
        $response->assertStatus(200);

        $token2 = ApiTokenTest::create([
            'owner_id' => $token->owner->id,
            // 'test_token2', hashed with 4 rounds as defined in phpunit.xml
            'hash' => '$2y$04$YO8JZPK35rlk48cFprp8luo9lN/SPZaKeYjnhM2IpLMWpP8anC08e',
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
            // 'test_token', hashed with 4 rounds as defined in phpunit.xml
            'hash' => '$2y$04$9Ncj6qJVqenJ13VtdtV5yOca8rQyN1UwATdGpAQ80FeRjS67.Efaq',
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
            // 'test_token', hashed with 4 rounds as defined in phpunit.xml
            'hash' => '$2y$04$9Ncj6qJVqenJ13VtdtV5yOca8rQyN1UwATdGpAQ80FeRjS67.Efaq',
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
