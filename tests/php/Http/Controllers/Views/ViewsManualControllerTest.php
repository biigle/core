<?php

class ViewsManualControllerTest extends TestCase
{
    public function testRoute()
    {
        // route should be public
        $this->get('/manual');
        $this->assertResponseOk();
    }
}
