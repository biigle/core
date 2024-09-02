<?php

namespace Biigle\Tests\Http\Controllers\Auth;

use Auth;
use Biigle\Tests\UserTest;
use Session;
use TestCase;

class ControllerTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();
        // enable XSRF tokens
        Session::start();
    }

    /**
     * A basic functional test example.
     *
     * @return void
     */
    public function testLoginViewRedirect()
    {
        $response = $this->get('/');
        $response->assertRedirect('/login');

        $this->be(UserTest::create());
        $response = $this->get('/');
        $response->assertStatus(200);
    }

    public function testLoginView()
    {
        $response = $this->get('/login');
        $response->assertStatus(200);
    }

    public function testLoginFail()
    {
        $this->get('login');

        // user doesn't exist
        $response = $response = $this->post('/login', [
            '_token'   => Session::token(),
            'email'    => 'test@test.com',
            'password' => 'password',
        ]);

        $this->assertNull(Auth::user());
        $response->assertRedirect('login');
    }

    public function testLoginSuccess()
    {
        $user = UserTest::create([
            'email' => 'test@test.com',
            // 'password', hashed with 4 rounds as defined in phpunit.xml
            'password' => '$2y$04$aqV2XBF34eexL9ezbQZs1eM872NWgH5MhvrmD0SC9qUbhmg9EoxJq',
        ]);
        // login_at attribute should be null after creation
        $this->assertNull($user->login_at);

        $response = $response = $this->post('/login', [
            '_token'   => Session::token(),
            'email'    => 'test@test.com',
            'password' => 'password',
        ]);

        // login_at attribute should be set after login
        $this->assertNotNull($user->fresh()->login_at);
        $this->assertSame($user->id, Auth::user()->id);
        $response->assertRedirect('/');
    }

    public function testLoginCaseInsensitive()
    {
        $user = UserTest::create([
            'email' => 'test@test.com',
            // 'password', hashed with 4 rounds as defined in phpunit.xml
            'password' => '$2y$04$aqV2XBF34eexL9ezbQZs1eM872NWgH5MhvrmD0SC9qUbhmg9EoxJq',
        ]);

        $response = $response = $this->post('/login', [
            '_token'   => Session::token(),
            'email'    => 'Test@Test.com',
            'password' => 'password',
        ]);

        $this->assertSame($user->id, Auth::user()->id);
    }

    public function testLogout()
    {
        $this->be(UserTest::create());
        $this->assertAuthenticated();
        $response = $this->post('/logout');
        $this->assertGuest();
    }
}
