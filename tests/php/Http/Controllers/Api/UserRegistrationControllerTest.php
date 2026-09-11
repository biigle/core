<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Notifications\RegistrationAccepted;
use Biigle\Notifications\RegistrationRejected;
use Biigle\Role;
use Biigle\Tests\UserTest;
use Notification;

class UserRegistrationControllerTest extends ApiTestCase
{
    public function testAcceptRegistration()
    {
        Notification::fake();
        config(['biigle.user_registration_confirmation' => true]);
        $user = UserTest::create(['role_id' => Role::GUEST->value]);
        $this->doTestApiRoute('GET', "/api/v1/accept-user-registration/{$user->id}");

        $this->beAdmin();
        $this->getJson("/api/v1/accept-user-registration/{$user->id}")
            ->assertStatus(403);

        $this->beGlobalReviewer();
        $this->getJson("/api/v1/accept-user-registration/{$user->id}")
            ->assertStatus(200);
        $this->assertSame(Role::EDITOR->value, $user->fresh()->role_id->value);

        $this->getJson("/api/v1/accept-user-registration/{$user->id}")
            ->assertStatus(404);
        Notification::assertSentTo($user, RegistrationAccepted::class);
    }

    public function testAcceptRedirectReviewer()
    {
        Notification::fake();
        config(['biigle.user_registration_confirmation' => true]);
        $user = UserTest::create(['role_id' => Role::GUEST->value]);
        $this->beGlobalReviewer();
        $this->get("/api/v1/accept-user-registration/{$user->id}")
            ->assertRedirectToRoute('home');
    }

    public function testAcceptRedirectAdmin()
    {
        Notification::fake();
        config(['biigle.user_registration_confirmation' => true]);
        $user = UserTest::create(['role_id' => Role::GUEST->value]);
        $this->beGlobalAdmin();
        $this->get("/api/v1/accept-user-registration/{$user->id}")
            ->assertRedirectToRoute('admin-users-show', $user->id);
    }

    public function testAcceptRegistrationDisabled()
    {
        config(['biigle.user_registration_confirmation' => false]);
        $user = UserTest::create(['role_id' => Role::GUEST->value]);
        $this->beGlobalReviewer();
        $this->getJson("/api/v1/accept-user-registration/{$user->id}")
            ->assertStatus(404);
    }

    public function testRejectRegistration()
    {
        Notification::fake();
        config(['biigle.user_registration_confirmation' => true]);
        $user = UserTest::create(['role_id' => Role::EDITOR->value]);
        $this->doTestApiRoute('GET', "/api/v1/reject-user-registration/{$user->id}");

        $this->beAdmin();
        $this->getJson("/api/v1/reject-user-registration/{$user->id}")
            ->assertStatus(403);

        $this->beGlobalReviewer();
        $this->getJson("/api/v1/reject-user-registration/{$user->id}")
            ->assertStatus(404);

        $user = UserTest::create(['role_id' => Role::GUEST->value]);

        $this->getJson("/api/v1/reject-user-registration/{$user->id}")
            ->assertStatus(200);
        $this->assertNull($user->fresh());
        Notification::assertSentTo($user, RegistrationRejected::class);
    }

    public function testRejectRedirectReviewer()
    {
        Notification::fake();
        config(['biigle.user_registration_confirmation' => true]);
        $user = UserTest::create(['role_id' => Role::GUEST->value]);
        $this->beGlobalReviewer();
        $this->get("/api/v1/reject-user-registration/{$user->id}")
            ->assertRedirectToRoute('home');
    }

    public function testRejectRedirectAdmin()
    {
        Notification::fake();
        config(['biigle.user_registration_confirmation' => true]);
        $user = UserTest::create(['role_id' => Role::GUEST->value]);
        $this->beGlobalAdmin();
        $this->get("/api/v1/reject-user-registration/{$user->id}")
            ->assertRedirectToRoute('admin-users');
    }

    public function testRejectRegistrationDisabled()
    {
        config(['biigle.user_registration_confirmation' => false]);
        $user = UserTest::create(['role_id' => Role::GUEST->value]);
        $this->beGlobalReviewer();
        $this->getJson("/api/v1/reject-user-registration/{$user->id}")
            ->assertStatus(404);
    }
}
