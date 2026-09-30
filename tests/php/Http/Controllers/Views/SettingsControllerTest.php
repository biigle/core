<?php

namespace Biigle\Tests\Http\Controllers\Views;

use Biigle\Role;
use Biigle\Tests\ApiTokenTest;
use Biigle\Tests\UserTest;
use TestCase;

class SettingsControllerTest extends TestCase
{
    public function testIndexWhenNotLoggedIn()
    {
        $this->get('settings')->assertRedirect('login');
    }

    public function testIndexWhenLoggedIn()
    {
        // redirect to profile settings
        $this->actingAs(UserTest::create())
            ->get('settings')
            ->assertRedirect('settings/profile');
    }

    public function testPagesWhenNotLoggedIn()
    {
        foreach (['profile', 'account', 'authentication', 'tokens'] as $page) {
            $this->get("settings/$page")->assertRedirect('login');
        }
    }

    public function testPagesWhenLoggedIn()
    {
        $this->be(UserTest::create());

        foreach (['profile', 'account', 'authentication', 'tokens'] as $page) {
            $this->get("settings/$page")->assertStatus(200);
        }
    }

    public function testTokensGlobalGuest()
    {
        $this->be(UserTest::create(['role_id' => Role::guestId()]));
        $this->get("settings/tokens")->assertStatus(403);
    }

    public function testTokensShowsNewlyCreatedToken()
    {
        $user = UserTest::create();
        $this->be($user);

        $flashedToken = ApiTokenTest::create(['owner_id' => $user->id]);
        $flashedToken->setAttribute('token', 'mysecret');

        $this->withSession(['token' => $flashedToken->toArray()]);

        $response = $this->get('settings/tokens');
        $response->assertStatus(200);
        // The plaintext token secret must be displayed, not silently dropped
        // because the session now flashes an array instead of the model.
        $response->assertSee('mysecret');
    }
}
