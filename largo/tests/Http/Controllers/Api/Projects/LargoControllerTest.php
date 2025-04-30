<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api\Projects;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\ImageAnnotation;
use Biigle\VideoAnnotation;
use Biigle\Label;
use Biigle\Modules\Largo\Jobs\ApplyLargoSession;
use Biigle\Modules\Largo\Jobs\RemoveImageAnnotationPatches;
use Biigle\Modules\Largo\Jobs\RemoveVideoAnnotationPatches;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;
use Biigle\Tests\VolumeTest;
use Queue;

class LargoControllerTest extends ApiTestCase
{
    public function setUp(): void
    {
        parent::setUp();
        // make sure the label tree and label are set up
        $this->labelRoot();

        $this->imageVolume = VolumeTest::create([
            'media_type_id' => MediaType::imageId(),
        ]);
        $this->project()->addVolumeId($this->imageVolume->id);

        $image = ImageTest::create(['volume_id' => $this->imageVolume->id]);
        $this->imageAnnotation = ImageAnnotationTest::create(['image_id' => $image->id]);

        $this->imageAnnotationLabel = ImageAnnotationLabelTest::create([
            'annotation_id' => $this->imageAnnotation->id,
            'user_id' => $this->editor()->id,
        ]);

        $this->videoVolume = VolumeTest::create([
            'media_type_id' => MediaType::videoId(),
        ]);
        $this->project()->addVolumeId($this->videoVolume->id);

        $video = VideoTest::create(['volume_id' => $this->videoVolume->id]);
        $this->videoAnnotation = VideoAnnotationTest::create(['video_id' => $video->id]);

        $this->videoAnnotationLabel = VideoAnnotationLabelTest::create([
            'annotation_id' => $this->videoAnnotation->id,
            'user_id' => $this->editor()->id,
        ]);
    }

    public function testRoute()
    {
        $this->doTestApiRoute('POST', "/api/v1/projects/{$this->project()->id}/largo");
    }

    public function testErrorsImageAnnotations()
    {
        $this->beUser();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [])
            ->assertStatus(403);

