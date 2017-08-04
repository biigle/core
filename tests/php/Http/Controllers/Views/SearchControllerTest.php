<?php

namespace Biigle\Tests\Http\Controllers\Views;

use TestCase;
use Biigle\Tests\UserTest;

class SearchControllerTest extends TestCase
{
    public function testIndexWhenNotLoggedIn()
    {
        $this->visit('search')->seePageIs('login');
    }

    public function testIndexWhenLoggedIn()
    {
        $this->actingAs(UserTest::create())->visit('search')->seePageIs('search');
    }
}
