<?php

class RemoveDeletedImagesTest extends TestCase
{
    public function testHandle()
    {
        $image = ImageTest::create();
        $image->transect()->delete();
        Event::shouldReceive('fire')->with('images.cleanup', [$image->id], false);
        Artisan::call('remove-deleted-images');
    }
}
