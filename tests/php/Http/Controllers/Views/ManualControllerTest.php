<?php

namespace Biigle\Tests\Http\Controllers\Views;

use View;
use TestCase;

class ManualControllerTest extends TestCase
{
    public function testRoute()
    {
        // route should be public
        $response = $this->get('/manual');
        $response->assertStatus(200);
    }

    public function testTutorialsAricle()
    {
        View::shouldReceive('share');
        View::shouldReceive('exists')->twice()->andReturn(true);
        View::shouldReceive('make')->once()->with('manual.tutorials.whole-playlist');
        View::shouldReceive('make')->once()->with('module::manual.tutorials.whole-playlist');

        $response = $this->get('/manual/tutorials/whole-playlist');
        $response = $this->get('/manual/tutorials/module/whole-playlist');
    }

    public function testDocumentationAricle()
    {
        View::shouldReceive('share');
        View::shouldReceive('exists')->twice()->andReturn(true);
        View::shouldReceive('make')->once()->with('manual.documentation.whole-playlist');
        View::shouldReceive('make')->once()->with('module::manual.documentation.whole-playlist');

        $response = $this->get('/manual/documentation/whole-playlist');
        $response = $this->get('/manual/documentation/module/whole-playlist');
    }
}
