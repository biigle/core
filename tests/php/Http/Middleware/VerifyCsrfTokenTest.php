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
            // 'test_token', hashed with 4 rounds as defined in phpunit.xml
            'hash' => '$2y$04$9Ncj6qJVqenJ13VtdtV5yOca8rQyN1UwATdGpAQ80FeRjS67.Efaq',
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
