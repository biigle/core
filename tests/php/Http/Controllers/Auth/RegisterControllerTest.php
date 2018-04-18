<?php

namespace Biigle\Tests\Http\Controllers\Auth;

use Auth;
use Session;
use TestCase;
use Biigle\User;
use Biigle\Tests\UserTest;
use Illuminate\Auth\Notifications\ResetPassword;

class RegisterControllerTest extends TestCase
{
    public function setUp()
    {
        parent::setUp();
        config(['biigle.user_registration' => true]);
    }

    public function testRegisterRoute()
    {
        $this->get('register')->assertStatus(200);
        $this->post('register')->assertStatus(302);
    }

    public function testRegisterRouteDisabled()
    {
        config(['biigle.user_registration' => false]);
        $this->get('register')->assertStatus(404);
        $this->post('register')->assertStatus(404);
    }

    public function testRegisterFieldsRequired()
    {
        $this->get('register');
        $this->post('register', ['_token'   => Session::token()])
            ->assertRedirect('register');
    }

    public function testPasswordConfirmation()
    {
        $this->get('register');
        $response = $this->post('register', [
            '_token'    => Session::token(),
            'email'     => 'e@ma.il',
            'password'  => 'password',
            'password_confirmation'  => 'drowssap',
            'firstname' => 'a',
            'lastname'  => 'b',
        ])->assertRedirect('register');
    }

    public function testRegisterSuccess()
    {
        $this->assertFalse(User::where('email', 'e@ma.il')->exists());

        $response = $this->post('register', [
            '_token'    => Session::token(),
            'email'     => 'e@ma.il',
            'password'  => 'password',
            'password_confirmation'  => 'password',
            'firstname' => 'a',
            'lastname'  => 'b',
        ])->assertRedirect('/');

        $this->assertTrue(User::where('email', 'e@ma.il')->exists());
    }

    public function testRegisterEmailTaken()
    {
        UserTest::create(['email' => 'test@test.com']);
        $this->assertEquals(1, User::all()->count());

        $response = $this->get('register');
        $response = $this->post('register', [
            '_token'    => Session::token(),
            'email'     => 'test@test.com',
            'password'  => 'password',
            'password_confirmation'  => 'password',
            'firstname' => 'a',
            'lastname'  => 'b',
        ])->assertRedirect('register');

        $this->assertEquals(1, User::all()->count());
    }

    public function testRegisterEmailTakenCaseInsensitive()
    {
        UserTest::create(['email' => 'test@test.com']);
        $this->assertEquals(1, User::all()->count());

        $response = $this->get('register');
        $response = $this->post('register', [
            '_token'    => Session::token(),
            'email'     => 'Test@Test.com',
            'password'  => 'password',
            'password_confirmation'  => 'password',
            'firstname' => 'a',
            'lastname'  => 'b',
        ])->assertRedirect('register');

        $this->assertEquals(1, User::all()->count());
    }

    public function testRegisterWhenLoggedIn()
    {
        $this->be(UserTest::create());
        $this->assertEquals(1, User::all()->count());

        $this->get('register')->assertRedirect('/');

        $this->post('register', [
            '_token'    => Session::token(),
            'email'     => 'e@ma.il',
            'password'  => 'password',
            'password_confirmation'  => 'password',
            'firstname' => 'a',
            'lastname'  => 'b',
        ])->assertRedirect('/');

        $this->assertEquals(1, User::all()->count());
    }
}
