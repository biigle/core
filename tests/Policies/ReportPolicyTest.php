<?php

namespace Biigle\Tests\Modules\Export\Policies;

use TestCase;
use Biigle\Tests\UserTest;
use Biigle\Modules\Export\Report;
use Biigle\Tests\Modules\Export\ReportTest;

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
