<?php
use Dias\Notifications\InAppNotification;

class ApiNotificationControllerTest extends ApiTestCase
{

    public function testUpdate()
    {
        $user = UserTest::create();
        $user->notify(new InAppNotification('test', 'test'));
        $notification = $user->notifications()->first();
        $this->doTestApiRoute('PUT', '/api/v1/notifications/'.$notification->id);
        $this->assertEquals(1, $user->unreadNotifications()->count());

        $this->be(UserTest::create());
        $this->put('/api/v1/notifications/'.$notification->id)
            ->assertResponseStatus(404);

        $this->be($user);
        $this->put('/api/v1/notifications/'.$notification->id)
            ->assertResponseOk();
        $this->assertEquals(0, $user->unreadNotifications()->count());

        // only unread notifications can be marked as read
        $this->put('/api/v1/notifications/'.$notification->id)
            ->assertResponseStatus(404);
    }

    public function testDestroy()
    {
        $user = UserTest::create();
        $user->notify(new InAppNotification('test', 'test'));
        $notification = $user->notifications()->first();
        $this->doTestApiRoute('DELETE', '/api/v1/notifications/'.$notification->id);
        $this->assertEquals(1, $user->notifications()->count());

        $this->be(UserTest::create());
        $this->delete('/api/v1/notifications/'.$notification->id)
            ->assertResponseStatus(404);

        $this->be($user);
        $this->delete('/api/v1/notifications/'.$notification->id)
            ->assertResponseOk();
        $this->assertEquals(0, $user->notifications()->count());
    }
}