        $this->beGuest();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [])
            ->assertStatus(403);

        // Annotation from other project should not be affected.
        $other = ImageAnnotationTest::create();

        $this->beEditor();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [
                'dismissed_image_annotations' => [
                ],
                'changed_image_annotations' => [
                    $this->labelRoot()->id => [$other->id],
                ],
            ])
            // other does not belong to the same project
            ->assertStatus(422);

        $otherLabel = ImageAnnotationLabelTest::create();

        $this->beEditor();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [
                'dismissed_image_annotations' => [
                ],
                'changed_image_annotations' => [
                    $otherLabel->label_id => [$this->imageAnnotation->id],
                ],
            ])
            // a label in 'changed_image_annotations' does not belong to a label tree available for the project
            ->assertStatus(422);
    }

    public function testErrorsVideoAnnotations()
    {
        $this->beUser();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [])
            ->assertStatus(403);

        $this->beGuest();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [])
            ->assertStatus(403);

        // Annotation from other project should not be affected.
        $other = VideoAnnotationTest::create();

        $this->beEditor();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [
                'dismissed_video_annotations' => [
                ],
                'changed_video_annotations' => [
                    $this->labelRoot()->id => [$other->id],
                ],
            ])
            // other does not belong to the same project
            ->assertStatus(422);

        $otherLabel = VideoAnnotationLabelTest::create();

        $this->beEditor();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [
                'dismissed_video_annotations' => [
                ],
                'changed_video_annotations' => [
                    $otherLabel->label_id => [$this->videoAnnotation->id],
                ],
            ])
            // a label in 'changed_image_annotations' does not belong to a label tree available for the project
            ->assertStatus(422);
    }

    public function testQueueImageAnnotations()
    {
        $this->beEditor();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [
            'dismissed_image_annotations' => [
                $this->imageAnnotationLabel->label_id => [$this->imageAnnotation->id],
            ],
            'changed_image_annotations' => [],
        ]);
        Queue::assertPushedOn('default', ApplyLargoSession::class);
    }

    public function testQueueVideoAnnotations()
    {
        $this->beEditor();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [
            'dismissed_video_annotations' => [
                $this->videoAnnotationLabel->label_id => [$this->videoAnnotation->id],
            ],
            'changed_video_annotations' => [],
        ]);
        Queue::assertPushedOn('default', ApplyLargoSession::class);
    }

    public function testDismissImageAnnotations()
    {
        $this->beEditor();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [
                'dismissed_image_annotations' => [
                    $this->imageAnnotationLabel->label_id => [$this->imageAnnotation->id],
                ],
                'changed_image_annotations' => [],
            ])
            ->assertStatus(200);
        Queue::assertPushed(ApplyLargoSession::class);
    }

    public function testDismissVideoAnnotations()
    {
        $this->beEditor();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [
                'dismissed_video_annotations' => [
                    $this->videoAnnotationLabel->label_id => [$this->videoAnnotation->id],
                ],
                'changed_video_annotations' => [],
            ])
            ->assertStatus(200);
        Queue::assertPushed(ApplyLargoSession::class);
    }

    public function testDismissForceDenyImageAnnotations()
    {
        $this->imageAnnotationLabel->user_id = $this->admin()->id;
        $this->imageAnnotationLabel->save();
        $this->beEditor();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [
                'dismissed_image_annotations' => [
                    $this->imageAnnotationLabel->label_id => [$this->imageAnnotation->id],
                ],
                'changed_image_annotations' => [],
                'force' => true,
            ])
            ->assertStatus(403);
        Queue::assertNotPushed(ApplyLargoSession::class);
    }

    public function testDismissForceDenyVideoAnnotations()
    {
        $this->videoAnnotationLabel->user_id = $this->admin()->id;
        $this->videoAnnotationLabel->save();
        $this->beEditor();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [
                'dismissed_video_annotations' => [
                    $this->videoAnnotationLabel->label_id => [$this->videoAnnotation->id],
                ],
                'changed_video_annotations' => [],
                'force' => true,
            ])
            ->assertStatus(403);
        Queue::assertNotPushed(ApplyLargoSession::class);
    }

    public function testDismissForceImageAnnotations()
    {
        $this->beExpert();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [
                'dismissed_image_annotations' => [
                    $this->imageAnnotationLabel->label_id => [$this->imageAnnotation->id],
                ],
                'changed_image_annotations' => [],
                'force' => true,
            ])
            ->assertStatus(200);
        Queue::assertPushed(ApplyLargoSession::class);
    }

    public function testDismissForceVideoAnnotations()
    {
        $this->beExpert();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [
                'dismissed_video_annotations' => [
                    $this->videoAnnotationLabel->label_id => [$this->videoAnnotation->id],
                ],
                'changed_video_annotations' => [],
                'force' => true,
            ])
            ->assertStatus(200);
        Queue::assertPushed(ApplyLargoSession::class);
    }

    public function testChangeOwnImageAnnotations()
    {
        $this->beEditor();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [
                'dismissed_image_annotations' => [
                    $this->imageAnnotationLabel->label_id => [$this->imageAnnotation->id],
                ],
                'changed_image_annotations' => [
                    $this->labelRoot()->id => [$this->imageAnnotation->id],
                ],
            ])
            ->assertStatus(200);
        Queue::assertPushed(ApplyLargoSession::class);
    }

    public function testChangeOwnVideoAnnotations()
    {
        $this->beEditor();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [
                'dismissed_video_annotations' => [
                    $this->videoAnnotationLabel->label_id => [$this->videoAnnotation->id],
                ],
                'changed_video_annotations' => [
                    $this->labelRoot()->id => [$this->videoAnnotation->id],
                ],
            ])
            ->assertStatus(200);
        Queue::assertPushed(ApplyLargoSession::class);
    }

    public function testChangeOtherImageAnnotations()
    {
        $this->beAdmin();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [
                'dismissed_image_annotations' => [
                    $this->imageAnnotationLabel->label_id => [$this->imageAnnotation->id],
                ],
                'changed_image_annotations' => [
                    $this->labelRoot()->id => [$this->imageAnnotation->id],
                ],
            ])
            ->assertStatus(200);
        Queue::assertPushed(ApplyLargoSession::class);
    }

    public function testChangeOtherVideoAnnotations()
    {
        $this->beAdmin();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [
                'dismissed_video_annotations' => [
                    $this->videoAnnotationLabel->label_id => [$this->videoAnnotation->id],
                ],
                'changed_video_annotations' => [
                    $this->labelRoot()->id => [$this->videoAnnotation->id],
                ],
            ])
            ->assertStatus(200);
        Queue::assertPushed(ApplyLargoSession::class);
    }

    public function testChangeOtherForceImageAnnotations()
    {
        $this->beExpert();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [
                'dismissed_image_annotations' => [
                    $this->imageAnnotationLabel->label_id => [$this->imageAnnotation->id],
                ],
                'changed_image_annotations' => [
                    $this->labelRoot()->id => [$this->imageAnnotation->id],
                ],
                'force' => true,
            ])
            ->assertStatus(200);
        Queue::assertPushed(ApplyLargoSession::class);
    }

    public function testChangeOtherForceVideoAnnotations()
    {
        $this->beExpert();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [
                'dismissed_video_annotations' => [
                    $this->videoAnnotationLabel->label_id => [$this->videoAnnotation->id],
                ],
                'changed_video_annotations' => [
                    $this->labelRoot()->id => [$this->videoAnnotation->id],
                ],
                'force' => true,
            ])
            ->assertStatus(200);
        Queue::assertPushed(ApplyLargoSession::class);
    }

    public function testChangeMultipleImageAnnotations()
    {
        $label2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $this->imageAnnotation->id,
            'user_id' => $this->editor()->id,
        ]);

        $this->beEditor();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [
                'dismissed_image_annotations' => [
                    $this->imageAnnotationLabel->label_id => [$this->imageAnnotation->id],
                    $label2->label_id => [$this->imageAnnotation->id],
                ],
                'changed_image_annotations' => [
                    $this->labelRoot()->id => [$this->imageAnnotation->id],
                    $this->labelChild()->id => [$this->imageAnnotation->id],
                ],
            ])
            ->assertStatus(200);
        Queue::assertPushed(ApplyLargoSession::class);
    }

    public function testChangeMultipleVideoAnnotations()
    {
        $label2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $this->videoAnnotation->id,
            'user_id' => $this->editor()->id,
        ]);

        $this->beEditor();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [
                'dismissed_video_annotations' => [
                    $this->videoAnnotationLabel->label_id => [$this->videoAnnotation->id],
                    $label2->label_id => [$this->videoAnnotation->id],
                ],
                'changed_video_annotations' => [
                    $this->labelRoot()->id => [$this->videoAnnotation->id],
                    $this->labelChild()->id => [$this->videoAnnotation->id],
                ],
            ])
            ->assertStatus(200);
        Queue::assertPushed(ApplyLargoSession::class);
    }

    public function testStoreSetJobIdImageAnnotations()
    {
        $volume2 = VolumeTest::create();
        $this->project()->addVolumeId($volume2->id);
        $this->beEditor();
        $response = $this->post("/api/v1/projects/{$this->project()->id}/largo", [
                'dismissed_image_annotations' => [
                    $this->imageAnnotationLabel->label_id => [$this->imageAnnotation->id],
                ],
                'changed_image_annotations' => [],
            ])->assertStatus(200);

        $attrs = $this->imageVolume->fresh()->attrs;
        $this->assertNotNull($attrs);
        $this->assertArrayHasKey('largo_job_id', $attrs);
        $this->assertStringContainsString($attrs['largo_job_id'], $response->getContent());
        $this->assertNull($volume2->fresh()->attrs);
    }

    public function testStoreSetJobIdVideoAnnotations()
    {
        $volume2 = VolumeTest::create();
        $this->project()->addVolumeId($volume2->id);
        $this->beEditor();
        $response = $this->post("/api/v1/projects/{$this->project()->id}/largo", [
                'dismissed_video_annotations' => [
                    $this->videoAnnotationLabel->label_id => [$this->videoAnnotation->id],
                ],
                'changed_video_annotations' => [],
            ])->assertStatus(200);

        $attrs = $this->videoVolume->fresh()->attrs;
        $this->assertNotNull($attrs);
        $this->assertArrayHasKey('largo_job_id', $attrs);
        $this->assertStringContainsString($attrs['largo_job_id'], $response->getContent());
        $this->assertNull($volume2->fresh()->attrs);
    }

    public function testStoreJobStillRunningImageAnnotations()
    {
        $this->imageVolume->attrs = ['largo_job_id' => 'my_job_id'];
        $this->imageVolume->save();

        $this->beEditor();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [
                'dismissed_image_annotations' => [
                    $this->imageAnnotationLabel->label_id => [$this->imageAnnotation->id],
                ],
                'changed_image_annotations' => [],
            ])->assertStatus(422);
    }

    public function testStoreJobStillRunningVideoAnnotations()
    {
        $this->videoVolume->attrs = ['largo_job_id' => 'my_job_id'];
        $this->videoVolume->save();

        $this->beEditor();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [
                'dismissed_video_annotations' => [
                    $this->videoAnnotationLabel->label_id => [$this->videoAnnotation->id],
                ],
                'changed_video_annotations' => [],
            ])->assertStatus(422);
    }

    public function testChunkingImgProject()
    {
        config(['biigle.db_param_limit' => 2]);
        $image = ImageTest::create(['volume_id' => $this->imageVolume->id,
                                    'filename' => "testImage"]);

        $imageAnnotations = ImageAnnotation::factory()->count(5)->create(['image_id' => $image->id]);
        $label = Label::factory()->create(); 


        $imageAnnotations->each(fn($imageAnnotation) =>
            ImageAnnotationLabelTest::create([
                'annotation_id' => $imageAnnotation->id,
                'user_id' => $this->editor()->id,
                'label_id' => $label->id,
            ]));


        $this->beEditor();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [
                'dismissed_image_annotations' => [
                    $this->imageAnnotationLabel->label_id => $imageAnnotations->pluck('id'), 
                ],
                'changed_image_annotations' => [],
            ])
            ->assertStatus(200);
        Queue::assertPushed(ApplyLargoSession::class);
    }

    public function testChunkingVidProject()
    {
        config(['biigle.db_param_limit' => 2]);
        $video = VideoTest::create(['volume_id' => $this->videoVolume->id,
                                    'filename' => "testVideo"]);
        $videoAnnotations = VideoAnnotation::factory()->count(5)->create(['video_id' => $video->id]);

        $label = Label::factory()->create(); 

        $videoAnnotations->each(fn($videoAnnotation) =>
            VideoAnnotationLabelTest::create([
                'annotation_id' => $videoAnnotation->id,
                'user_id' => $this->editor()->id,
                'label_id' => $label->id,
            ]));


        $this->beEditor();
        $this->postJson("/api/v1/projects/{$this->project()->id}/largo", [
                'dismissed_video_annotations' => [
                    $this->videoAnnotationLabel->label_id => $videoAnnotations->pluck('id'), 
                ],
                'changed_video_annotations' => [],
            ])
            ->assertStatus(200);
        Queue::assertPushed(ApplyLargoSession::class);
    }

}
