<?php

namespace Biigle\Tests\Http\Controllers\Views\Admin;

use Biigle\Enums\Role;
use Biigle\Tests\UserTest;
use TestCase;

class IndexControllerTest extends TestCase
{
    public function testIndexWhenNotLoggedIn()
    {
        $this->get('admin')->assertRedirect('login');
    }

    public function testIndexWhenNotAdmin()
    {
        $this->be(UserTest::create());
        $response = $this->get('admin')->assertStatus(403);
    }

    public function testIndexWhenLoggedIn()
    {
        // redirect to profile settings
        $admin = UserTest::create();
        $admin->role = Role::ADMIN;
        $this->actingAs($admin)->get('admin')->assertViewIs('admin.index');
    }

    public function testIndexUserCounts()
    {
        $admin = UserTest::create([
            'role' => Role::ADMIN,
            'login_at' => now(),
        ]);
        UserTest::create(['login_at' => null]);
        UserTest::create(['login_at' => now()->subHours(2)]);
        UserTest::create(['login_at' => now()->subDays(3)]);
        UserTest::create(['login_at' => now()->subWeeks(2)]);
        UserTest::create(['login_at' => now()->subMonths(2)]);

        $this->actingAs($admin)
            ->get('admin')
            ->assertViewHas('allUsers', 6)
            ->assertViewHas('loginUsers', 5)
            ->assertViewHas('activeUsersLastMonth', 4)
            ->assertViewHas('activeUsersLastWeek', 3)
            ->assertViewHas('activeUsersLastDay', 2);
    }
}
