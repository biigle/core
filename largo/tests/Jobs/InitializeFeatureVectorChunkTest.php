<?php

namespace Biigle\Tests\Modules\Largo\Jobs;

use Biigle\Image;
use Biigle\ImageAnnotation;
use Biigle\ImageAnnotationLabel;
use Biigle\Modules\Largo\ImageAnnotationLabelFeatureVector;
use Biigle\Modules\Largo\Jobs\InitializeFeatureVectorChunk;
use Biigle\Modules\Largo\Jobs\ProcessAnnotatedFile;
use Biigle\Modules\Largo\VideoAnnotationLabelFeatureVector;
use Biigle\Shape;
use Biigle\VideoAnnotation;
use Biigle\VideoAnnotationLabel;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use League\Flysystem\UnableToReadFile;
use Mockery;
use TestCase;

class InitializeFeatureVectorChunkTest extends TestCase
{
    public function testHandleImages()
    {
        $disk = Storage::fake(config('largo.patch_storage_disk'));
        $al = ImageAnnotationLabel::factory()->create();
        $disk->put(ProcessAnnotatedFile::getTargetPath($al->annotation), 'abc');
        $job = new InitializeFeatureVectorChunkStub([$al->annotation_id], []);
        $job->output = $al->annotation_id.',"'.json_encode(range(0, 383)).'"';
        $job->handle();

        $input = $job->input;
        $this->assertCount(1, $input);
        $path = array_keys($input)[0];
        $this->assertFalse(File::exists($path));
        $item = $input[$path];
        $this->assertArrayHasKey($al->annotation_id, $item);

        $model = ImageAnnotationLabelFeatureVector::find($al->id);
        $this->assertNotNull($model);
        $this->assertSame($al->annotation_id, $model->annotation_id);
        $this->assertSame($al->annotation_id, $model->annotation_id);
        $this->assertSame($al->label_id, $model->label_id);
        $this->assertSame($al->label->label_tree_id, $model->label_tree_id);
        $this->assertSame($al->annotation->image->volume_id, $model->volume_id);
        $this->assertSame(range(0, 383), $model->vector->toArray());
    }

    public function testHandleVideos()
    {
        $disk = Storage::fake(config('largo.patch_storage_disk'));
        $a = VideoAnnotation::factory()->create(['points' => [[10, 10]]]);
        $al = VideoAnnotationLabel::factory()->create(['annotation_id' => $a->id]);
        $disk->put(ProcessAnnotatedFile::getTargetPath($al->annotation), 'abc');
        $job = new InitializeFeatureVectorChunkStub([], [$al->annotation_id]);
        $job->output = $al->annotation_id.',"'.json_encode(range(0, 383)).'"';
        $job->handle();

        $model = VideoAnnotationLabelFeatureVector::find($al->id);
        $this->assertNotNull($model);
        $this->assertSame($al->annotation_id, $model->annotation_id);
        $this->assertSame($al->annotation_id, $model->annotation_id);
        $this->assertSame($al->label_id, $model->label_id);
        $this->assertSame($al->label->label_tree_id, $model->label_tree_id);
        $this->assertSame($al->annotation->video->volume_id, $model->volume_id);
        $this->assertSame(range(0, 383), $model->vector->toArray());
    }

    public function testHandleSkipMissingAnnotations()
    {
        $disk = Storage::fake(config('largo.patch_storage_disk'));
        $al = ImageAnnotationLabel::factory()->create();
        $disk->put(ProcessAnnotatedFile::getTargetPath($al->annotation), 'abc');
        $job = new InitializeFeatureVectorChunkStub([$al->annotation_id], []);
        $job->output = $al->annotation_id.',"'.json_encode(range(0, 383)).'"';
        $al->delete();
        $job->handle();
        $this->assertNull(ImageAnnotationLabelFeatureVector::find($al->id));
    }

    public function testHandleSkipExistingVectors()
    {
        $disk = Storage::fake(config('largo.patch_storage_disk'));
        $al = ImageAnnotationLabel::factory()->create();
        $v = ImageAnnotationLabelFeatureVector::factory()->create([
            'id' => $al->id,
            'annotation_id' => $al->annotation_id,
            'vector' => range(0, 383),
        ]);
        $job = new InitializeFeatureVectorChunkStub([$v->annotation_id], []);
        $job->output = $v->annotation_id.',"'.json_encode(range(1, 384)).'"';
        $job->handle();

        $this->assertSame(range(0, 383), $v->fresh()->vector->toArray());
    }

    public function testHandleSkipMissingThumbnails()
    {
        $disk = Storage::fake(config('largo.patch_storage_disk'));
        $al = ImageAnnotationLabel::factory()->create();
        $job = new InitializeFeatureVectorChunkStub([$al->annotation_id], []);
        $job->output = $al->annotation_id.',"'.json_encode(range(0, 383)).'"';
        $job->handle();
        $this->assertNull(ImageAnnotationLabelFeatureVector::find($al->id));
    }

    public function testHandleSkipMissingThumbnailsException()
    {
        $mock = Mockery::mock();
        $mock->shouldReceive('get')->andThrow(UnableToReadFile::class);
        Storage::shouldReceive('disk')->andReturn($mock);
        $al = ImageAnnotationLabel::factory()->create();
        $job = new InitializeFeatureVectorChunkStub([$al->annotation_id], []);
        $job->output = $al->annotation_id.',"'.json_encode(range(0, 383)).'"';
        $job->handle();
        $this->assertNull(ImageAnnotationLabelFeatureVector::find($al->id));
    }

