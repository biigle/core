<?php

namespace Biigle\Tests\Modules\Export\Http\Controllers\Views;

use TestCase;
use Biigle\Tests\Modules\Export\ReportTest;

class ReportsControllerTest extends TestCase
{
    public function testIndex()
    {
        $r1 = ReportTest::create();
        $r2 = ReportTest::create();

        $this->get('reports')->assertResponseStatus(302);

        $this->be($r1->user);
        $this->visit('reports')
            ->see($r1->source->name)
            ->dontSee($r2->source->name);
    }

    public function testIndexDeleted()
    {
        $r1 = ReportTest::create();
        $name= $r1->source->name;
        $r1->source()->delete();

        $this->be($r1->user);
        $this->visit('reports')
            ->see($name);
    }
}
