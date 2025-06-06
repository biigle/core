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
use Exception;
use File;
use GuzzleHttp\Psr7\Response;
use Jcupitt\Vips\Image;
use Mockery;
use Storage;
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

        $disk = Mockery::mock();
        $client = new S3Client($this->s3Config);
        $client->getHandlerList()->setHandler($mock);

        // Treat images as tiles for Biigle\Image
        $tiles = ['test-image.jpg', 'test-image.png', 'exif-test.jpg'];

        $image = ImageTest::create();
        $job = new TileSingleImageStub($image);
        $job->files = $tiles;
        $job->useParentGetIterator = false;
        $job->client = $client;

        $job->uploadToS3Storage($disk);

        $this->assertEquals($tiles, $job->uploadedFiles);
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

        $disk = Mockery::mock();
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

        $fails = false;
        try {
            $job->uploadToS3Storage($disk);
        } catch (Exception $e) {
            $fails = true;
        }

        $this->assertTrue($fails);
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

        $disk = Mockery::mock();
        $config = [...$this->s3Config];
        $config['retries'] = 1;
        $client = new S3Client($config);
        $client->getHandlerList()->setHandler($mock);

        // Treat images as tiles for Biigle\Image
        $tiles = ['test-image.jpg', 'test-image.png', 'exif-test.jpg'];

        $image = ImageTest::create();
        $job = new TileSingleImageStub($image);
        $job->files = $tiles;
        $job->useParentGetIterator = false;
        $job->client = $client;

        $job->uploadToS3Storage($disk);

        $this->assertEquals($tiles, $job->uploadedFiles);
    }

    public function testUploadToS3StorageThrowNoException()
    {
        if (!InstalledVersions::isInstalled($this->awsPackage)) {
            $this->markTestSkipped();
        }

        config(['image.tiles.concurrent_requests' => 2]);

        $mock = new MockHandler();
        $mock->append(
            new Result(),
            // Simulate that the file has already been uploaded
            new S3Exception("test", new Command("mockCommand"), [
                'code' => 'mockCode',
                'response' => new Response(412)
            ]),
            new Result(),
        );

        $disk = Mockery::mock();
        $config = [...$this->s3Config];
        $client = new S3Client($config);
        $client->getHandlerList()->setHandler($mock);

        // Treat images as tiles for Biigle\Image
        $tiles = ['test-image.jpg', 'test-image.png', 'exif-test.jpg'];

        $image = ImageTest::create();
        $job = new TileSingleImageStub($image);
        $job->files = $tiles;
        $job->useParentGetIterator = false;
        $job->client = $client;

        $job->uploadToS3Storage($disk);

        $this->assertEquals(['test-image.jpg', 'exif-test.jpg'], $job->uploadedFiles);
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

    public $uploadedFiles = [];

    public $client = null;

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
            $this->uploadedFiles[] = basename($res->get('ObjectURL'));
        };
        return parent::sendRequests($files, $onFullfill, $onReject);
    }
}
