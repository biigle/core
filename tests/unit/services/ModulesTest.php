<?php

use Dias\Services\Modules;

class ModulesTest extends TestCase
{
    public function testGetMixins()
    {
        $modules = new Modules;
        $modules->addMixin('my_mod', 'dashboard');

        $mixins = $modules->getMixins('nonexistent-view');
        $this->assertEmpty($mixins);

        $mixins = $modules->getMixins('dashboard');
        $this->assertArrayHasKey('my_mod', $mixins);

        $mixins = $modules->getMixins('dashboard.my_mod');
        $this->assertNotNull($mixins);
    }
}
