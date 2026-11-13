<?php

namespace Biigle\Tests\Http\Controllers\Auth;

use Biigle\Enums\Role;
use Biigle\Notifications\RegistrationConfirmation;
use Biigle\Tests\UserTest;
use Biigle\User;
use Honeypot;
use Illuminate\Auth\Events\Verified;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Contracts\View\View as ViewContract;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\RateLimiter;
use Mockery;
use Session;
use TestCase;
use View;

class RegisterControllerTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();
        config([
            'biigle.user_registration' => true,
            'biigle.email_verification' => false,
            'biigle.user_registration_confirmation' => false,
        ]);
        RateLimiter::for('registration', fn () => Limit::none());
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

    public function testRegisterRouteSsoOnly()
    {
        config(['biigle.sso_registration_only' => true]);
        $this->get('register')->assertStatus(200);
        $this->post('register')->assertStatus(404);
    }

    public function testRegisterFieldsRequired()
    {
        $this->get('register');
        $this->post('register', ['_token'   => Session::token()])
            ->assertRedirect('register');
    }

    public function testRegisterIsRateLimited()
    {
        RateLimiter::for('registration', fn ($request) => Limit::perSecond(1, 10)->by($request->ip()));

        $data = [
            '_token'    => Session::token(),
            'email'     => 'e@ma.il',
            'password'  => 'password',
            'firstname' => 'a',
            'lastname'  => 'b',
            'affiliation' => 'something',
            'homepage' => 'honeypotvalue',
        ];

        $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.1'])
            ->post('register', $data)
            ->assertRedirect('/');

        $this->post('logout');

        $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.1'])
            ->post('register', $data)
            ->assertRedirect('register')
            ->assertSessionHas('message', 'Please wait before submitting the form again.')
            ->assertSessionHas('messageType', 'danger');
    }

    public function testRegisterSuccess()
    {
        $this->post('register', [
            '_token'    => Session::token(),
            'email'     => 'E@ma.il', // Should be converted to lowercase
            'password'  => 'password',
            'firstname' => 'a',
            'lastname'  => 'b',
            'affiliation' => 'something',
            'homepage' => 'honeypotvalue',
        ])->assertRedirect('/');

        /** @var User $user */
        $user = User::where('email', 'e@ma.il')->first();
        $this->assertNotNull($user);
        $this->assertSame('a', $user->firstname);
        $this->assertSame('b', $user->lastname);
        $this->assertSame('something', $user->affiliation);
        $this->assertSame(Role::EDITOR, $user->role);
    }

    public function testRegisterWithEmailVerification()
    {
        config(['biigle.email_verification' => true]);
        Notification::fake();

        $this->post('register', [
            '_token'    => Session::token(),
            'email'     => 'e@ma.il',
            'password'  => 'password',
            'firstname' => 'a',
            'lastname'  => 'b',
            'affiliation' => 'something',
            'homepage' => 'honeypotvalue',
        ])->assertRedirect('/');

        /** @var User $user */
        $user = User::where('email', 'e@ma.il')->first();
        $this->assertSame(Role::GUEST, $user->role);
        $this->assertNull($user->email_verified_at);

        $user->markEmailAsVerified();
        event(new Verified($user));

        $this->assertSame(Role::EDITOR, $user->fresh()->role);
    }

    public function testRegisterWithEmailVerificationAndAdminConfirmation()
    {
        config([
            'biigle.email_verification' => true,
            'biigle.user_registration_confirmation' => true,
        ]);
        Notification::fake();

        $this->post('register', [
            '_token'    => Session::token(),
            'email'     => 'e@ma.il',
            'password'  => 'password',
            'firstname' => 'a',
            'lastname'  => 'b',
            'affiliation' => 'something',
            'homepage' => 'honeypotvalue',
        ])->assertRedirect('/');

        /** @var User $user */
        $user = User::where('email', 'e@ma.il')->first();
        Notification::assertSentTo(
            new AnonymousNotifiable,
            RegistrationConfirmation::class,
        );
        $user->markEmailAsVerified();
        event(new Verified($user));

        $this->assertSame(Role::GUEST, $user->fresh()->role);
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
            'website' => 'spam',
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

    public function testRegisterImmediatelyWithHoneypotEnabled()
    {
        Honeypot::enable();
        RateLimiter::for('registration', fn ($request) => Limit::perSecond(1, 10)->by($request->ip()));

        $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.2'])
            ->post('register', [
                '_token' => Session::token(),
                'email' => 'immediate@ma.il',
                'password' => 'password',
                'firstname' => 'a',
                'lastname' => 'b',
                'affiliation' => 'something',
                'website' => '',
            ])->assertRedirect('/');

        $this->assertTrue(User::where('email', 'immediate@ma.il')->exists());

        $this->post('logout');
        $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.2'])
            ->post('register', [
                '_token' => Session::token(),
                'email' => 'second@ma.il',
                'password' => 'password',
                'firstname' => 'a',
                'lastname' => 'b',
                'affiliation' => 'something',
                'website' => '',
            ])
            ->assertRedirect('register')
            ->assertSessionHas('message', 'Please wait before submitting the form again.')
            ->assertSessionHas('messageType', 'danger');
    }

    public function testRegisterEmailTaken()
    {
        UserTest::create(['email' => 'test@test.com']);
        $this->assertSame(1, User::count());

        $response = $this->get('register');
        $response = $this->post('register', [
            '_token'    => Session::token(),
            'email'     => 'test@test.com',
            'password'  => 'password',
            'firstname' => 'a',
            'lastname'  => 'b',
        ])->assertRedirect('register');

        $this->assertSame(1, User::count());
    }

    public function testRegisterEmailTakenCaseInsensitive()
    {
        UserTest::create(['email' => 'test@test.com']);
        $this->assertSame(1, User::count());

        $response = $this->get('register');
        $response = $this->post('register', [
            '_token'    => Session::token(),
            'email'     => 'Test@Test.com',
            'password'  => 'password',
            'firstname' => 'a',
            'lastname'  => 'b',
        ])->assertRedirect('register');

        $this->assertSame(1, User::count());
    }

    public function testRegisterWhenLoggedIn()
    {
        $this->be(UserTest::create());
        $this->assertSame(1, User::count());

        $this->get('register')->assertRedirect('/');

        $this->post('register', [
            '_token'    => Session::token(),
            'email'     => 'e@ma.il',
            'password'  => 'password',
            'firstname' => 'a',
            'lastname'  => 'b',
        ])->assertRedirect('/');

        $this->assertSame(1, User::count());
    }

    public function testRegisterPrivacy()
    {
        Notification::fake();
        View::shouldReceive('exists')->with('privacy')->andReturn(true);
        View::shouldReceive('exists')->with('terms')->andReturn(false);
        View::shouldReceive('share')->passthru();
        $viewMock = Mockery::mock(ViewContract::class)->shouldIgnoreMissing();
        $viewMock->shouldReceive('render')->andReturn('');
        View::shouldReceive('make')->andReturn($viewMock);
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

        $this->assertSame(0, User::count());

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

        $this->assertSame(1, User::count());
    }

    public function testRegisterTerms()
    {
        Notification::fake();
        View::shouldReceive('exists')->with('privacy')->andReturn(false);
        View::shouldReceive('exists')->with('terms')->andReturn(true);
        View::shouldReceive('share')->passthru();
        $viewMock = Mockery::mock(ViewContract::class)->shouldIgnoreMissing();
        $viewMock->shouldReceive('render')->andReturn('');
        View::shouldReceive('make')->andReturn($viewMock);
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

        $this->assertSame(0, User::count());

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

        $this->assertSame(1, User::count());
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

        Notification::assertNotSentTo(new AnonymousNotifiable, RegistrationConfirmation::class);
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
            $this->assertSame($user->id, $notification->user->id);
            $this->assertSame($user->email, $notification->toMail(null)->replyTo[0][0]);

            return true;
        });
        $this->assertNotNull($user);
        $this->assertSame(Role::GUEST, $user->role);
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
