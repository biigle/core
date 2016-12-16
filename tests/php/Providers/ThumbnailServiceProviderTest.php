<?php

namespace Dias\Tests\Providers;

use TestCase;

class ThumbnailServiceProviderTest extends TestCase
{
    public function testProvidesThumbnailService()
    {
        $service = app()->make('Dias\Contracts\ThumbnailService');
        $this->assertInstanceOf(\Dias\Contracts\ThumbnailService::class, $service);
    }
}
