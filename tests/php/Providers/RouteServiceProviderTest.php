<?php

namespace Biigle\Tests\Providers;

use ApiTestCase;

class RouteServiceProviderTest extends ApiTestCase
{
    public function testRoutePatterns()
    {
        $this->beUser();
        $this->get('/api/v1/shapes/53685369932')->assertStatus(404);
    }
}
