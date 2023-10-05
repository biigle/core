<?php

namespace Biigle\Tests\Http\Middleware;

use ApiTestCase;
use App;
use Biigle\Http\Middleware\VerifyCsrfToken;
use Biigle\Tests\ApiTokenTest;
use Closure;
use Illuminate\Session\TokenMismatchException;

class VerifyCsrfTokenTest extends ApiTestCase
{
    public function setUp(): void
    {
        parent::setUp();

        // We need this because it is disabled in unit tests by default.
        App::bind(VerifyCsrfToken::class, VerifyCsrfTokenStub::class);

        $this->token = ApiTokenTest::create([
            // 'test_token'
            'hash' => '$2y$10$.rR7YrU9K2ZR4xgPbKs1x.AGUUKIA733CT72eC6I2piTiPY59V7.O',
            'owner_id' => $this->globalAdmin()->id,
        ]);
    }

    public function testHandleWrongToken()
    {
        $this
        ->call('PUT', '/api/v1/users/'.$this->guest()->id, [], [], [], [
            'PHP_AUTH_USER' => $this->globalAdmin()->email,
            'PHP_AUTH_PW' => 'wrong_token',
        ])
            ->assertStatus(419);
    }

    public function testHandleWrongEmail()
    {
        $this
        ->call('PUT', '/api/v1/users/'.$this->guest()->id, [], [], [], [
            'PHP_AUTH_USER' => 'wrong@email.com',
            'PHP_AUTH_PW' => 'test_token',
        ])
            ->assertStatus(419);
    }

    public function testHandleCorrect()
    {
        $this
        ->call('PUT', '/api/v1/users/'.$this->guest()->id, [], [], [], [
            'PHP_AUTH_USER' => $this->globalAdmin()->email,
            'PHP_AUTH_PW' => 'test_token',
        ])
            ->assertStatus(200);
    }
}

class VerifyCsrfTokenStub extends VerifyCsrfToken
{
    public function runningUnitTests()
    {
        return false;
    }

    public function handle($request, Closure $next)
    {
        try {
            return parent::handle($request, $next);
        } catch (TokenMismatchException $e) {
            // Ignore the exceptions so they are not logged.
            abort(419);
        }
    }
}
