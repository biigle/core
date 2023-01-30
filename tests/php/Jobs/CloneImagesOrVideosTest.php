<?php

namespace Biigle\Tests\Jobs;

use Biigle\Http\Requests\CloneVolume;
use Biigle\Jobs\CloneImagesOrVideos;
use Biigle\Jobs\ProcessNewVolumeFiles;
use Biigle\MediaType;
use Biigle\Role;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageLabelTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoLabelTest;
use Biigle\Tests\VideoTest;
use Biigle\Tests\VolumeTest;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Queue;

class CloneImagesOrVideosTest extends \ApiTestCase
{
    public function testCloneImageVolume()
    {
        $volume = $this->volume(
            ['created_at' => '2022-11-09 14:37:00',
                'updated_at' => '2022-11-09 14:37:00',])->fresh(); // Use fresh() to load even the null fields.
        // The target project.
        $project = ProjectTest::create();

        $oldImage = ImageTest::create([
            'filename' => 'a123.jpg',
            'taken_at' => Carbon::now()->setTimezone('Europe/Lisbon'),
            'volume_id' => $volume->id,
            'lng' => 1.5,
            'lat' => 5.3,
            'tiled' => true])->fresh();
        ImageLabelTest::create(['image_id' => $oldImage->id]);

        $request = new CloneVolume(['project' => $project, 'volume' => $volume]);

        $this->expectsEvents('volume.cloned');
        with(new CloneImagesOrVideos($request))->handle();

        $copy = $project->volumes()->first();

        $this->assertNotNull($copy);
        $this->assertNotEquals($volume->id, $copy->id);
        $this->assertNotEquals($volume->created_at, $copy->created_at);
        $this->assertNotEquals($volume->updated_at, $copy->updated_at);
        $this->assertEmpty($copy->images()->first()->labels()->get());

        $ignore = ['id', 'created_at', 'updated_at'];
        $this->assertEquals(
            $volume->makeHidden($ignore)->toArray(),
            $copy->makeHidden($ignore)->toArray()
        );
    }

    public function testCloneVideoVolume(){
        $volume = VolumeTest::create(
            ['created_at' => '2022-01-09 14:37:00',
                'updated_at' => '2022-01-09 14:37:00',
                'media_type_id' => MediaType::videoId()])->fresh(); // Use fresh() to load even the null fields.
        // The target project.
        $project = ProjectTest::create();

        $oldVideo = VideoTest::create([
            'filename' => 'a321123.jpg',
            'taken_at' => [Carbon::now()->setTimezone('Europe/Lisbon')],
            'volume_id' => $volume->id,
            'lng' => 1.5,
            'lat' => 5.3,
            'duration' => 42.42])->fresh();
        VideoLabelTest::create(['video_id' => $oldVideo->id]);

        $request = new CloneVolume(['project' => $project, 'volume' => $volume]);

        $this->expectsEvents('volume.cloned');
        with(new CloneImagesOrVideos($request))->handle();

        $copy = $project->volumes()->first();

        $this->assertEmpty($copy->videos()->first()->labels()->get());
    }

