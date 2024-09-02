<?php

namespace Biigle\Tests\Services;

use Modules;
use TestCase;

class ModulesTest extends TestCase
{
    public function testGetViewMixins()
    {
        Modules::registerViewMixin('myModule', 'dashboard');

        $this->assertEmpty(Modules::getViewMixins('nonexistent-view'));
        $this->assertArrayHasKey('myModule', Modules::getViewMixins('dashboard'));
        $this->assertNotNull(Modules::getViewMixins('dashboard.myModule'));
    }

    public function testGetControllerMixins()
    {
        $func = function () {
            //
        };
        Modules::registerControllerMixin('myModule', 'dashboard', $func);

        $this->assertEmpty(Modules::getControllerMixins('nonexistent'));
        $this->assertSame(['myModule' => $func], Modules::getControllerMixins('dashboard'));
    }

    public function testRegister()
    {
        $func = function () {
            //
        };

        Modules::register('myModule', [
            'viewMixins' => ['dashboard', 'settings'],
            'controllerMixins' => ['dashboard' => $func],
            'apidoc' => ['my/path'],
        ]);

        $this->assertArrayHasKey('myModule', Modules::getViewMixins('dashboard'));
        $this->assertArrayHasKey('myModule', Modules::getViewMixins('settings'));
        $this->assertSame(['myModule' => $func], Modules::getControllerMixins('dashboard'));
        $this->assertContains('my/path', Modules::getApidocPaths());
    }

    public function testRegisterViewMixinOrdering()
    {
        Modules::registerViewMixin('subtest', 'index.test');
        Modules::registerViewMixin('test', 'index');
        $this->assertSame(['test' => ['subtest' => []]], Modules::getViewMixins('index'));
    }

    public function testCallControllerMixins()
    {
        Modules::registerControllerMixin('myModule', 'dashboard', fn ($arg) => ['callable' => true]);
        Modules::registerControllerMixin('myModule2', 'dashboard', ControllerMixinStub::class.'@call');

        $values = Modules::callControllerMixins('dashboard', ['arg' => 1]);
        $this->assertSame(['callable' => true, 'callableWithAtSign' => true], $values);
    }
}

class ControllerMixinStub
{
    public function call($arg)
    {
        return ['callableWithAtSign' => true];
    }
}
