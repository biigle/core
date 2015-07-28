<?php

use Carbon\Carbon;

class LoginTest extends TestCase
{
    public function setUp()
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
        $user = UserTest::create('joe', 'user', 'pw', 'test@test.com');
        $user->save();
        $this->call('GET', '/');
        $this->assertRedirectedTo('/auth/login');

        $this->be($user);
        $this->call('GET', '/');
        $this->assertResponseOk();
    }

    public function testLoginView()
    {
        $this->call('GET', '/auth/login');
        $this->assertResponseOk();
    }

    public function testLoginXSRF()
    {
        // user would be able to log in
        UserTest::create('joe', 'user', 'pw', 'test@test.com');

        $this->call('POST', '/auth/login', [
            'email'    => 'test@test.com',
            'password' => 'example123',
        ]);

        // but request fails because of missing XSRF token
        $this->assertResponseStatus(403);
    }

    public function testLoginFail()
    {
        // user doesn't exist
        $response = $this->call('POST', '/auth/login', [
            '_token'   => Session::getToken(),
            'email'    => 'test@test.com',
            'password' => 'example123',
        ]);

        $this->assertRedirectedTo('/auth/login');
    }

    public function testLoginSuccess()
    {
        $user = UserTest::create('joe', 'user', 'example123', 'test@test.com');
        $user->save();
        // login_at attribute should be null after creation
        $this->assertNull($user->login_at);

        $response = $this->call('POST', '/auth/login', [
            '_token'   => Session::getToken(),
            'email'    => 'test@test.com',
            'password' => 'example123',
        ]);

        // login_at attribute should be set after login
        $this->assertNotNull($user->fresh()->login_at);
        $this->assertRedirectedTo('/');
    }
}
