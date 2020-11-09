<?php

namespace Biigle\Tests\Http\Controllers\Views\Notifications;

use Biigle\Tests\UserTest;
use TestCase;

class NotificationsControllerTest extends TestCase
{
    public function testIndexWhenNotLoggedIn()
    {
        $this->get('notifications')->assertRedirect('login');
    }

    public function testIndexWhenLoggedIn()
    {
        $user = UserTest::create();
        $this->actingAs($user)->get('notifications')->assertViewIs('notifications.index');
    }
}
