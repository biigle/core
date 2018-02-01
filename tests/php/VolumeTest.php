<?php

namespace Biigle\Tests;

use File;
use Event;
use Cache;
use Storage;
use Exception;
use Biigle\Role;
use ModelTestCase;
use Biigle\Volume;
use Carbon\Carbon;
use GuzzleHttp\Client;
use GuzzleHttp\Middleware;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Psr7\Response;
use GuzzleHttp\Handler\MockHandler;
use Illuminate\Database\QueryException;
use GuzzleHttp\Exception\RequestException;

class VolumeTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = Volume::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->name);
        $this->assertNotNull($this->model->url);
        $this->assertNotNull($this->model->media_type_id);
        $this->assertNotNull($this->model->creator_id);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
    }

    public function testNameRequired()
    {
        $this->model->name = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testUrlRequired()
    {
        $this->model->url = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testMediaTypeRequired()
    {
        $this->model->mediaType()->dissociate();
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testMediaTypeOnDeleteRestrict()
    {
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->mediaType()->delete();
    }

    public function testCreatorOnDeleteSetNull()
    {
        $this->model->creator()->delete();
        $this->assertNull($this->model->fresh()->creator_id);
    }

    public function testImages()
    {
        $image = ImageTest::create(['volume_id' => $this->model->id]);
        $this->assertEquals($image->id, $this->model->images()->first()->id);
    }

    public function testProjects()
    {
        $project = ProjectTest::create();
        $this->assertEquals(0, $this->model->projects()->count());
        $project->volumes()->attach($this->model);
        $this->assertEquals(1, $this->model->projects()->count());
    }

    public function testSetMediaType()
    {
        $type = MediaTypeTest::create();
        $this->assertNotEquals($type->id, $this->model->mediaType->id);
        $this->model->setMediaType($type);
        $this->assertEquals($type->id, $this->model->mediaType->id);
    }

    public function testSetMediaTypeId()
    {
        $type = MediaTypeTest::create();
        $this->assertNotEquals($type->id, $this->model->mediaType->id);
        $this->model->setMediaTypeId($type->id);
        $this->assertEquals($type->id, $this->model->mediaType->id);

        // media type does not exist
        $this->setExpectedException('Symfony\Component\HttpKernel\Exception\HttpException');
        $this->model->setMediaTypeId(99999);
    }

    public function testCreateImages()
    {
        $this->assertEmpty($this->model->images);
        $return = $this->model->createImages(['1.jpg']);
        $this->assertTrue($return);
        $this->model = $this->model->fresh();
        $this->assertNotEmpty($this->model->images);
        $this->assertEquals('1.jpg', $this->model->images()->first()->filename);
    }

    public function testCreateImagesDuplicateInsert()
    {
        $this->setExpectedException(QueryException::class);
        $return = $this->model->createImages(['1.jpg', '1.jpg']);
    }

    public function testValidateUrlNoDisk()
    {
        $this->model->url = 'test';
        try {
            $this->model->validateUrl();
            $this->assertFalse(true);
        } catch (Exception $e) {
            $this->assertContains('Unable to identify storage disk', $e->getMessage());
        }
    }

    public function testValidateUrlUnknownDisk()
    {
        $this->model->url = 'abc://dir';
        try {
            $this->model->validateUrl();
            $this->assertFalse(true);
        } catch (Exception $e) {
            $this->assertContains("Storage disk 'abc' does not exist", $e->getMessage());
        }
    }

    public function testValidateUrlNotThere()
    {
        Storage::fake('test');
        $this->model->url = 'test://dir';
        try {
            $this->model->validateUrl();
            $this->assertFalse(true);
        } catch (Exception $e) {
            $this->assertContains("Unable to access 'dir'", $e->getMessage());
        }
    }

    public function testValidateUrlOk()
    {
        Storage::fake('test');
        Storage::disk('test')->makeDirectory('dir');
        $this->model->url = 'test://dir';
        $this->assertTrue($this->model->validateUrl());
    }

    public function testValidateUrlRemoteError()
    {
        $this->model->url = 'http://localhost';
        $mock = new MockHandler([new RequestException('Error Communicating with Server', new Request('HEAD', 'test'))]);

        $handler = HandlerStack::create($mock);

        $client = new Client(['handler' => $handler]);
        app()->bind(Client::class, function () use ($client) {
            return $client;
        });
        $this->setExpectedException(Exception::class);
        $this->model->validateUrl();
    }

    public function testValidateUrlRemoteNotReadable()
    {
        $this->model->url = 'http://localhost';
        $mock = new MockHandler([new Response(500)]);

        $handler = HandlerStack::create($mock);
        $client = new Client(['handler' => $handler]);
        app()->bind(Client::class, function () use ($client) {
            return $client;
        });
        $this->setExpectedException(Exception::class);
        $this->model->validateUrl();
    }

    public function testValidateUrlRemoteOk()
    {
        $this->model->url = 'http://localhost';
        $mock = new MockHandler([
            new Response(404),
            new Response(200),
        ]);

        $container = [];
        $history = Middleware::history($container);

        $handler = HandlerStack::create($mock);
        $handler->push($history);
        $client = new Client(['handler' => $handler]);
        app()->bind(Client::class, function () use ($client) {
            return $client;
        });
        $this->assertTrue($this->model->validateUrl());
        $this->assertTrue($this->model->validateUrl());

        $request = $container[0]['request'];
        $this->assertEquals('HEAD', $request->getMethod());
        $this->assertEquals('http://localhost', (string) $request->getUri());
    }

    public function testValidateImagesFormatOk()
    {
        $this->assertTrue($this->model->validateImages(['1.jpg', '2.jpeg', '1.JPG', '2.JPEG']));
        $this->assertTrue($this->model->validateImages(['1.png', '2.PNG']));
        $this->assertTrue($this->model->validateImages(['1.tif', '2.tiff', '2.TIF', '3.TIFF']));
    }

    public function testValidateImagesFormatNotOk()
    {
        $this->setExpectedException(Exception::class);
        $this->model->validateImages(['1.jpg', '2.bmp']);
    }

    public function testValidateImagesDupes()
    {
        $this->setExpectedException(Exception::class);
        $this->model->validateImages(['1.jpg', '1.jpg']);
    }

    public function testValidateImagesEmpty()
    {
        $this->setExpectedException(Exception::class);
        $this->model->validateImages([]);
    }

    public function testHandleNewImages()
    {
        $this->expectsJobs(\Biigle\Jobs\ProcessNewImages::class);
        $this->model->HandleNewImages();
    }

    public function testCastsAttrs()
    {
        $this->model->attrs = [1, 2, 3];
        $this->model->save();
        $this->assertEquals([1, 2, 3], $this->model->fresh()->attrs);
    }

    public function testParseImagesQueryString()
    {
        $return = Volume::parseImagesQueryString('');
        $this->assertEquals([], $return);

        $return = Volume::parseImagesQueryString(', 1.jpg , , 2.jpg, , , ');
        $this->assertEquals(['1.jpg', '2.jpg'], $return);

        $return = Volume::parseImagesQueryString(' 1.jpg ');
        $this->assertEquals(['1.jpg'], $return);
    }

    public function testImageCleanupEventOnDelete()
    {
        Event::shouldReceive('fire')
            ->once()
            ->with('images.cleanup', [[]]);
        Event::shouldReceive('fire'); // catch other events

        $this->model->delete();
    }

    public function testCreateImagesCreatesUuids()
    {
        $this->model->createImages(['1.jpg']);
        $image = $this->model->images()->first();
        $this->assertNotNull($image->uuid);
    }

    public function testAnnotationSessions()
    {
        $this->assertFalse($this->model->annotationSessions()->exists());
        $session = AnnotationSessionTest::create(['volume_id' => $this->model->id]);
        $this->assertTrue($this->model->annotationSessions()->exists());
    }

    public function testActiveAnnotationSession()
    {
        $active = AnnotationSessionTest::create([
            'volume_id' => $this->model->id,
            'starts_at' => Carbon::yesterday(),
            'ends_at' => Carbon::tomorrow(),
        ]);

        AnnotationSessionTest::create([
            'volume_id' => $this->model->id,
            'starts_at' => Carbon::yesterday()->subDay(),
            'ends_at' => Carbon::yesterday(),
        ]);

        $this->assertEquals($active->id, $this->model->activeAnnotationSession->id);
    }

    public function testHasConflictingAnnotationSession()
    {
        $a = AnnotationSessionTest::create([
            'volume_id' => $this->model->id,
            'starts_at' => '2016-09-04',
            'ends_at' => '2016-09-07',
        ]);

        $this->assertFalse($this->model->hasConflictingAnnotationSession($a));

        /*
         * |--a--|
         *  |-b-|
         */
        $b = AnnotationSessionTest::make([
            'volume_id' => $this->model->id,
            'starts_at' => '2016-09-05',
            'ends_at' => '2016-09-06',
        ]);

        $this->assertTrue($this->model->hasConflictingAnnotationSession($b));

        /*
         *   |--a--|
         * |-b-|
         */
        $b = AnnotationSessionTest::make([
            'volume_id' => $this->model->id,
            'starts_at' => '2016-09-03',
            'ends_at' => '2016-09-05',
        ]);

        $this->assertTrue($this->model->hasConflictingAnnotationSession($b));

        /*
         * |--a--|
         *     |-b-|
         */
        $b = AnnotationSessionTest::make([
            'volume_id' => $this->model->id,
            'starts_at' => '2016-09-06',
            'ends_at' => '2016-09-08',
        ]);

        $this->assertTrue($this->model->hasConflictingAnnotationSession($b));

        /*
         *  |--a--|
         * |---b---|
         */
        $b = AnnotationSessionTest::make([
            'volume_id' => $this->model->id,
            'starts_at' => '2016-09-03',
            'ends_at' => '2016-09-08',
        ]);

        $this->assertTrue($this->model->hasConflictingAnnotationSession($b));

        /*
         *     |--a--|
         * |-b-|
         */
        $b = AnnotationSessionTest::make([
            'volume_id' => $this->model->id,
            'starts_at' => '2016-09-03',
            'ends_at' => '2016-09-04',
        ]);

        $this->assertFalse($this->model->hasConflictingAnnotationSession($b));

        /*
         * |--a--|
         *       |-b-|
         */
        $b = AnnotationSessionTest::make([
            'volume_id' => $this->model->id,
            'starts_at' => '2016-09-07',
            'ends_at' => '2016-09-08',
        ]);

        $this->assertFalse($this->model->hasConflictingAnnotationSession($b));

        $b->save();
        $b = $b->fresh();
        // should not count the own annotation session (for updating)
        $this->assertFalse($this->model->hasConflictingAnnotationSession($b));
    }

    public function testUsers()
    {
        $editor = Role::$editor;
        $u1 = UserTest::create();
        $u2 = UserTest::create();
        $u3 = UserTest::create();
        $u4 = UserTest::create();

        $p1 = ProjectTest::create();
        $p1->addUserId($u1, $editor->id);
        $p1->addUserId($u2, $editor->id);
        $p1->volumes()->attach($this->model);

        $p2 = ProjectTest::create();
        $p2->addUserId($u2, $editor->id);
        $p2->addUserId($u3, $editor->id);
        $p2->volumes()->attach($this->model);

        $users = $this->model->users()->get();
        // project creators are counted, too
        $this->assertEquals(5, $users->count());
        $this->assertEquals(1, $users->where('id', $u1->id)->count());
        $this->assertEquals(1, $users->where('id', $u2->id)->count());
        $this->assertEquals(1, $users->where('id', $u3->id)->count());
        $this->assertEquals(0, $users->where('id', $u4->id)->count());
    }

    public function testIsRemote()
    {
        $t = static::create(['url' => '/local/path']);
        $this->assertFalse($t->isRemote());
        $t->url = 'http://remote.path';
        // result was cached
        $this->assertFalse($t->isRemote());
        Cache::flush();
        $this->assertTrue($t->isRemote());
        $t->url = 'https://remote.path';
        Cache::flush();
        $this->assertTrue($t->isRemote());
    }

    public function testOrderedImages()
    {
        ImageTest::create([
            'filename' => 'b.jpg',
            'volume_id' => $this->model->id,
        ]);
        ImageTest::create([
            'filename' => 'a.jpg',
            'volume_id' => $this->model->id,
        ]);
        $this->assertEquals('a.jpg', $this->model->orderedImages()->first()->filename);
    }

    public function testGetThumbnailAttributeNull()
    {
        $this->assertEquals(null, $this->model->thumbnail);
    }

    public function testGetThumbnailAttribute()
    {
        $i1 = ImageTest::create([
            'filename' => 'a.jpg',
            'volume_id' => $this->model->id,
        ]);
        $i2 = ImageTest::create([
            'filename' => 'b.jpg',
            'volume_id' => $this->model->id,
        ]);
        $i3 = ImageTest::create([
            'filename' => 'c.jpg',
            'volume_id' => $this->model->id,
        ]);

        // should be the middle image ordered by name
        $this->assertEquals($i2->uuid, $this->model->thumbnail->uuid);
    }

    public function testHasGeoInfo()
    {
        $this->assertFalse($this->model->hasGeoInfo());
        ImageTest::create([
            'lng' => 5.5,
            'lat' => 5.5,
            'volume_id' => $this->model->id,
        ]);
        $this->assertFalse($this->model->hasGeoInfo());
        $this->model->flushGeoInfoCache();
        $this->assertTrue($this->model->hasGeoInfo());
    }

    public function testLinkAttrs()
    {
        foreach (['video_link', 'gis_link'] as $attr) {
            $this->assertNull($this->model->$attr);

            $this->model->$attr = 'http://example.com';
            $this->model->save();
            $this->assertEquals('http://example.com', $this->model->fresh()->$attr);

            $this->model->$attr = null;
            $this->model->save();
            $this->assertNull($this->model->fresh()->$attr);
        }
    }

    public function testHasTiledImages()
    {
        ImageTest::create(['tiled' => false, 'volume_id' => $this->model->id]);
        $this->assertFalse($this->model->hasTiledImages());
        ImageTest::create(['tiled' => true, 'volume_id' => $this->model->id, 'filename' => 'abc']);
        $this->assertFalse($this->model->hasTiledImages());
        Cache::flush();
        $this->assertTrue($this->model->hasTiledImages());
    }

    public function testSetAndGetDoiAttribute()
    {
        $this->model->doi = '10.3389/fmars.2017.00083';
        $this->model->save();
        $this->assertEquals('10.3389/fmars.2017.00083', $this->model->fresh()->doi);

        $this->model->doi = 'https://doi.org/10.3389/fmars.2017.00083';
        $this->model->save();
        $this->assertEquals('10.3389/fmars.2017.00083', $this->model->fresh()->doi);

        $this->model->doi = 'http://doi.org/10.3389/fmars.2017.00083';
        $this->model->save();
        $this->assertEquals('10.3389/fmars.2017.00083', $this->model->fresh()->doi);
    }
}
