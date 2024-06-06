<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Notifications\InAppNotification;
use Biigle\Tests\UserTest;

class NotificationControllerTest extends ApiTestCase
{
    public function testUpdate()
    {
        $user = UserTest::create();
        $user->notify(new InAppNotification('test', 'test'));
        $notification = $user->notifications()->first();
        $this->doTestApiRoute('PUT', '/api/v1/notifications/'.$notification->id);
        $this->assertEquals(1, $user->unreadNotifications()->count());

        $this->be(UserTest::create());
        $response = $this->put('/api/v1/notifications/'.$notification->id)
            ->assertStatus(404);

        $this->be($user);
        $response = $this->put('/api/v1/notifications/'.$notification->id)
            ->assertStatus(200);
        $this->assertEquals(0, $user->unreadNotifications()->count());

        // only unread notifications can be marked as read
        $response = $this->put('/api/v1/notifications/'.$notification->id)
            ->assertStatus(404);
    }

    public function testDestroy()
    {
        $user = UserTest::create();
        $user->notify(new InAppNotification('test', 'test'));
        $notification = $user->notifications()->first();
        $this->doTestApiRoute('DELETE', '/api/v1/notifications/'.$notification->id);
        $this->assertEquals(1, $user->notifications()->count());

        $this->be(UserTest::create());
        $response = $this->delete('/api/v1/notifications/'.$notification->id)
            ->assertStatus(404);

        $this->be($user);
        $response = $this->delete('/api/v1/notifications/'.$notification->id)
            ->assertStatus(200);
        $this->assertEquals(0, $user->notifications()->count());
    }

    public function testUpdateAll()
    {
        $user = UserTest::create();
        $user->notify(new InAppNotification('test', 'test'));
        $user->notify(new InAppNotification('test', 'test'));
        $user->notify(new InAppNotification('test', 'test'));

        $this->doTestApiRoute('PUT', '/api/v1/notifications', ['user_id' => $user->id]);
        $this->assertEquals(3, $user->unreadNotifications()->count());

        $this->be(UserTest::create());
        $this->put('/api/v1/notifications/', ['user_id' => $user->id])
            ->assertForbidden();
        
        $this->be($user);
        $this->put('/api/v1/notifications/', ['user_id' => $user->id])
            ->assertStatus(200);
        $this->assertEquals(0, $user->unreadNotifications()->count());

        // invalid data
        $this->put('/api/v1/notifications/', ['test'])->assertInvalid();
        $this->put('/api/v1/notifications/', ['user_id' => 'test'])->assertInvalid();
    }
}