    public function testHandleMultipleLabels()
    {
        $disk = Storage::fake(config('largo.patch_storage_disk'));
        $al = ImageAnnotationLabel::factory()->create();
        $al2 = ImageAnnotationLabel::factory()->create([
            'annotation_id' => $al->annotation_id,
        ]);
        $disk->put(ProcessAnnotatedFile::getTargetPath($al->annotation), 'abc');
        $job = new InitializeFeatureVectorChunkStub([$al->annotation_id], []);
        $job->output = $al->annotation_id.',"'.json_encode(range(0, 383)).'"';
        $job->handle();

        $model = ImageAnnotationLabelFeatureVector::find($al->id);
        $this->assertNotNull($model);
        $this->assertSame($al->annotation_id, $model->annotation_id);
        $this->assertSame($al->annotation_id, $model->annotation_id);
        $this->assertSame($al->label_id, $model->label_id);
        $this->assertSame($al->label->label_tree_id, $model->label_tree_id);
        $this->assertSame($al->annotation->image->volume_id, $model->volume_id);
        $this->assertSame(range(0, 383), $model->vector->toArray());

        $model = ImageAnnotationLabelFeatureVector::find($al2->id);
        $this->assertNotNull($model);
        $this->assertSame($al2->annotation_id, $model->annotation_id);
        $this->assertSame($al2->annotation_id, $model->annotation_id);
        $this->assertSame($al2->label_id, $model->label_id);
        $this->assertSame($al2->label->label_tree_id, $model->label_tree_id);
        $this->assertSame($al2->annotation->image->volume_id, $model->volume_id);
        $this->assertSame(range(0, 383), $model->vector->toArray());
    }

    public function testHandlePoint()
    {
        $disk = Storage::fake(config('largo.patch_storage_disk'));
        $image = Image::factory()->create([
            'attrs' => ['width' => 200, 'height' => 200],
        ]);
        $a = ImageAnnotation::factory()->create([
            'shape_id' => Shape::pointId(),
            'points' => [100, 100],
            'image_id' => $image->id,
        ]);
        $al = ImageAnnotationLabel::factory()->create(['annotation_id' => $a->id]);
        $disk->put(ProcessAnnotatedFile::getTargetPath($al->annotation), 'abc');
        $job = new InitializeFeatureVectorChunkStub([$al->annotation_id], []);
        $job->output = $al->annotation_id.',"'.json_encode(range(0, 383)).'"';
        $job->handle();

        $input = $job->input;
        $path = array_keys($input)[0];
        $item = $input[$path];
        $this->assertSame([23, 0, 158, 135], $item[$a->id]);
    }

    public function testHandleCircle()
    {
        $disk = Storage::fake(config('largo.patch_storage_disk'));
        $image = Image::factory()->create([
            'attrs' => ['width' => 200, 'height' => 200],
        ]);
        $a = ImageAnnotation::factory()->create([
            'shape_id' => Shape::circleId(),
            'points' => [100, 100, 10],
            'image_id' => $image->id,
        ]);
        $al = ImageAnnotationLabel::factory()->create(['annotation_id' => $a->id]);
        $disk->put(ProcessAnnotatedFile::getTargetPath($al->annotation), 'abc');
        $job = new InitializeFeatureVectorChunkStub([$al->annotation_id], []);
        $job->output = $al->annotation_id.',"'.json_encode(range(0, 383)).'"';
        $job->handle();

        $input = $job->input;
        $path = array_keys($input)[0];
        $item = $input[$path];
        $this->assertSame([70, 47, 110, 87], $item[$a->id]);
    }

    public function testHandlePolygon()
    {
        $disk = Storage::fake(config('largo.patch_storage_disk'));
        $image = Image::factory()->create([
            'attrs' => ['width' => 200, 'height' => 200],
        ]);
        $a = ImageAnnotation::factory()->create([
            'shape_id' => Shape::polygonId(),
            'points' => [100, 90, 110, 100, 100, 110, 90, 100],
            'image_id' => $image->id,
        ]);
        $al = ImageAnnotationLabel::factory()->create(['annotation_id' => $a->id]);
        $disk->put(ProcessAnnotatedFile::getTargetPath($al->annotation), 'abc');
        $job = new InitializeFeatureVectorChunkStub([$al->annotation_id], []);
        $job->output = $al->annotation_id.',"'.json_encode(range(0, 383)).'"';
        $job->handle();

        $input = $job->input;
        $path = array_keys($input)[0];
        $item = $input[$path];
        $this->assertSame([70, 47, 110, 87], $item[$a->id]);
    }

    public function testHandleWholeFrame()
    {
        $disk = Storage::fake(config('largo.patch_storage_disk'));
        $image = Image::factory()->create([
            'attrs' => ['width' => 200, 'height' => 200],
        ]);
        $a = ImageAnnotation::factory()->create([
            'shape_id' => Shape::wholeFrameId(),
            'image_id' => $image->id,
        ]);
        $al = ImageAnnotationLabel::factory()->create(['annotation_id' => $a->id]);
        $disk->put(ProcessAnnotatedFile::getTargetPath($al->annotation), 'abc');
        $job = new InitializeFeatureVectorChunkStub([$al->annotation_id], []);
        $job->output = $al->annotation_id.',"'.json_encode(range(0, 383)).'"';
        $job->handle();

        $input = $job->input;
        $path = array_keys($input)[0];
        $item = $input[$path];
        $this->assertSame([0, 0, 180, 135], $item[$a->id]);
    }
}

class InitializeFeatureVectorChunkStub extends InitializeFeatureVectorChunk
{
    public array $input = [];
    public string $output = '';

    protected function python(string $inputPath, string $outputPath)
    {
        $this->input = json_decode(File::get($inputPath), true);
        File::put($outputPath, $this->output);
    }
}
