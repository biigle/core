<?php

namespace Biigle\Tests\Http\Controllers\Auth;

use Biigle\Notifications\RegistrationConfirmation;
use Biigle\Role;
use Biigle\Tests\UserTest;
use Biigle\User;
use Honeypot;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Notification;
use Session;
use TestCase;
use View;

class RegisterControllerTest extends TestCase
{
    public function setUp(): void
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

    public function testRegisterSuccess()
    {
        $this->post('register', [
            '_token'    => Session::token(),
            'email'     => 'e@ma.il',
            'password'  => 'password',
            'firstname' => 'a',
            'lastname'  => 'b',
            'affiliation' => 'something',
            'homepage' => 'honeypotvalue',
        ])->assertRedirect('/');

        $user = User::where('email', 'e@ma.il')->first();
        $this->assertNotNull($user);
        $this->assertEquals('a', $user->firstname);
        $this->assertEquals('b', $user->lastname);
        $this->assertEquals('something', $user->affiliation);
        $this->assertEquals(Role::editorId(), $user->role_id);
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
        Notification::fake();
        View::shouldReceive('exists')->with('privacy')->andReturn(true);
        View::shouldReceive('exists')->with('terms')->andReturn(false);
        View::shouldReceive('share')->passthru();
        View::shouldReceive('make')->andReturn('');
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

    public function testRegisterTerms()
    {
        Notification::fake();
        View::shouldReceive('exists')->with('privacy')->andReturn(false);
        View::shouldReceive('exists')->with('terms')->andReturn(true);
        View::shouldReceive('share')->passthru();
        View::shouldReceive('make')->andReturn('');
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
            'terms' => '1',
        ])->assertRedirect('/');

        $this->assertEquals(1, User::count());
    }

    public function testRegisterAdminConfirmationDisabled()
    {
        Notification::fake();
        $this->post('register', [
            '_token'    => Session::token(),
            'email'     => 'e@ma.il',
            'password'  => 'password',
            'firstname' => 'a',
            'lastname'  => 'b',
            'affiliation' => 'something',
            'homepage' => 'honeypotvalue',
        ]);

        Notification::assertNothingSent();
    }

    public function testRegisterAdminConfirmationEnabled()
    {
        config(['biigle.user_registration_confirmation' => true]);
        Notification::fake();
        $this->post('register', [
            '_token'    => Session::token(),
            'email'     => 'e@ma.il',
            'password'  => 'password',
            'firstname' => 'a',
            'lastname'  => 'b',
            'affiliation' => 'something',
            'homepage' => 'honeypotvalue',
        ]);
        $user = User::where('email', 'e@ma.il')->first();

        Notification::assertSentTo(new AnonymousNotifiable, RegistrationConfirmation::class, function ($notification) use ($user) {
            $this->assertEquals($user->id, $notification->user->id);
            $this->assertEquals($user->email, $notification->toMail(null)->replyTo[0][0]);

            return true;
        });
        $this->assertNotNull($user);
        $this->assertEquals(Role::guestId(), $user->role_id);
    }

    public function testRegisterAdminConfirmationPossibleDuplicates()
    {
        config(['biigle.user_registration_confirmation' => true]);
        $user = UserTest::create([
            'firstname' => 'joe jack',
            'lastname' => 'user',
        ]);

        Notification::fake();
        $this->post('register', [
            '_token'    => Session::token(),
            'email'     => 'e@ma.il',
            'password'  => 'password',
            'firstname' => 'joe',
            'lastname'  => 'user',
            'affiliation' => 'something',
            'homepage' => 'honeypotvalue',
        ]);

        Notification::assertSentTo(new AnonymousNotifiable, RegistrationConfirmation::class, function ($notification) use ($user) {
            $users = $notification->getDuplicateUsers()->pluck('id');

            return $users->count() === 1 && $users->contains($user->id);
        });
    }
}