    public function testCloneVolumeImages()
    {
        $volume = $this->volume([
            'media_type_id' => MediaType::imageId(),
            'created_at' => '2022-11-09 14:37:00',
            'updated_at' => '2022-11-09 14:37:00',
        ])->fresh(); // Use fresh() to load even the null fields.
        // The target project.
        $project = ProjectTest::create();

        $oldImage = ImageTest::create([
            'filename' => 'j.jpg',
            'taken_at' => Carbon::now()->setTimezone('Europe/Lisbon'),
            'volume_id' => $volume->id,
            'lng' => 1.5,
            'lat' => 5.3,
            'tiled' => true])->fresh();
        ImageLabelTest::create(['image_id' => $oldImage->id]);
        $oldImageLabel = $oldImage->labels()->first();

        $request = new CloneVolume(['project' => $project, 'volume' => $volume, 'clone_file_labels' => true]);

        Queue::fake();
        $this->expectsEvents('volume.cloned');
        with(new CloneImagesOrVideos($request))->handle();
        Queue::assertPushed(ProcessNewVolumeFiles::class);

        $copy = $project->volumes()->first();
        $newImage = $copy->images()->first();
        $newImageLabel = $newImage->labels()->first();

        $this->assertNotNull($newImageLabel);
        $this->assertNotNull($newImage);
        $this->assertEquals($volume->images()->count(), $copy->images()->count());
        $this->assertNotEquals($oldImage->id, $newImage->id);
        $this->assertNotEquals($oldImage->uuid, $newImage->uuid);
        $this->assertEquals($copy->id, $newImage->volume_id);
        $this->assertNotEquals($oldImageLabel->id, $newImageLabel->id);
        $this->assertNotEquals($oldImageLabel->image_id, $newImageLabel->image_id);

        $ignore = ['id', 'volume_id', 'uuid'];
        $this->assertEquals(
            $oldImage->makeHidden($ignore)->toArray(),
            $newImage->makeHidden($ignore)->toArray()
        );

        $ignore = ['id', 'image_id'];
        $this->assertEquals(
            $oldImageLabel->makeHidden($ignore)->toArray(),
            $newImageLabel->makeHidden($ignore)->toArray()
        );
    }

    public function testCloneVolumeImagesWithSomeLabels(){

        $volume = VolumeTest::create([
            'media_type_id' => MediaType::imageId(),
            'created_at' => '2022-11-09 14:37:00',
            'updated_at' => '2022-11-09 14:37:00',
        ])->fresh(); // Use fresh() to load even the null fields.
        // The target project.
        $project = ProjectTest::create();

        $oldImage = ImageTest::create([
            'filename' => 'z.jpg',
            'taken_at' => Carbon::now()->setTimezone('Europe/Lisbon'),
            'volume_id' => $volume->id,
            'lng' => 1.5,
            'lat' => 5.3,
            'tiled' => true])->fresh();
        ImageLabelTest::create(['image_id' => $oldImage->id]);
        $oldImage->volume_id = $volume->id;
        $oldImage->save();
        // there are three labels in total
        $l2 = ImageLabelTest::create(['image_id' => $oldImage->id]);
        $l3 = ImageLabelTest::create(['image_id' => $oldImage->id]);

        $request = new CloneVolume(['project' => $project, 'volume' => $volume, 'clone_file_labels' => true,
            'only_file_labels' => [$l2->label_id, $l3->label_id]]);

        with(new CloneImagesOrVideos($request))->handle();

        $copy = $project->volumes()->first();
        $newImage = $copy->images()->first();
        $newImageLabel = $newImage->labels()->get();

        $this->assertEquals(2, $newImageLabel->count());
        $this->assertContains($l2->label_id, $newImageLabel->pluck('label_id'));
        $this->assertContains($l3->label_id, $newImageLabel->pluck('label_id'));
    }

