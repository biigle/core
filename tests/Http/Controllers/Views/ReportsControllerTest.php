<?php

namespace Biigle\Tests\Modules\Export\Http\Controllers\Views;

use TestCase;
use Biigle\Tests\UserTest;

class ReportsControllerTest extends TestCase
{
    public function testIndex()
    {
        $user = UserTest::create();
        $this->visit('reports')->seePageIs('login');
        $this->be($user);
        $this->visit('reports')->seePageIs('search?t=reports');
    }
}
