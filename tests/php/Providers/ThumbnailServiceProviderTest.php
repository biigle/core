<?php

namespace Biigle\Tests\Providers;

use TestCase;

class ThumbnailServiceProviderTest extends TestCase
{
    public function testProvidesThumbnailService()
    {
        $service = app()->make('Biigle\Contracts\ThumbnailService');
        $this->assertInstanceOf(\Biigle\Contracts\ThumbnailService::class, $service);
    }
}
