<?php

namespace Biigle\Tests\Policies;

use Biigle\Tests\ReportTest;
use Biigle\Tests\UserTest;
use TestCase;

class ReportPolicyTest extends TestCase
{
    public function testAccess()
    {
        $report = ReportTest::make();
        $user = UserTest::create();

        $this->assertFalse($user->can('access', $report));
        $this->assertTrue($report->user->can('access', $report));
    }
}
