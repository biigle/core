<?php

namespace Biigle\Tests\Http\Controllers\Views;

use TestCase;
use Biigle\Tests\UserTest;

class SearchControllerTest extends TestCase
{
    public function testIndexWhenNotLoggedIn()
    {
        $this->get('search')->assertRedirect('login');
    }

    public function testIndexWhenLoggedIn()
    {
        $this->actingAs(UserTest::create())->get('search')->assertViewIs('search.index');
    }
}
