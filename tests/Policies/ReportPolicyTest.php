<?php

namespace Biigle\Tests\Modules\Reports\Policies;

use TestCase;
use Biigle\Tests\UserTest;
use Biigle\Modules\Reports\Report;
use Biigle\Tests\Modules\Reports\ReportTest;

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
