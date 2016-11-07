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

    public function testSeeUnreadNotifications()
    {
        $user = UserTest::create();
        $this->be($user);
        $user->notify(new InAppNotification('test title', 'test message'));
        $this->visit('notifications')
            ->see('test title')
            ->see('test message')
            ->dontSee('no unread notifications');
        $user->unreadNotifications->markAsRead();
        // force app to reload the notifications
        unset($user->unreadNotifications);
        $this->visit('notifications')
            ->dontSee('test title')
            ->dontSee('test message')
            ->see('no unread notifications');
    }

    public function testSeeAllNotifications()
    {
        $user = UserTest::create();
        $this->be($user);
        $this->visit('notifications?all=1')
            ->see('no notifications');
        $user->notify(new InAppNotification('test title', 'test message'));
        $user->unreadNotifications->markAsRead();
        // force app to reload the notifications
        unset($user->notifications);
        $this->visit('notifications?all=1')
            ->see('test title')
            ->see('test message')
            ->dontSee('no notifications');
    }
}
