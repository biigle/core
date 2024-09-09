<?php

namespace Biigle\Tests\Console\Commands;

use Biigle\Console\Commands\PruneNotifications;
use Carbon\Carbon;
use Illuminate\Notifications\DatabaseNotification;
use TestCase;

class PruneNotificationsTest extends TestCase
{
    public function testHandle()
    {
        $sevenMonthsAgo = Carbon::now()->subMonths(7);
        $now = Carbon::now();

        DatabaseNotification::insert([
            [
                'id' => '1',
                'type' => 'test',
                'notifiable_id' => 1,
                'notifiable_type' => 'Test',
                'data' => 'Text 1',
                'read_at' => $now,
                'created_at' => $sevenMonthsAgo,
            ],
            [
                'id' => '2',
                'type' => 'test',
                'notifiable_id' => 1,
                'notifiable_type' => 'Test',
                'data' => 'Text 2',
                'read_at' => null,
                'created_at' => $sevenMonthsAgo,
            ],
            [
                'id' => '3',
                'type' => 'test',
                'notifiable_id' => 1,
                'notifiable_type' => 'Test',
                'data' => 'Text 3',
                'read_at' => $now,
                'created_at' => $now,
            ],
        ]);

        (new PruneNotifications)->handle();
        $this->assertSame(2, DatabaseNotification::count());
        $this->assertNull(DatabaseNotification::find('1'));
    }
}
