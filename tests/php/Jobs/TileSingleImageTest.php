<?php

namespace Biigle\Tests\Jobs;

use ArrayIterator;
use Aws\Command;
use Aws\MockHandler;
use Aws\Result;
use Aws\S3\Exception\S3Exception;
use Aws\S3\S3Client;
use Biigle\Jobs\TileSingleImage;
use Biigle\Tests\ImageTest;
use Composer\InstalledVersions;
use File;
use GuzzleHttp\Psr7\Response;
use Jcupitt\Vips\Image;
use Mockery;
use Storage;
use Symfony\Component\HttpFoundation\File\Exception\UploadException;
use TestCase;

class TileSingleImageTest extends TestCase
{

    public $awsPackage = 'aws/aws-sdk-php';

    public $s3Config = null;

    public function setUp(): void
    {
        parent::setUp();
        $this->s3Config = [
            "driver" => "s3",
            "key" => "key",
            "secret" => "secret",
            "region" => "us-east-1",
            "bucket" => "bucket",
            "url" => "https://s3.aws.com/bucket",
            "endpoint" => "https://s3.aws.com/",
            "use_path_style_endpoint" => true,
            "version" => "latest",
            "credentials" => [
                "key" => "key",
                "secret" => "secret",
            ],
            'retries' => 3
        ];
    }

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
        if (!InstalledVersions::isInstalled($this->awsPackage)) {
            $this->markTestSkipped();
        }

        config(['image.tiles.concurrent_requests' => 2]);

        $mock = new MockHandler();
        $mock->append(
            new Result(),
            new Result(),
            new Result(),
        );

        $disk = Storage::fake('test-tiles');
        $client = new S3Client($this->s3Config);
        $client->getHandlerList()->setHandler($mock);

        // Treat images as tiles for Biigle\Image
        $tiles = ['exif-test.jpg', 'test-image.jpg', 'test-image.png'];

        $image = ImageTest::create();
        $job = new TileSingleImageStub($image);
        $job->files = $tiles;
        $job->useParentGetIterator = false;
        $job->client = $client;
        $job->disk = $disk;

        $job->uploadToS3Storage($disk);

        $uploadedFiles = array_map(fn ($f) => basename($f), $disk->allFiles());

        $this->assertEquals($tiles, $uploadedFiles);
    }

    public function testUploadToS3StorageThrowException()
    {
        if (!InstalledVersions::isInstalled($this->awsPackage)) {
            $this->markTestSkipped();
        }

        config(['image.tiles.concurrent_requests' => 2]);

        $mock = new MockHandler();
        $mock->append(
            new Result(),
            new S3Exception("test", new Command("mockCommand"), [
                'code' => 'mockCode',
                'response' => new Response(500)
            ]),
            new Result(),
        );

        $disk = Storage::fake('test-tiles');
        $config = [...$this->s3Config];
        $config['retries'] = 0;
        $client = new S3Client($config);
        $client->getHandlerList()->setHandler($mock);

        // Treat images as tiles for Biigle\Image
        $tiles = ['test-image.jpg', 'test-image.png', 'exif-test.jpg'];

        $image = ImageTest::create();
        $job = new TileSingleImageStub($image);
        $job->files = $tiles;
        $job->useParentGetIterator = false;
        $job->client = $client;
        $job->disk = $disk;

        $fails = false;
        try {
            $job->uploadToS3Storage($disk);
        } catch (UploadException $e) {
            $fails = true;
        }

        $this->assertTrue($fails);
        $this->assertDirectoryDoesNotExist($disk->path(fragment_uuid_path($image->uuid)));
    }

    public function testUploadToS3StorageTilesExist()
    {
        if (!InstalledVersions::isInstalled($this->awsPackage)) {
            $this->markTestSkipped();
        }

        config(['image.tiles.concurrent_requests' => 2]);

        $mock = new MockHandler();
        $mock->append(
            new Result(),
            // Simulate upload attempt when tile already exists
            new S3Exception("test", new Command("mockCommand"), [
                'code' => 'mockCode',
                'response' => new Response(412)
            ]),
            new Result(),
        );

        $disk = Storage::fake('test-tiles');
        $config = [...$this->s3Config];
        $config['retries'] = 0;
        $client = new S3Client($config);
        $client->getHandlerList()->setHandler($mock);

        // Treat images as tiles for Biigle\Image
        $tiles = ['test-image.jpg', 'test-image.png', 'exif-test.jpg'];

        $image = ImageTest::create();
        $job = new TileSingleImageStub($image);
        $job->files = $tiles;
        $job->useParentGetIterator = false;
        $job->client = $client;
        $job->disk = $disk;

        $fails = false;
        try {
            $job->uploadToS3Storage($disk);
        } catch (UploadException $e) {
            $fails = true;
        }

        $this->assertTrue($fails);
        $this->assertDirectoryDoesNotExist($disk->path(fragment_uuid_path($image->uuid)));
    }

    public function testUploadToS3StorageRetryUpload()
    {
        if (!InstalledVersions::isInstalled($this->awsPackage)) {
            $this->markTestSkipped();
        }

        config(['image.tiles.concurrent_requests' => 2]);

        $mock = new MockHandler();
        $mock->append(
            new Result(),
            new Result(),
            new S3Exception("test", new Command("mockCommand"), [
                'code' => 'mockCode',
                'response' => new Response(500)
            ]),
        );

        // Retry
        $mock->append(
            new Result(),
        );

        $disk = Storage::fake('test-tiles');
        $config = [...$this->s3Config];
        $config['retries'] = 1;
        $client = new S3Client($config);
        $client->getHandlerList()->setHandler($mock);

        // Treat images as tiles for Biigle\Image
        $tiles = ['exif-test.jpg', 'test-image.jpg', 'test-image.png'];

        $image = ImageTest::create();
        $job = new TileSingleImageStub($image);
        $job->files = $tiles;
        $job->useParentGetIterator = false;
        $job->client = $client;
        $job->disk = $disk;

        $job->uploadToS3Storage($disk);

        $uploadedFiles = array_map(fn ($f) => basename($f), $disk->allFiles());

        $this->assertEquals($tiles, $uploadedFiles);
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

    public $useParentGetIterator = true;

    public $files = [];

    public $client = null;

    public $disk = null;

    protected function getVipsImage($path)
    {
        return $this->mock;
    }

    protected function getClient($disk): S3Client
    {
        return $this->client;
    }

    protected function getBucket($disk)
    {
        return 'bucket';
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

    protected function sendRequests($files, $onFullfill = null, $onReject = null)
    {
        $onFullfill = function ($res, $index) {
            // Simulate file upload
            $fragment = fragment_uuid_path($this->image->uuid);
            $path = $fragment . "/" . basename($res->get('ObjectURL'));
            $this->disk->put($path, "test");
        };
        return parent::sendRequests($files, $onFullfill, $onReject);
    }
}
