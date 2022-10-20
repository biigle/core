<?php

namespace Biigle\Tests\Http\Controllers\Views\Admin;

use Biigle\Role;
use Biigle\Announcement;
use Biigle\User;
use TestCase;

class AnnouncementsControllerTest extends TestCase
{
    public function testGetWhenNotLoggedIn()
    {
        $this->get('admin/announcements')->assertRedirect('login');
    }

    public function testGetWhenNotAdmin()
    {
        $this->be(User::factory()->create());
        $response = $this->get('admin/announcements')->assertStatus(403);
    }

    public function testGetWhenLoggedIn()
    {
        $admin = User::factory()->create();
        $admin->role()->associate(Role::admin());
        $this->be($admin);
        $this->get('admin/announcements')->assertStatus(200);
    }

    public function testNewWhenNotLoggedIn()
    {
        $this->get('admin/announcements/new')->assertRedirect('login');
    }

    public function testNewWhenNotAdmin()
    {
        $this->be(User::factory()->create());
        $response = $this->get('admin/announcements/new')->assertStatus(403);
    }

    public function testNewWhenLoggedIn()
    {
        $admin = User::factory()->create();
        $admin->role()->associate(Role::admin());
        $this->be($admin);
        $this->get('admin/announcements/new')->assertStatus(200);
    }
}
