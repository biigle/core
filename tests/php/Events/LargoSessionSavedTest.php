<?php

namespace Biigle\Tests\Events;

use Biigle\Events\LargoSessionSaved;
use Biigle\Tests\UserTest;
use TestCase;

class LargoSessionSavedTest extends TestCase
{
    public function testBroadcastWith()
    {
        $event = new LargoSessionSaved('job_id', UserTest::create());
        $this->assertSame([
            'id' => 'job_id',
            'kept_dismissed_labels' => false,
            'kept_replaced_labels' => false,
        ], $event->broadcastWith());

        $event = new LargoSessionSaved('job_id', UserTest::create(), true, true);
        $this->assertSame([
            'id' => 'job_id',
            'kept_dismissed_labels' => true,
            'kept_replaced_labels' => true,
        ], $event->broadcastWith());
    }
}