    public function testCloneVolumeVideos()
    {
        $volume = $this->volume([
            'created_at' => '2022-11-09 14:37:00',
            'updated_at' => '2022-11-09 14:37:00',
            'media_type_id' => MediaType::videoId()
        ])->fresh(); // Use fresh() to load even the null fields.
        // The target project.
        $project = ProjectTest::create();

        $oldVideo = VideoTest::create([
            'filename' => 'a.jpg',
            'taken_at' => [Carbon::now()->setTimezone('Europe/Lisbon')],
            'volume_id' => $volume->id,
            'lng' => 1.5,
            'lat' => 5.3,
            'duration' => 42.42])->fresh();
        VideoLabelTest::create(['video_id' => $oldVideo->id]);
        $oldVideoLabel = $oldVideo->labels()->first();

        $request = new CloneVolume(['project' => $project, 'volume' => $volume, 'clone_file_labels' => true]);

        Queue::fake();
        $this->expectsEvents('volume.cloned');
        with(new CloneImagesOrVideos($request))->handle();
        Queue::assertPushed(ProcessNewVolumeFiles::class);

        $copy = $project->volumes()->first();
        $newVideo = $copy->videos()->first();
        $newVideoLabel = $newVideo->labels()->first();

        $this->assertNotNull($newVideo);
        $this->assertNotNull($newVideoLabel);
        $this->assertEquals($volume->videos()->count(), $copy->videos()->count());
        $this->assertNotEquals($oldVideo->id, $newVideo->id);
        $this->assertNotEquals($oldVideo->uuid, $newVideo->uuid);
        $this->assertEquals($copy->id, $newVideo->volume_id);
        $this->assertNotEquals($oldVideoLabel->id, $newVideoLabel->id);
        $this->assertNotEquals($oldVideoLabel->video_id, $newVideoLabel->video_id);

        $ignore = ['id', 'volume_id', 'uuid'];
        $this->assertEquals(
            $oldVideo->makeHidden($ignore)->toArray(),
            $newVideo->makeHidden($ignore)->toArray()
        );

        $ignore = ['id', 'video_id'];
        $this->assertEquals(
            $oldVideoLabel->makeHidden($ignore)->toArray(),
            $newVideoLabel->makeHidden($ignore)->toArray()
        );
    }

    public function testCloneVolumeVideosWithSomeLabels(){
        $volume = VolumeTest::create([
            'created_at' => '2022-11-09 14:37:00',
            'updated_at' => '2022-11-09 14:37:00',
            'media_type_id' => MediaType::videoId()
        ])->fresh(); // Use fresh() to load even the null fields.
        // The target project.
        $project = ProjectTest::create();

        $oldVideo = VideoTest::create([
            'filename' => 'y.jpg',
            'taken_at' => [Carbon::now()->setTimezone('Europe/Lisbon')],
            'volume_id' => $volume->id,
            'lng' => 1.5,
            'lat' => 5.3,
            'duration' => 42.42])->fresh();
        VideoLabelTest::create(['video_id' => $oldVideo->id]);
        $oldVideo->volume_id = $volume->id;
        $oldVideo->save();
        // there are three labels in total
        $l2 = VideoLabelTest::create(['video_id' => $oldVideo->id]);
        $l3 = VideoLabelTest::create(['video_id' => $oldVideo->id]);

        $request = new CloneVolume(['project' => $project, 'volume' => $volume, 'clone_file_labels' => true,
            'only_file_labels' => [$l2->label_id, $l3->label_id]]);

        with(new CloneImagesOrVideos($request))->handle();

        $copy = $project->volumes()->first();
        $newVideo = $copy->videos()->first();
        $newVideoLabels = $newVideo->labels()->get();

        $this->assertEquals(2, $newVideoLabels->count());
        $this->assertContains($l2->label_id, $newVideoLabels->pluck('label_id'));
        $this->assertContains($l3->label_id, $newVideoLabels->pluck('label_id'));
    }

