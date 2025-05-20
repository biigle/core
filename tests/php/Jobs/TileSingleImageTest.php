<?php

namespace Biigle\Tests\Jobs;

use File;
use Mockery;
use Storage;
use TestCase;
use Exception;
use Aws\Result;
use Aws\Command;
use ArrayIterator;
use Aws\MockHandler;
use Aws\S3\S3Client;
use Jcupitt\Vips\Image;
use Biigle\Tests\ImageTest;
use GuzzleHttp\Psr7\Response;
use Biigle\Jobs\TileSingleImage;
use Aws\S3\Exception\S3Exception;

class TileSingleImageTest extends TestCase
{
    public function testGenerateTiles()
    {
        $image = ImageTest::create();
        $job = new TileSingleImageStub($image);

        $mock = Mockery::mock(Image::class);
        $mock->shouldReceive('dzsave')
            ->once()
            ->with($job->tempPath, [
                'layout' => 'zoomify',
                'container' => 'fs',
                'strip' => true,
            ]);

        $job->mock = $mock;

        $job->generateTiles($image, '');
    }

    public function testUploadToStorage()
    {
        config(['image.tiles.disk' => 'tiles']);
        $image = ImageTest::create();
        $fragment = fragment_uuid_path($image->uuid);
        $job = new TileSingleImageStub($image);
        File::makeDirectory($job->tempPath);
        File::put("{$job->tempPath}/test.txt", 'test');

        try {
            Storage::fake('tiles');
            $job->uploadToStorage();
            Storage::disk('tiles')->assertExists($fragment);
            Storage::disk('tiles')->assertExists("{$fragment}/test.txt");
        } finally {
            File::deleteDirectory($job->tempPath);
        }
    }

    public function testUploadToS3Storage()
    {
        config(['image.tiles.nbr_concurrent_requests' => 2]);

        $mock = new MockHandler();
        $mock->append(
            new Result(),
            new Result(),
            new Result(),
        );

        $client = new S3Client([
            'region' => 'test',
            'handler' => $mock,
            'credentials' => [
                'key' => 'fake-key',
                'secret' => 'fake-secret',
            ],
        ]);

        // Treat images as tiles for Biigle\Image
        $tiles = ['test-image.jpg', 'test-image.png', 'exif-test.jpg'];

        $image = ImageTest::create();
        $job = new TileSingleImageStub($image);
        $job->client = $client;
        $job->files = $tiles;
        $job->useParentGetIterator = false;

        $job->uploadToS3Storage();

        $this->assertEquals($tiles, $job->uploadedFiles);
    }

    public function testUploadToS3StorageThrowException()
    {
        config(['image.tiles.nbr_concurrent_requests' => 2]);

        $mock = new MockHandler();
        $mock->append(
            new Result(),
            new Result(),
            new S3Exception("test", new Command("mockCommand"), [
                'code' => 'mockCode',
                'response' => new Response(400)
            ]),
        );

        $client = new S3Client([
            'region' => 'test',
            'handler' => $mock,
            'credentials' => [
                'key' => 'fake-key',
                'secret' => 'fake-secret',
            ],
        ]);

        // Treat images as tiles for Biigle\Image
        $tiles = ['test-image.jpg', 'test-image.png', 'exif-test.jpg'];

        $image = ImageTest::create();
        $job = new TileSingleImageStub($image);
        $job->client = $client;
        $job->files = $tiles;
        $job->useParentGetIterator = false;

        $fails = false;
        try {
            $job->uploadToS3Storage();
        } catch (Exception $e) {
            $fails = true;
        }

        $this->assertTrue($fails);
    }

    public function testQueue()
    {
        config(['image.tiles.queue' => 'myqueue']);
        $image = ImageTest::create();
        $job = new TileSingleImageStub($image);
        $this->assertSame('myqueue', $job->queue);
    }
}

class TileSingleImageStub extends TileSingleImage
{
    public $mock;
    public $client;

    public $useParentGetIterator = true;

    public $files = [];

    public $uploadedFiles = [];

    protected function getVipsImage($path)
    {
        return $this->mock;
    }

    protected function getClient($disk)
    {
        return $this->client;
    }

    protected function getBucket($disk)
    {
        return "test-bucket";
    }

    protected function getIterator($path)
    {
        if ($this->useParentGetIterator) {
            return parent::getIterator($path);
        }

        $files = [];
        foreach ($this->files as $file) {
            $files[] = "tests/files/{$file}";
        }

        return new ArrayIterator($files);
    }

    protected function sendRequests($files, $onFullfill, $onReject)
    {
        $onFullfill2 = function ($res, $index) use ($onFullfill) {
            $onFullfill($res, $index);
            $this->uploadedFiles[$index] = basename($res->get('ObjectURL'));
        };
        parent::sendRequests($files, $onFullfill2, $onReject);
    }

    public function uploadToS3Storage($retry = 3)
    {
        parent::uploadToS3Storage(1);
    }

}
