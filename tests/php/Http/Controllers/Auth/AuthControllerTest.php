<?php

use Carbon\Carbon;

class AuthControllerTest extends TestCase
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
        $this->get('/');
        $this->assertRedirectedTo('/auth/login');

        $this->be(UserTest::create());
        $this->get('/');
        $this->assertResponseOk();
    }

    public function testLoginView()
    {
        $this->get('/auth/login');
        $this->assertResponseOk();
    }

    public function testLoginFail()
    {
        $this->visit('auth/login');

        // user doesn't exist
        $response = $this->post('/auth/login', [
            '_token'   => Session::getToken(),
            'email'    => 'test@test.com',
            'password' => 'example123',
        ]);

        $this->assertRedirectedTo('auth/login');
    }

    public function testLoginSuccess()
    {
        $user = UserTest::create(['email' => 'test@test.com', 'password' => bcrypt('example123')]);
        // login_at attribute should be null after creation
        $this->assertNull($user->login_at);

        $response = $this->post('/auth/login', [
            '_token'   => Session::getToken(),
            'email'    => 'test@test.com',
            'password' => 'example123',
        ]);

        // login_at attribute should be set after login
        $this->assertNotNull($user->fresh()->login_at);
        $this->assertRedirectedTo('/');
    }

    public function testLogout()
    {
        $this->be(UserTest::create());
        $this->seeIsAuthenticated();
        $this->get('/auth/logout');
        $this->dontSeeIsAuthenticated();
    }

    // public function testRegisterRoute()
    // {
    //     $this->get('/auth/register');
    //     $this->assertResponseOk();
    //     $this->post('/auth/register');
    //     $this->assertResponseStatus(403);
    // }

    // public function testRegisterFieldsRequired()
    // {
    //     $this->get('/auth/register');
    //     $this->post('/auth/register', [
    //         '_token'   => Session::getToken(),
    //     ]);
    //     // fields are missing
    //     $this->assertRedirectedTo('/auth/register');
    // }

    // public function testPasswordConfirmation()
    // {
    //     $this->get('/auth/register');
    //     $this->post('/auth/register', [
    //         '_token'    => Session::getToken(),
    //         'email'     => 'e@ma.il',
    //         'password'  => 'password',
    //         'password_confirmation'  => 'drowssap',
    //         'firstname' => 'a',
    //         'lastname'  => 'b',
    //     ]);

    //     $this->assertRedirectedTo('/auth/register');
    // }

    // public function testRegisterSuccess()
    // {
    //     $this->assertNull(\Dias\User::find(1));

    //     $this->get('/auth/register');
    //     $this->post('/auth/register', [
    //         '_token'    => Session::getToken(),
    //         'email'     => 'e@ma.il',
    //         'password'  => 'password',
    //         'password_confirmation'  => 'password',
    //         'firstname' => 'a',
    //         'lastname'  => 'b',
    //     ]);

    //     $this->assertRedirectedTo('/');
    //     $user = \Dias\User::find(1);
    //     $this->assertEquals('e@ma.il', $user->email);
    // }

    // public function testRegisterEmailTaken()
    // {
    //     UserTest::create(['email' => 'test@test.com']);
    //     $this->assertEquals(1, \Dias\User::all()->count());

    //     $this->get('/auth/register');
    //     $this->post('/auth/register', [
    //         '_token'    => Session::getToken(),
    //         'email'     => 'test@test.com',
    //         'password'  => 'password',
    //         'password_confirmation'  => 'password',
    //         'firstname' => 'a',
    //         'lastname'  => 'b',
    //     ]);

    //     $this->assertRedirectedTo('/auth/register');
    //     $this->assertEquals(1, \Dias\User::all()->count());
    // }

    // public function testRegisterWhenLoggedIn()
    // {
    //     $this->be(UserTest::create());
    //     $this->assertEquals(1, \Dias\User::all()->count());

    //     $this->get('/auth/register');
    //     $this->assertRedirectedTo('/');

    //     $this->post('/auth/register', [
    //         '_token'    => Session::getToken(),
    //         'email'     => 'e@ma.il',
    //         'password'  => 'password',
    //         'password_confirmation'  => 'password',
    //         'firstname' => 'a',
    //         'lastname'  => 'b',
    //     ]);

    //     $this->assertRedirectedTo('/');
    //     $this->assertEquals(1, \Dias\User::all()->count());
    // }
}
