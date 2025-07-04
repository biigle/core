<?php

namespace Biigle\Tests\Jobs;

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
        File::makeDirectory(path: $job->tempPath, recursive: true);
        File::put("{$job->tempPath}/test.txt", 'test');

        try {
            $disk = Storage::fake('tiles');
            $job->uploadToStorage($disk);
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

        $image = ImageTest::create();
        $fragment = fragment_uuid_path($image->uuid);

        $job = new TileSingleImageStub($image);
        $dir = $job->tempPath . "/TilesGroup0";
        File::makeDirectory(path: $dir, recursive: true);
        File::put("{$dir}/0-0-0.jpg", 'test');
        File::put("{$dir}/0-0-1.jpg", 'test');
        File::put("{$dir}/0-0-3.jpg", 'test');

        try {
            $job->useParentGetIterator = false;
            $job->client = $client;

            $job->uploadToS3Storage($disk);

            $tiles = array_map(fn ($f) => "/tmp/{$fragment}/TilesGroup0/" . $f->getFilename(), File::allFiles($dir));
            $uploadedFiles = $job->uploadedFiles;

            sort($tiles);
            sort($uploadedFiles);

            $this->assertEquals($tiles, $uploadedFiles);
        } finally {
            File::deleteDirectory($dir);
        }
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

        $image = ImageTest::create();
        $job = new TileSingleImageStub($image);
        $dir = $job->tempPath . "/TilesGroup0";
        File::makeDirectory(path: $dir, recursive: true);
        File::put("{$dir}/0-0-0.jpg", 'test');
        File::put("{$dir}/0-0-1.jpg", 'test');
        File::put("{$dir}/0-0-3.jpg", 'test');
        $fails = false;

        try {
            $job->useParentGetIterator = false;
            $job->client = $client;

            $job->uploadToS3Storage($disk);

            $tiles = array_map(fn ($f) => $f->getPathname(), File::allFiles($dir));
            $uploadedFiles = $job->uploadedFiles;

            $this->assertEquals($tiles, $uploadedFiles);
        } catch (UploadException $e) {
            $fails = true;
        } finally {
            File::deleteDirectory($dir);
        }

        $this->assertTrue($fails);
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
        $image = ImageTest::create();
        $job = new TileSingleImageStub($image);
        $dir = $job->tempPath . "/TilesGroup0";
        $fails = false;

        File::makeDirectory(path: $dir, recursive: true);
        File::put("{$dir}/0-0-0.jpg", 'test');
        File::put("{$dir}/0-0-1.jpg", 'test');
        File::put("{$dir}/0-0-3.jpg", 'test');

        try {
            $job->useParentGetIterator = false;
            $job->client = $client;

            $job->uploadToS3Storage($disk);

            $tiles = array_map(fn ($f) => $f->getPathname(), File::allFiles($dir));
            $uploadedFiles = $job->uploadedFiles;

            $this->assertEquals($tiles, $uploadedFiles);
        } catch (UploadException $e) {
            $fails = true;
        } finally {
            File::deleteDirectory($dir);
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

        $disk = Storage::fake('test-tiles');
        $config = [...$this->s3Config];
        $config['retries'] = 1;
        $client = new S3Client($config);
        $client->getHandlerList()->setHandler($mock);

        $image = ImageTest::create();
        $fragment = fragment_uuid_path($image->uuid);
        $job = new TileSingleImageStub($image);
        $dir = $job->tempPath . "/TilesGroup0";
        File::makeDirectory(path: $dir, recursive: true);
        File::put("{$dir}/0-0-0.jpg", 'test');
        File::put("{$dir}/0-0-1.jpg", 'test');
        File::put("{$dir}/0-0-3.jpg", 'test');

        try {
            $job->useParentGetIterator = false;
            $job->client = $client;

            $job->uploadToS3Storage($disk);

            $tiles = array_map(fn ($f) => "/tmp/{$fragment}/TilesGroup0/" . $f->getFilename(), File::allFiles($dir));
            $uploadedFiles = $job->uploadedFiles;

            sort($tiles);
            sort($uploadedFiles);

            $this->assertEquals($tiles, $uploadedFiles);
        } finally {
            File::deleteDirectory($dir);
        }
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

    public $files = [];

    public $client = null;

    public $uploadedFiles = [];

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

    protected function sendRequests($files, $onFullfill = null)
    {
        $onFullfill = function ($res, $index) {
            // Simulate file upload
            $bucketLength = 8;
            $path = substr(parse_url($res->get('ObjectURL'), PHP_URL_PATH), $bucketLength);
            $this->uploadedFiles[] = config('image.tiles.tmp_dir') ."/{$path}";
        };
        return parent::sendRequests($files, $onFullfill);
    }
}
