<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Enums\Role;
use Biigle\Notifications\RegistrationAccepted;
use Biigle\Notifications\RegistrationRejected;
use Biigle\Tests\UserTest;
use Illuminate\Auth\Events\Verified;
use Notification;
use PHPUnit\Framework\Attributes\DataProvider;

class UserRegistrationControllerTest extends ApiTestCase
{
    public function testAcceptRegistration()
    {
        Notification::fake();
        config([
            'biigle.email_verification' => true,
            'biigle.user_registration_confirmation' => true,
        ]);
        $user = UserTest::create(['role' => Role::GUEST, 'email_verified_at' => null]);
        $this->doTestApiRoute('GET', "/api/v1/accept-user-registration/{$user->id}");

        $this->beAdmin();
        $this->getJson("/api/v1/accept-user-registration/{$user->id}")
            ->assertStatus(403);

        // Accept user: This should not make him editor, we still need verification
        $this->globalReviewer()->markEmailAsVerified();
        $this->beGlobalReviewer();
        $this->getJson("/api/v1/accept-user-registration/{$user->id}")
            ->assertStatus(200);
        $this->assertSame(Role::GUEST, $user->fresh()->role);
        $this->assertNotNull($user->fresh()->registration_approved_at);

        // Verify user: This should make him editor
        $user = $user->fresh();
        $user->markEmailAsVerified();
        event(new Verified($user));
        $this->assertSame(Role::EDITOR, $user->fresh()->role);

        $this->getJson("/api/v1/accept-user-registration/{$user->id}")
            ->assertStatus(404);
        Notification::assertSentTo($user, RegistrationAccepted::class);
    }

    public function testAcceptRedirectReviewer()
    {
        Notification::fake();
        config(['biigle.user_registration_confirmation' => true]);
        $user = UserTest::create(['role' => Role::GUEST]);
        $this->beGlobalReviewer();
        $this->get("/api/v1/accept-user-registration/{$user->id}")
            ->assertRedirectToRoute('home');
    }

    public function testAcceptRedirectAdmin()
    {
        Notification::fake();
        config(['biigle.user_registration_confirmation' => true]);
        $user = UserTest::create(['role' => Role::GUEST]);
        $this->beGlobalAdmin();
        $this->get("/api/v1/accept-user-registration/{$user->id}")
            ->assertRedirectToRoute('admin-users-show', $user->id);
    }

    public static function registrationFeatureConfigProvider(): array
    {
        return [
            'online, email verification off, confirmation off' => [false, false, false],
            'online, email verification off, confirmation on' => [false, false, true],
            'online, email verification on, confirmation off' => [false, true, false],
            'online, email verification on, confirmation on' => [false, true, true],
            'offline, email verification off, confirmation off' => [true, false, false],
            'offline, email verification off, confirmation on' => [true, false, true],
            'offline, email verification on, confirmation off' => [true, true, false],
            'offline, email verification on, confirmation on' => [true, true, true],
        ];
    }

    /**
     * Checks role promotion for every registration feature configuration. A new user
     * becomes an editor after all enabled confirmation and verification steps, in
     * either order; offline mode disables both steps.
     */
    #[DataProvider('registrationFeatureConfigProvider')]
    public function testRegistrationLifecycleAcrossFeatureConfig(
        bool $offlineMode,
        bool $emailVerification,
        bool $registrationConfirmation
    ): void {
        Notification::fake();
        config([
            'biigle.offline_mode' => $offlineMode,
            'biigle.email_verification' => $emailVerification,
            'biigle.user_registration_confirmation' => $registrationConfirmation,
        ]);
        $this->globalReviewer()->markEmailAsVerified();
        $this->beGlobalReviewer();

        $emailVerificationEnabled = $emailVerification && !$offlineMode;
        $registrationConfirmationEnabled = $registrationConfirmation && !$offlineMode;
        $initialRole = $emailVerificationEnabled || $registrationConfirmationEnabled
            ? Role::GUEST
            : Role::EDITOR;

        $actionOrders = [[]];
        if ($registrationConfirmationEnabled) {
            $actionOrders[0][] = 'confirmation';
        }
        if ($emailVerificationEnabled) {
            $actionOrders[0][] = 'verification';
        }
        if ($registrationConfirmationEnabled && $emailVerificationEnabled) {
            $actionOrders[] = ['verification', 'confirmation'];
        }

        foreach ($actionOrders as $actions) {
            $user = UserTest::create([
                'role' => $initialRole,
                'email_verified_at' => null,
            ]);
            $this->assertSame($initialRole, $user->fresh()->role);

            foreach ($actions as $index => $action) {
                if ($action === 'confirmation') {
                    $this->getJson("/api/v1/accept-user-registration/{$user->id}")
                        ->assertStatus(200);
                } else {
                    $user->markEmailAsVerified();
                    event(new Verified($user->fresh()));
                }

                $expectedRole = $index === count($actions) - 1
                    ? Role::EDITOR
                    : Role::GUEST;
                $this->assertSame($expectedRole, $user->fresh()->role);
            }

            $this->assertSame(Role::EDITOR, $user->fresh()->role);
        }

        if (!$registrationConfirmationEnabled) {
            $user = UserTest::create(['role' => Role::GUEST]);
            $this->getJson("/api/v1/accept-user-registration/{$user->id}")
                ->assertStatus(404);
        }

        $rejectedUser = UserTest::create(['role' => Role::GUEST]);
        $rejectResponse = $this->getJson("/api/v1/reject-user-registration/{$rejectedUser->id}");
        if ($registrationConfirmationEnabled) {
            $rejectResponse->assertStatus(200);
            $this->assertNull($rejectedUser->fresh());
        } else {
            $rejectResponse->assertStatus(404);
            $this->assertNotNull($rejectedUser->fresh());
        }
    }

    public function testRejectRegistration()
    {
        Notification::fake();
        config(['biigle.user_registration_confirmation' => true]);
        $user = UserTest::create(['role' => Role::EDITOR]);
        $this->doTestApiRoute('GET', "/api/v1/reject-user-registration/{$user->id}");

        $this->beAdmin();
        $this->getJson("/api/v1/reject-user-registration/{$user->id}")
            ->assertStatus(403);

        $this->beGlobalReviewer();
        $this->getJson("/api/v1/reject-user-registration/{$user->id}")
            ->assertStatus(404);

        $user = UserTest::create(['role' => Role::GUEST]);

        $this->getJson("/api/v1/reject-user-registration/{$user->id}")
            ->assertStatus(200);
        $this->assertNull($user->fresh());
        Notification::assertSentTo($user, RegistrationRejected::class);
    }

    public function testRejectRedirectReviewer()
    {
        Notification::fake();
        config(['biigle.user_registration_confirmation' => true]);
        $user = UserTest::create(['role' => Role::GUEST]);
        $this->beGlobalReviewer();
        $this->get("/api/v1/reject-user-registration/{$user->id}")
            ->assertRedirectToRoute('home');
    }

    public function testRejectRedirectAdmin()
    {
        Notification::fake();
        config(['biigle.user_registration_confirmation' => true]);
        $user = UserTest::create(['role' => Role::GUEST]);
        $this->beGlobalAdmin();
        $this->get("/api/v1/reject-user-registration/{$user->id}")
            ->assertRedirectToRoute('admin-users');
    }
}
