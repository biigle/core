<?php

namespace Biigle\Tests\Http\Controllers\Auth;

use Session;
use TestCase;
use Carbon\Carbon;
use Biigle\Tests\UserTest;

class ControllerTest extends TestCase
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
        $this->assertRedirectedTo('/login');

        $this->be(UserTest::create());
        $this->get('/');
        $this->assertResponseOk();
    }

    public function testLoginView()
    {
        $this->get('/login');
        $this->assertResponseOk();
    }

    public function testLoginFail()
    {
        $this->visit('login');

        // user doesn't exist
        $response = $this->post('/login', [
            '_token'   => Session::getToken(),
            'email'    => 'test@test.com',
            'password' => 'example123',
        ]);

        $this->assertRedirectedTo('login');
    }

    public function testLoginSuccess()
    {
        $user = UserTest::create(['email' => 'test@test.com', 'password' => bcrypt('example123')]);
        // login_at attribute should be null after creation
        $this->assertNull($user->login_at);

        $response = $this->post('/login', [
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
        $this->post('/logout');
        $this->dontSeeIsAuthenticated();
    }

    public function testRegisterRoute()
    {
        $this->get('/register');
        $this->assertResponseStatus(404);
        $this->post('/register');
        $this->assertResponseStatus(404);
    }

    // public function testRegisterFieldsRequired()
    // {
    //     $this->get('/register');
    //     $this->post('/register', [
    //         '_token'   => Session::getToken(),
    //     ]);
    //     // fields are missing
    //     $this->assertRedirectedTo('/register');
    // }

    // public function testPasswordConfirmation()
    // {
    //     $this->get('/register');
    //     $this->post('/register', [
    //         '_token'    => Session::getToken(),
    //         'email'     => 'e@ma.il',
    //         'password'  => 'password',
    //         'password_confirmation'  => 'drowssap',
    //         'firstname' => 'a',
    //         'lastname'  => 'b',
    //     ]);

    //     $this->assertRedirectedTo('/register');
    // }

    // public function testRegisterSuccess()
    // {
    //     $this->assertNull(\Biigle\User::find(1));

    //     $this->get('/register');
    //     $this->post('/register', [
    //         '_token'    => Session::getToken(),
    //         'email'     => 'e@ma.il',
    //         'password'  => 'password',
    //         'password_confirmation'  => 'password',
    //         'firstname' => 'a',
    //         'lastname'  => 'b',
    //     ]);

    //     $this->assertRedirectedTo('/');
    //     $user = \Biigle\User::find(1);
    //     $this->assertEquals('e@ma.il', $user->email);
    // }

    // public function testRegisterEmailTaken()
    // {
    //     UserTest::create(['email' => 'test@test.com']);
    //     $this->assertEquals(1, \Biigle\User::all()->count());

    //     $this->get('/register');
    //     $this->post('/register', [
    //         '_token'    => Session::getToken(),
    //         'email'     => 'test@test.com',
    //         'password'  => 'password',
    //         'password_confirmation'  => 'password',
    //         'firstname' => 'a',
    //         'lastname'  => 'b',
    //     ]);

    //     $this->assertRedirectedTo('/register');
    //     $this->assertEquals(1, \Biigle\User::all()->count());
    // }

    // public function testRegisterWhenLoggedIn()
    // {
    //     $this->be(UserTest::create());
    //     $this->assertEquals(1, \Biigle\User::all()->count());

    //     $this->get('/register');
    //     $this->assertRedirectedTo('/');

    //     $this->post('/register', [
    //         '_token'    => Session::getToken(),
    //         'email'     => 'e@ma.il',
    //         'password'  => 'password',
    //         'password_confirmation'  => 'password',
    //         'firstname' => 'a',
    //         'lastname'  => 'b',
    //     ]);

    //     $this->assertRedirectedTo('/');
    //     $this->assertEquals(1, \Biigle\User::all()->count());
    // }
}
