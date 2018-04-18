<?php

namespace Biigle\Tests\Http\Controllers\Auth;

use DB;
use Hash;
use TestCase;
use Faker\Factory;
use Biigle\Tests\UserTest;
use Illuminate\Support\Facades\Notification;
use Illuminate\Auth\Notifications\ResetPassword;

class PasswordControllerTest extends TestCase
{
    public function testGetEmail()
    {
        // route is public
        $this->get('password/reset')->assertStatus(200);
    }

    public function testPostEmail()
    {
        Notification::fake();
        $this->get('password/reset');

        $response = $this->post('password/email', ['email' => Factory::create()->email]);
        $user = UserTest::create();
        Notification::assertNotSentTo($user, ResetPassword::class);
        $this->assertNull(DB::table('password_resets')->where('email', $user->email)->first());

        $response = $this->post('password/email', ['email' => $user->email]);
        Notification::assertSentTo($user, ResetPassword::class);
        $this->assertNotNull(DB::table('password_resets')->where('email', $user->email)->first());
    }

    public function testPostEmailCaseInsensitive()
    {
        Notification::fake();
        $user = UserTest::create(['email' => 'test@test.com']);

        $response = $this->post('password/email', ['email' => 'Test@Test.com']);
        Notification::assertSentTo($user, ResetPassword::class);
        $this->assertNotNull(DB::table('password_resets')->where('email', $user->email)->first());
    }

    public function testPostEmailOfflineMode()
    {
        config(['biigle.offline_mode' => true]);
        Notification::fake();
        $user = UserTest::create(['email' => 'test@test.com']);

        $this->post('password/email', ['email' => 'test@test.com'])
            ->assertStatus(404);
        Notification::assertNotSentTo($user, ResetPassword::class);
    }

    public function testGetReset()
    {
        // token must be provided
        $response = $this->get('password/reset/'.str_random(40))->assertViewHas('token');
    }

    public function testPostReset()
    {
        Notification::fake();
        $this->get('password/reset');
        $user = UserTest::create();

        $response = $this->post('password/email', ['email' => $user->email]);

        $token = '';
        Notification::assertSentTo($user, ResetPassword::class, function ($m) use (&$token) {
            $token = $m->token;

            return true;
        });

        $this->get("password/reset/$token");

        $this->assertFalse(Hash::check('new-password', $user->fresh()->password));

        $response = $this->post('password/reset', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $this->assertTrue(Hash::check('new-password', $user->fresh()->password));
    }

    public function testPostResetCaseInsensitive()
    {
        Notification::fake();
        $user = UserTest::create(['email' => 'test@test.com']);
        $response = $this->post('password/email', ['email' => $user->email]);
        $token = '';
        Notification::assertSentTo($user, ResetPassword::class, function ($m) use (&$token) {
            $token = $m->token;

            return true;
        });
        $this->assertFalse(Hash::check('new-password', $user->fresh()->password));

        $response = $this->post('password/reset', [
            'token' => $token,
            'email' => 'Test@Test.com',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $this->assertTrue(Hash::check('new-password', $user->fresh()->password));
    }
}
