<?php

namespace Biigle\Tests\Jobs;

use Biigle\Events\VolumeImagesProcessed;
use Biigle\Jobs\CreateNewFilesAndNotifyUser;
use Biigle\Jobs\CreateNewImagesOrVideos;
use Biigle\MediaType;
use Biigle\Tests\VolumeTest;
use Biigle\User;
use Illuminate\Support\Facades\Event;
use Mockery;
use TestCase;

class CreateNewFilesAndNotifyUserTest extends TestCase
{
    public function testHandleImages()
    {
        Event::fake();
        $volume = VolumeTest::create([
            'media_type_id' => MediaType::imageId(),
        ]);
        $user = User::find($volume->creator_id);
        $filenames = ['a.jpg', 'b.jpg'];

        $mock = Mockery::mock(CreateNewImagesOrVideos::class);
        $job = new CreateNewFilesAndNotifyUserStub($volume, $filenames, $user->id);
        $job->subJob = $mock;

        $mock->shouldReceive('handle');
        $job->handle();
        Event::assertDispatched(VolumeImagesProcessed::class);
    }

    public function testHandleVideos()
    {
        Event::fake();
        $volume = VolumeTest::create([
            'media_type_id' => MediaType::videoId(),
        ]);
        $user = User::find($volume->creator_id);
        $filenames = ['a.mp4', 'b.mp4'];

        $mock = Mockery::mock(CreateNewImagesOrVideos::class);
        $job = new CreateNewFilesAndNotifyUserStub($volume, $filenames, $user->id);
        $job->subJob = $mock;

        $mock->shouldReceive('handle');
        $job->handle();
        Event::assertNotDispatched(VolumeImagesProcessed::class);
    }

    public function testHandleMissingCreator()
    {
        Event::fake();
        $volume = VolumeTest::create([
            'media_type_id' => MediaType::imageId(),
        ]);
        $user = User::find($volume->creator_id);
        $filenames = ['a.jpg', 'b.jpg'];

        $mock = Mockery::mock(CreateNewImagesOrVideos::class);
        $job = new CreateNewFilesAndNotifyUserStub($volume, $filenames, $user->id);
        $job->subJob = $mock;

        $mock->shouldReceive('handle');
        $user->delete();
        $job->handle();
        Event::assertNotDispatched(VolumeImagesProcessed::class);
    }
}

class CreateNewFilesAndNotifyUserStub extends CreateNewFilesAndNotifyUser
{

    public $subJob;

    public function getJob()
    {
        return $this->subJob;
    }
}
