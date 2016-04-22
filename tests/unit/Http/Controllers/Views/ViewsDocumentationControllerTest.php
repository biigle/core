<?php

class ViewsDocumentationControllerTest extends TestCase
{
    public function testRoute()
    {
        // route should be public
        $this->get('/documentation');
        $this->assertResponseOk();
    }
}