    public function testCloneVolumeImageAnnotations()
    {
        $volume = $this->volume([
            'media_type_id' => MediaType::imageId(),
            'created_at' => '2022-11-09 14:37:00',
            'updated_at' => '2022-11-09 14:37:00',
        ])->fresh(); // Use fresh() to load even the null fields.
        // The target project.
        $project = ProjectTest::create();

        $oldImage = ImageTest::create(['volume_id' => $volume->id])->fresh();
        $oldAnnotation = ImageAnnotationTest::create(['image_id' => $oldImage->id]);
        $oldAnnotationLabel = ImageAnnotationLabelTest::create(['annotation_id' => $oldAnnotation->id]);


        $request = new CloneVolume(['project' => $project, 'volume' => $volume, 'clone_annotations' => true]);

        Queue::fake();
        $this->expectsEvents('volume.cloned');
        with(new CloneImagesOrVideos($request))->handle();
        Queue::assertPushed(ProcessNewVolumeFiles::class);

        $copy = $project->volumes()->first();
        $newImage = $copy->images()->first();
        $newAnnotation = $newImage->annotations()->first();
        $newAnnotationLabel = $newAnnotation->labels()->first();

        $this->assertNotNull($newAnnotation);
        $this->assertNotNull($newAnnotationLabel);
        $this->assertNotEquals($oldAnnotation->id, $newAnnotation->id);
        $this->assertNotEquals($oldAnnotation->image_id, $newAnnotation->image_id);
        $this->assertEquals($newAnnotation->image_id, $newImage->id);
        $this->assertNotEquals($oldAnnotationLabel->id, $newAnnotationLabel->id);
        $this->assertEquals($newAnnotation->id, $newAnnotationLabel->annotation_id);

        $ignore = ['id', 'image_id'];
        $this->assertEquals(
            $oldAnnotation->makeHidden($ignore)->toArray(),
            $newAnnotation->makeHidden($ignore)->toArray()
        );

        $ignore = ['id', 'annotation_id'];
        $this->assertEquals(
            $oldAnnotationLabel->makeHidden($ignore)->toArray(),
            $newAnnotationLabel->makeHidden($ignore)->toArray()
        );
    }

    public function testCloneVolumeImageAnnotationsWithSomeLabels(){
        $volume = VolumeTest::create([
            'media_type_id' => MediaType::imageId(),
            'created_at' => '2022-11-09 14:37:00',
            'updated_at' => '2022-11-09 14:37:00',
        ])->fresh(); // Use fresh() to load even the null fields.
        // The target project.
        $project = ProjectTest::create();

        $oldImage = ImageTest::create(['volume_id' => $volume->id])->fresh();
        $oldAnnotation = ImageAnnotationTest::create(['image_id' => $oldImage->id]);
        $oldImage->volume_id = $volume->id;
        $oldImage->save();
        // there are three labels in total
        $l2 = ImageAnnotationLabelTest::create(['annotation_id' => $oldAnnotation->id]);
        $l3 = ImageAnnotationLabelTest::create(['annotation_id' => $oldAnnotation->id]);

        $request = new CloneVolume(['project' => $project, 'volume' => $volume, 'clone_annotations' => true,
            'only_annotation_labels' => [$l2->label_id, $l3->label_id]]);

        with(new CloneImagesOrVideos($request))->handle();

        $copy = $project->volumes()->first();
        $newImage = $copy->images()->first();
        $newAnnotation = $newImage->annotations()->first();
        $newAnnotationLabels = $newAnnotation->labels()->get();

        $this->assertEquals(2, $newAnnotationLabels->count());
        $this->assertContains($l2->label_id, $newAnnotationLabels->pluck('label_id'));
        $this->assertContains($l3->label_id, $newAnnotationLabels->pluck('label_id'));
    }

