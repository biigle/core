<?php

use Dias\Services\Modules;

class ModulesTest extends TestCase {

	public function testGetMixins() {
		$modules = new Modules;
		$modules->addMixin('my_mod', 'dashboard');

		$mixins = $modules->getMixins('nonexistent-view');
		$this->assertEmpty($mixins);

		$mixins = $modules->getMixins('dashboard');
		$this->assertNotEmpty($mixins);
		$this->assertEquals($mixins[0], 'my_mod::dashboard');
	}

}