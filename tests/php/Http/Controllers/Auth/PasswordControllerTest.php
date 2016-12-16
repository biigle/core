<?php

namespace Dias\Tests\Http\Controllers\Auth;

use DB;
use Mail;
use Hash;
use Session;
use TestCase;
use Faker\Factory;
use Dias\Tests\UserTest;

class PasswordControllerTest extends TestCase
{
    public function testGetEmail()
    {
        // route is public
        $this->visit('password/reset')->assertResponseOk();
    }

    public function testPostEmail()
    {
        $this->visit('password/reset');

        Mail::shouldReceive('send')->once();

        $this->post('password/email', [
            '_token' => Session::token(),
            'email' => Factory::create()->email,
        ]);

        $user = UserTest::create();

        $this->assertNull(DB::table('password_resets')->where('email', $user->email)->first());

        $this->post('password/email', ['_token' => Session::token(), 'email' => $user->email]);

        $this->assertNotNull(DB::table('password_resets')->where('email', $user->email)->first());
    }

    public function testGetReset()
    {
        // token must be provided
        $this->get('password/reset/'.str_random(40))->assertViewHas('token');
    }

    public function testPostReset()
    {
        $this->visit('password/reset');
        $user = UserTest::create();

        Mail::shouldReceive('send')->once();
        $this->post('password/email', ['_token' => Session::token(), 'email' => $user->email]);

        $token = DB::table('password_resets')->where('email', $user->email)->first()->token;

        $this->visit("password/reset/$token");

        $this->assertFalse(Hash::check('new-password', $user->fresh()->password));

        $this->post("password/reset", [
            '_token' => Session::token(),
            'token' => $token,
            'email' => $user->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $this->assertTrue(Hash::check('new-password', $user->fresh()->password));
    }
}
