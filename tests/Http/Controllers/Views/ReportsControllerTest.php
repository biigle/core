<?php

namespace Biigle\Tests\Modules\Reports\Http\Controllers\Views;

use Biigle\Tests\UserTest;
use TestCase;

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
