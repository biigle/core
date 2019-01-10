<?php

namespace Biigle\Tests\Http\Controllers\Views;

use TestCase;
use Biigle\Role;
use Biigle\Tests\UserTest;
use Illuminate\Support\Facades\View;

class DashboardControllerTest extends TestCase
{
    public function testDashboard()
    {
        $this->get('/')->assertRedirect('login');
        $user = UserTest::create();
        $this->actingAs($user)->get('/')->assertSee('Signed in as');
    }

    public function testLandingPage()
    {
        View::getFinder()->addLocation(__DIR__.'/templates');
        $this->get('/')->assertSee('Landing Page');
        $user = UserTest::create();
        $this->actingAs($user)->get('/')
            ->assertSee('Signed in as')
            ->assertDontSee('Landing Page');
    }
}
