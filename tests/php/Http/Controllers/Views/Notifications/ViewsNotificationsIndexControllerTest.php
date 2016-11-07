<?php

use Dias\Notifications\InAppNotification;

class ViewsNotificationsIndexControllerTest extends TestCase
{
    public function testIndexWhenNotLoggedIn()
    {
        $this->visit('notifications')->seePageIs('login');
    }

    public function testIndexWhenLoggedIn()
    {
        $user = UserTest::create();
        $this->actingAs($user)->visit('notifications')->seePageIs('notifications');
    }
}
