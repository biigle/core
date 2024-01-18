<?php

namespace Biigle\Tests\Modules\Largo\Jobs;

use Biigle\ImageAnnotationLabel;
use Biigle\Modules\Largo\ImageAnnotationLabelFeatureVector;
use Biigle\Modules\Largo\Jobs\InitializeFeatureVectorChunk;
use Biigle\Modules\Largo\Jobs\ProcessAnnotatedFile;
use Biigle\Modules\Largo\VideoAnnotationLabelFeatureVector;
use Biigle\VideoAnnotationLabel;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
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
        $width = config('thumbnails.width');
        $height = config('thumbnails.height');
        $this->assertEquals([0, 0, $width, $height], $item[$al->annotation_id]);

        $model = ImageAnnotationLabelFeatureVector::find($al->id);
        $this->assertNotNull($model);
        $this->assertEquals($al->annotation_id, $model->annotation_id);
        $this->assertEquals($al->annotation_id, $model->annotation_id);
        $this->assertEquals($al->label_id, $model->label_id);
        $this->assertEquals($al->label->label_tree_id, $model->label_tree_id);
        $this->assertEquals($al->annotation->image->volume_id, $model->volume_id);
        $this->assertEquals(range(0, 383), $model->vector->toArray());
    }

    public function testHandleVideos()
    {
        $disk = Storage::fake(config('largo.patch_storage_disk'));
        $al = VideoAnnotationLabel::factory()->create();
        $disk->put(ProcessAnnotatedFile::getTargetPath($al->annotation), 'abc');
        $job = new InitializeFeatureVectorChunkStub([], [$al->annotation_id]);
        $job->output = $al->annotation_id.',"'.json_encode(range(0, 383)).'"';
        $job->handle();

        $model = VideoAnnotationLabelFeatureVector::find($al->id);
        $this->assertNotNull($model);
        $this->assertEquals($al->annotation_id, $model->annotation_id);
        $this->assertEquals($al->annotation_id, $model->annotation_id);
        $this->assertEquals($al->label_id, $model->label_id);
        $this->assertEquals($al->label->label_tree_id, $model->label_tree_id);
        $this->assertEquals($al->annotation->video->volume_id, $model->volume_id);
        $this->assertEquals(range(0, 383), $model->vector->toArray());
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

        $this->assertEquals(range(0, 383), $v->fresh()->vector->toArray());
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
        $this->assertEquals($al->annotation_id, $model->annotation_id);
        $this->assertEquals($al->annotation_id, $model->annotation_id);
        $this->assertEquals($al->label_id, $model->label_id);
        $this->assertEquals($al->label->label_tree_id, $model->label_tree_id);
        $this->assertEquals($al->annotation->image->volume_id, $model->volume_id);
        $this->assertEquals(range(0, 383), $model->vector->toArray());

        $model = ImageAnnotationLabelFeatureVector::find($al2->id);
        $this->assertNotNull($model);
        $this->assertEquals($al2->annotation_id, $model->annotation_id);
        $this->assertEquals($al2->annotation_id, $model->annotation_id);
        $this->assertEquals($al2->label_id, $model->label_id);
        $this->assertEquals($al2->label->label_tree_id, $model->label_tree_id);
        $this->assertEquals($al2->annotation->image->volume_id, $model->volume_id);
        $this->assertEquals(range(0, 383), $model->vector->toArray());
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
