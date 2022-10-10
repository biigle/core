<?php

namespace Biigle\Tests\Http\Controllers\Views\Admin;

use Biigle\Role;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoTest;
use Biigle\Tests\VolumeTest;
use TestCase;

class UsersControllerTest extends TestCase
{
    public function testGetWhenNotLoggedIn()
    {
        $this->get('admin/users')->assertRedirect('login');
    }

    public function testGetWhenNotAdmin()
    {
        $this->be(UserTest::create());
        $response = $this->get('admin/users')->assertStatus(403);
    }

    public function testGetWhenLoggedIn()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Role::admin());
        $this->be($admin);
        $this->get('admin/users')->assertStatus(200);
    }

    public function testGetSearch()
    {
        $admin = UserTest::create([
            'firstname' => 'jane',
            'lastname' => 'user',
            'email' => 'jane@user.com',
        ]);
        $admin->role()->associate(Role::admin());
        $user = UserTest::create([
            'firstname' => 'joe',
            'lastname' => 'user',
            'email' => 'joe@user.com',
        ]);
        $this->be($admin);
        $this->call('GET', 'admin/users', ['q' => 'joe'])
            ->assertSee('joe@user.com')
            ->assertDontSee('jane@user.com');
    }

    public function testNewWhenNotLoggedIn()
    {
        $this->get('admin/users/new')->assertRedirect('login');
    }

    public function testNewWhenNotAdmin()
    {
        $this->be(UserTest::create());
        $response = $this->get('admin/users/new')->assertStatus(403);
    }

    public function testNewWhenLoggedIn()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Role::admin());
        $this->be($admin);
        $this->get('admin/users/new')->assertStatus(200);
    }

    public function testEditWhenNotLoggedIn()
    {
        $id = UserTest::create()->id;
        $this->get("admin/users/edit/{$id}")->assertRedirect('login');
    }

    public function testEditWhenNotAdmin()
    {
        $user = UserTest::create();
        $this->be($user);
        $response = $this->get("admin/users/edit/{$user->id}")->assertStatus(403);
    }

    public function testEditDoesntExist()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Role::admin());
        $this->be($admin);
        $response = $this->get('admin/users/edit/999')->assertStatus(404);
    }

    public function testEditWhenLoggedIn()
    {
        $id = UserTest::create()->id;
        $admin = UserTest::create();
        $admin->role()->associate(Role::admin());
        $this->be($admin);
        $this->get("admin/users/edit/{$id}")->assertStatus(200);
    }

    public function testDeleteWhenNotLoggedIn()
    {
        $id = UserTest::create()->id;
        $this->get("admin/users/delete/{$id}")->assertRedirect('login');
    }

    public function testDeleteWhenNotAdmin()
    {
        $user = UserTest::create();
        $this->be($user);
        $response = $this->get("admin/users/delete/{$user->id}")->assertStatus(403);
    }

    public function testDeleteDoesntExist()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Role::admin());
        $this->be($admin);
        $this->get('admin/users/delete/0')->assertStatus(404);
    }

    public function testDeleteWhenLoggedIn()
    {
        $id = UserTest::create()->id;
        $admin = UserTest::create();
        $admin->role()->associate(Role::admin());
        $this->be($admin);
        $this->get("admin/users/delete/{$id}")->assertStatus(200);
    }

    public function testShowWhenNotLoggedIn()
    {
        $id = UserTest::create()->id;
        $this->get("admin/users/{$id}")->assertRedirect('login');
    }

    public function testShowWhenNotAdmin()
    {
        $user = UserTest::create();
        $this->be($user);
        $response = $this->get("admin/users/{$user->id}")->assertStatus(403);
    }

    public function testShowDoesntExist()
    {
        $admin = UserTest::create();
        $admin->role()->associate(Role::admin());
        $this->be($admin);
        $response = $this->get('admin/users/999')->assertStatus(404);
    }

    public function testShowWhenLoggedIn()
    {
        $id = UserTest::create()->id;
        $admin = UserTest::create();
        $admin->role()->associate(Role::admin());
        $this->be($admin);
        $this->get("admin/users/{$id}")->assertStatus(200);
    }

    public function testShowWithContent()
    {
        $user = UserTest::create();
        $admin = UserTest::create();
        $admin->role()->associate(Role::admin());

        $volume = VolumeTest::create(['creator_id' => $user->id]);
        $video = VideoTest::create(['volume_id' => $volume->id]);
        $image = ImageTest::create(['volume_id' => $volume->id]);

        ImageAnnotationLabelTest::create(['user_id' => $user->id]);
        VideoAnnotationLabelTest::create(['user_id' => $user->id]);

        $this->be($admin);
        $this->get("admin/users/{$user->id}")->assertStatus(200);
    }
}
