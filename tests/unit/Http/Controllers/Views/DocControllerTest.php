<?php

class DocControllerTest extends TestCase
{
    public function testRoute()
    {
        // route should be public
        $this->call('GET', '/documentation');
        $this->assertResponseOk();
    }
}