    public function testCloneVolumeVideoAnnotations()
    {
        $volume = $this->volume([
            'created_at' => '2022-11-09 14:37:00',
            'updated_at' => '2022-11-09 14:37:00',
            'media_type_id' => MediaType::videoId()
        ])->fresh(); // Use fresh() to load even the null fields.
        // The target project.
        $project = ProjectTest::create();

        $oldVideo = VideoTest::create(['volume_id' => $volume->id])->fresh();
        $oldAnnotation = VideoAnnotationTest::create(['video_id' => $oldVideo->id]);
        $oldAnnotationLabel = VideoAnnotationLabelTest::create(['annotation_id' => $oldAnnotation->id]);

        $request = new CloneVolume(['project' => $project, 'volume' => $volume, 'clone_annotations' => true]);

        Queue::fake();
        $this->expectsEvents('volume.cloned');
        with(new CloneImagesOrVideos($request))->handle();
        Queue::assertPushed(ProcessNewVolumeFiles::class);

        $copy = $project->volumes()->first();
        $newVideo = $copy->videos()->first();
        $newAnnotation = $newVideo->annotations()->first();
        $newAnnotationLabel = $newAnnotation->labels()->first();

        $this->assertNotNull($newAnnotation);
        $this->assertNotNull($newAnnotationLabel);
        $this->assertNotEquals($oldAnnotation->id, $newAnnotation->id);
        $this->assertNotEquals($oldAnnotation->video_id, $newAnnotation->video_id);
        $this->assertEquals($newVideo->id, $newAnnotation->video_id);
        $this->assertNotEquals($oldAnnotationLabel->id, $newAnnotationLabel->id);
        $this->assertEquals($newAnnotation->id, $newAnnotationLabel->annotation_id);

        $ignore = ['id', 'video_id'];
        $this->assertEquals(
            $oldAnnotation->makeHidden($ignore)->toArray(),
            $newAnnotation->makeHidden($ignore)->toArray()

        );

        $ignore = ['id', 'annotation_id'];
        $this->assertEquals(
            $oldAnnotationLabel->makeHidden($ignore)->toArray(),
            $newAnnotationLabel->makeHidden($ignore)->toArray()

        );

    }

    public function testCloneVolumeVideoAnnotationsWithSomeLabels(){
        $volume = VolumeTest::create([
            'media_type_id' => MediaType::videoId(),
            'created_at' => '2022-11-09 14:37:00',
            'updated_at' => '2022-11-09 14:37:00',
        ])->fresh(); // Use fresh() to load even the null fields.
        // The target project.
        $project = ProjectTest::create();

        $oldVideo = VideoTest::create(['volume_id' => $volume->id])->fresh();
        $oldAnnotation = VideoAnnotationTest::create(['video_id' => $oldVideo->id]);
        $oldVideo->volume_id = $volume->id;
        $oldVideo->save();
        // there are three labels in total
        $l2 = VideoAnnotationLabelTest::create(['annotation_id' => $oldAnnotation->id]);
        $l3 = VideoAnnotationLabelTest::create(['annotation_id' => $oldAnnotation->id]);

        $request = new CloneVolume(['project' => $project, 'volume' => $volume, 'clone_annotations' => true,
            'only_annotation_labels' => [$l2->label_id, $l3->label_id]]);

        with(new CloneImagesOrVideos($request))->handle();

        $copy = $project->volumes()->first();
        $newVideo = $copy->videos()->first();
        $newAnnotation = $newVideo->annotations()->first();
        $newAnnotationLabels = $newAnnotation->labels()->get();

        $this->assertEquals(2, $newAnnotationLabels->count());
        $this->assertContains($l2->label_id, $newAnnotationLabels->pluck('label_id'));
        $this->assertContains($l3->label_id, $newAnnotationLabels->pluck('label_id'));
    }

    public function testCloneVolumeIfDoFiles()
    {
        $volume = $this->volume([
            'media_type_id' => MediaType::imageId(),
            'created_at' => '2022-11-09 14:37:00',
            'updated_at' => '2022-11-09 14:37:00',
        ])->fresh();
        // Use fresh() to load even the null fields.

        Storage::fake('ifdos');
        $csv = __DIR__."/../../files/image-ifdo.yaml";
        $file = new UploadedFile($csv, 'ifdo.yaml', 'application/yaml', null, true);
        $volume->saveIfdo($file);

        // The target project.
        $project = ProjectTest::create();

        $request = new CloneVolume(['project' => $project, 'volume' => $volume]);

        $this->expectsEvents('volume.cloned');
        with(new CloneImagesOrVideos($request))->handle();
        $copy = $project->volumes()->first();

        $this->assertNotNull($copy->getIfdo());
        $this->assertTrue($copy->hasIfdo());
        $this->assertEquals($volume->getIfdo(), $copy->getIfdo());
    }

}

