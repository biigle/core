<?php

class ProvidersThumbnailServiceProviderTest extends TestCase
{
    public function testProvidesThumbnailService()
    {
        $service = app()->make('Dias\Contracts\ThumbnailService');
        $this->assertInstanceOf(\Dias\Contracts\ThumbnailService::class, $service);
    }
}
