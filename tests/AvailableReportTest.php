<?php

namespace Dias\Tests\Modules\Export;

use File;
use TestCase;
use Dias\Modules\Export\AvailableReport;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class AvailableReportTest extends TestCase
{
    public function testFindOrFail()
    {
        File::shouldReceive('exists')->once()->andReturn(false);
        $this->setExpectedException(ModelNotFoundException::class);
        AvailableReport::findOrFail('abc');
    }
}
