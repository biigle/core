<?php

namespace Biigle\Tests\Http\Controllers\Auth;

use View;
use Session;
use TestCase;
use Honeypot;
use Biigle\User;
use Biigle\Tests\UserTest;

class RegisterControllerTest extends TestCase
{
    public function setUp()
    {
        parent::setUp();
        config(['biigle.user_registration' => true]);
        Honeypot::disable();
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

    public function testRegisterHoneypot()
    {
        Honeypot::enable();
        $this->get('register');
        $response = $this->post('register', [
            '_token'    => Session::token(),
            'email'     => 'e@ma.il',
            'password'  => 'password',
            'firstname' => 'a',
            'lastname'  => 'b',
            'affiliation' => 'something',
            'homepage' => 'honeypotvalue',
        ])->assertRedirect('register');

        $this->assertFalse(User::where('email', 'e@ma.il')->exists());

        Honeypot::disable();

        $response = $this->post('register', [
            '_token'    => Session::token(),
            'email'     => 'e@ma.il',
            'password'  => 'password',
            'firstname' => 'a',
            'lastname'  => 'b',
            'affiliation' => 'something',
            'homepage' => 'honeypotvalue',
        ])->assertRedirect('/');

        $this->assertTrue(User::where('email', 'e@ma.il')->exists());
    }

    public function testRegisterEmailTaken()
    {
        UserTest::create(['email' => 'test@test.com']);
        $this->assertEquals(1, User::count());

        $response = $this->get('register');
        $response = $this->post('register', [
            '_token'    => Session::token(),
            'email'     => 'test@test.com',
            'password'  => 'password',
            'firstname' => 'a',
            'lastname'  => 'b',
        ])->assertRedirect('register');

        $this->assertEquals(1, User::count());
    }

    public function testRegisterEmailTakenCaseInsensitive()
    {
        UserTest::create(['email' => 'test@test.com']);
        $this->assertEquals(1, User::count());

        $response = $this->get('register');
        $response = $this->post('register', [
            '_token'    => Session::token(),
            'email'     => 'Test@Test.com',
            'password'  => 'password',
            'firstname' => 'a',
            'lastname'  => 'b',
        ])->assertRedirect('register');

        $this->assertEquals(1, User::count());
    }

    public function testRegisterWhenLoggedIn()
    {
        $this->be(UserTest::create());
        $this->assertEquals(1, User::count());

        $this->get('register')->assertRedirect('/');

        $this->post('register', [
            '_token'    => Session::token(),
            'email'     => 'e@ma.il',
            'password'  => 'password',
            'firstname' => 'a',
            'lastname'  => 'b',
        ])->assertRedirect('/');

        $this->assertEquals(1, User::count());
    }

    public function testRegisterPrivacy()
    {
        View::shouldReceive('exists')->with('privacy')->andReturn(true);
        View::shouldReceive('share')->passthru();
        $this->get('register');
        $response = $this->post('register', [
            '_token'    => Session::token(),
            'email'     => 'e@ma.il',
            'password'  => 'password',
            'firstname' => 'a',
            'lastname'  => 'b',
            'affiliation' => 'something',
            'homepage' => 'honeypotvalue',
        ])->assertRedirect('register');

        $this->assertEquals(0, User::count());

        $response = $this->post('register', [
            '_token'    => Session::token(),
            'email'     => 'e@ma.il',
            'password'  => 'password',
            'firstname' => 'a',
            'lastname'  => 'b',
            'affiliation' => 'something',
            'homepage' => 'honeypotvalue',
            'privacy' => '1',
        ])->assertRedirect('/');

        $this->assertEquals(1, User::count());
    }
}
