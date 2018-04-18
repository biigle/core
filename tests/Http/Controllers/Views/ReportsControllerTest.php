<?php

namespace Biigle\Tests\Modules\Reports\Http\Controllers\Views;

use TestCase;
use Biigle\Tests\UserTest;

class ReportsControllerTest extends TestCase
{
    public function testIndex()
    {
        $user = UserTest::create();
        $this->get('reports')->assertRedirect('login');
        $this->be($user);
        $this->get('reports')->assertRedirect('search?t=reports');
    }
}
