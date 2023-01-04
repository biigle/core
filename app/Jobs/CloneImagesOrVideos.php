<?php

namespace Biigle\Jobs;

use Biigle\Image;
use Biigle\ImageAnnotation;
use Biigle\ImageAnnotationLabel;
use Biigle\ImageLabel;
use Biigle\Traits\ChecksMetadataStrings;
use Biigle\Video;
use Biigle\VideoAnnotation;
use Biigle\VideoAnnotationLabel;
use Biigle\VideoLabel;
use Biigle\Volume;
use \Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Ramsey\Uuid\Uuid;

class CloneImagesOrVideos extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels, ChecksMetadataStrings;

    /**
     * The volume to create the files for.
     *
     * @var Volume
     */
    public $volume;

    public $copy;

    public $onlyFiles;

    public $cloneAnnotations;

    public $onlyAnnotationLabels;

    public $cloneFileLabels;

    public $onlyFileLabels;


    /**
     * Create a new job instance.
     *
     * @param Volume $volume The volume to create the files for.
     *
     * @return void
     */
    public function __construct(Volume $volume, Volume $copy,
                                array  $onlyFiles, bool $cloneAnnotations, array $onlyAnnotationLabels,
                                bool   $cloneFileLabels, array $onlyFileLabels)
    {
        $this->volume = $volume;
        $this->copy = $copy;
        $this->onlyFiles = $onlyFiles;
        $this->cloneAnnotations = $cloneAnnotations;
        $this->onlyAnnotationLabels = $onlyAnnotationLabels;
        $this->cloneFileLabels = $cloneFileLabels;
        $this->onlyFileLabels = $onlyFileLabels;
    }

    public function handle()
    {
        $volume = $this->volume;
        $copy = $this->copy;
        $onlyFiles = $this->onlyFiles;
        $cloneAnnotations = $this->cloneAnnotations;
        $onlyAnnotationLabels = $this->onlyAnnotationLabels;
        $cloneFileLabels = $this->cloneFileLabels;
        $onlyFileLabels = $this->onlyFileLabels;

        DB::transaction(function () use (
            $volume, $copy, $onlyFiles, $cloneAnnotations, $onlyAnnotationLabels,
            $cloneFileLabels, $onlyFileLabels
        ) {

            if ($volume->isImageVolume()) {
                $this->copyImages($volume, $copy, $onlyFiles);
                if ($cloneAnnotations) {
                    $this->copyImageAnnotation($volume, $copy, $onlyFiles, $onlyAnnotationLabels);
                }
                if ($cloneFileLabels) {
                    $this->copyImageLabels($volume, $copy, $onlyFiles, $onlyFileLabels);
                }
            } else {
                $this->copyVideos($volume, $copy, $onlyFiles);
                if ($cloneAnnotations) {
                    $this->copyVideoAnnotation($volume, $copy, $onlyFiles, $onlyAnnotationLabels);
                }
                if ($cloneFileLabels) {
                    $this->copyVideoLabels($volume, $copy, $onlyFiles, $onlyFileLabels);
                }
            }
        });


        if ($copy->files()->exists()) {
            ProcessNewVolumeFiles::dispatch($copy);
        }

        $copy->flushThumbnailCache();

        if ($copy->creating_async) {
            $copy->save();
        }

        event('volume.cloned', [$copy->id]);

    }

    /**
     * Discard label ids whose files were not copied.
     * @param int[] $fileIds image or video ids
     * @param int[] $labelIds file labels if isFileLabel is true otherwise annotation labels
     * @param boolean $isImageVol true if volume is image volume else false
     * @param boolean $isFileLabel true if labelIds are image/video labels otherwise false
     * @return int[] label ids of files which were copied
     **/
    private function filterLabels($fileIds, $labelIds, $isImageVol, $isFileLabel)
    {
        $fileType = $isImageVol ? 'image_id' : 'video_id';
        if ($isFileLabel) {
            $labels = $isImageVol ? ImageLabel::find($labelIds) : VideoLabel::find($labelIds);
            return $labels->filter(function ($label) use ($fileIds, $fileType) {
                return in_array($label->$fileType, $fileIds);
            })->pluck('id')->toArray();
        } else {
            $labels = $isImageVol ? ImageAnnotationLabel::find($labelIds) : VideoAnnotationLabel::find($labelIds);
            $annotationIds = $labels->pluck('annotation_id');
            $annotations = $isImageVol ? ImageAnnotation::find($annotationIds) : VideoAnnotation::find($annotationIds);
            return $annotations->filter(function ($label) use ($fileIds, $fileType) {
                return in_array($label->$fileType, $fileIds);
            })->pluck('id')->toArray();
        }

    }

    /**
     * Copies (selected) images from given volume to volume copy.
     *
     * @param Volume $volume
     * @param Volume $copy
     * @param int[] $selectedImageIds
     **/
    private function copyImages($volume, $copy, $selectedImageIds)
    {
        // copy image references
        $images = $volume->images()
            ->orderBy('id')
            ->when(!empty($selectedImageIds), function ($query) use ($selectedImageIds) {
                return $query->whereIn('id', $selectedImageIds);
            })
            ->get();

        $images->map(function ($image) use ($copy) {
            $original = $image->getRawOriginal();
            $original['volume_id'] = $copy->id;
            $original['uuid'] = (string)Uuid::uuid4();
            unset($original['id']);
            return $original;
        })->chunk(10000)->each(function ($chunk) {
            Image::insert($chunk->toArray());
        });

    }

    /**
     * Copies (selected) image annotation and annotation labels from volume to volume copy.
     *
     * @param Volume $volume
     * @param Volume $copy
     * @param int[] $selectedFileIds
     * @param int[] $selectedLabelIds
     **/
    private function copyImageAnnotation($volume, $copy, $oldImageIds, $labelIds)
    {
        // if no image ids specified use all images
        $oldImageIds = empty($oldImageIds) ? $volume->images()->pluck('id')->sortBy('id') : $oldImageIds;

        $annotationJoinLabel = ImageAnnotation::join('image_annotation_labels', 'image_annotation_labels.annotation_id', '=', 'image_annotations.id')
            ->when(!empty($labelIds), function ($query) use ($labelIds) {
                return $query->whereIn('image_annotation_labels.label_id', $labelIds);
            })
            ->whereIn('image_annotations.image_id', $oldImageIds);


        // use unique ids, because an annotation with multiple labels would be duplicated
        $usedAnnotationIds = array_unique($annotationJoinLabel
            ->orderBy('image_annotations.id')
            ->pluck('image_annotations.id')
            ->toArray());

        $imageAnnotationLabelIds = $annotationJoinLabel
            ->orderBy('image_annotation_labels.id')
            ->pluck('image_annotation_labels.id')
            ->toArray();

        $chunkSize = 100;
        $newImageIds = $copy->images()->orderBy('id')->pluck('id');
        $volume->images()
            ->with([
                'annotations' => fn($q) => $q->whereIn('id', $usedAnnotationIds),
                'annotations.labels' => fn($q) => $q->whereIn('id', $imageAnnotationLabelIds),
            ])
            ->when($volume->images->count() != count($oldImageIds), function ($query) use ($oldImageIds) {
                return $query->whereIn('id', $oldImageIds);
            })
            ->orderBy('id')
            // This is an optimized implementation to clone the annotations with only few database
            // queries. There are simpler ways to implement this, but they can be ridiculously inefficient.
            ->chunkById($chunkSize, function ($chunk, $page) use ($newImageIds, $chunkSize, $usedAnnotationIds, $labelIds) {
                $insertData = [];
                $chunkNewImageIds = [];
                // Consider all previous image chunks when calculating the start of the index.
                $baseImageIndex = ($page - 1) * $chunkSize;
                foreach ($chunk as $index => $image) {
                    $newImageId = $newImageIds[$baseImageIndex + $index];
                    // Collect relevant image IDs for the annotation query below.
                    $chunkNewImageIds[] = $newImageId;
                    foreach ($image->annotations as $annotation) {
                        $original = $annotation->getRawOriginal();
                        $original['image_id'] = $newImageId;
                        unset($original['id']);
                        $insertData[] = $original;

                    }
                }
                ImageAnnotation::insert($insertData);
                // Get the IDs of all newly inserted annotations. Ordering is essential.
                $newAnnotationIds = ImageAnnotation::whereIn('image_id', $chunkNewImageIds)
                    ->orderBy('id')
                    ->pluck('id');
                $insertData = [];
                foreach ($chunk as $image) {
                    foreach ($image->annotations as $annotation) {
                        $newAnnotationId = $newAnnotationIds->shift();
                        foreach ($annotation->labels as $annotationLabel) {
                            $original = $annotationLabel->getRawOriginal();
                            $original['annotation_id'] = $newAnnotationId;
                            unset($original['id']);
                            $insertData[] = $original;
                        }
                    }
                }
                ImageAnnotationLabel::insert($insertData);
            });
    }

    /**
     * Copies (selected) image labels from given volume to volume copy.
     *
     * @param Volume $volume
     * @param Volume $copy
     * @param int[] $selectedFileIds
     * @param int[] $selectedLabelIds
     **/
    private function copyImageLabels($volume, $copy, $selectedFileIds, $selectedLabelIds)
    {
        $selectedFileIds = empty($selectedFileIds) ?
            $volume->images()->pluck('id')->sortBy('id') : $selectedFileIds;
        $oldImages = $volume->images()
            ->whereIn('id', $selectedFileIds)
            ->when(!empty($selectedLabelIds), function ($query) use ($selectedLabelIds) {
                return $query->whereIn('labels.id', $selectedLabelIds);
            })
            ->orderBy('id')
            ->get();
        $newImageIds = $copy->images()->orderBy('id')->pluck('id');

        foreach ($oldImages as $imageIdx => $oldImage) {
            $newImageId = $newImageIds[$imageIdx];
            $oldImage->labels->map(function ($oldLabel) use ($newImageId) {
                $origin = $oldLabel->getRawOriginal();
                $origin['image_id'] = $newImageId;
                unset($origin['id']);
                return $origin;
            })->chunk(10000)->each(function ($chunk) {
                ImageLabel::insert($chunk->toArray());
            });
        }
    }

    /**
     * Copies (selected) videos from given volume to volume copy.
     *
     * @param Volume $volume
     * @param Volume $copy
     * @param int[] $selectedVideoIds
     **/
    private function copyVideos($volume, $copy, $selectedVideoIds)
    {
        // copy video references
        $videos = $volume->videos()
            ->orderBy('id')
            ->when(!empty($selectedVideoIds), function ($query) use ($selectedVideoIds) {
                return $query->whereIn('id', $selectedVideoIds);
            })
            ->get();

        $videos->map(function ($video) use ($copy) {
            $original = $video->getRawOriginal();
            $original['volume_id'] = $copy->id;
            $original['uuid'] = (string)Uuid::uuid4();
            unset($original['id']);
            return $original;
        })->chunk(10000)->each(function ($chunk) {
            Video::insert($chunk->toArray());
        });

    }

    /**
     * Copies (selected) video annotations and annotation labels from given volume to volume copy.
     *
     * @param Volume $volume
     * @param Volume $copy
     * @param int[] $selectedFileIds
     * @param int[] $selectedLabelIds
     **/
    private function copyVideoAnnotation($volume, $copy, $oldVideoIds, $labelIds)
    {
        // if no video ids specified use all videos
        $oldVideoIds = empty($oldVideoIds) ? $volume->videos()->pluck('id')->sortBy('id') : $oldVideoIds;

        $annotationJoinLabel = VideoAnnotation::join('video_annotation_labels', 'video_annotation_labels.annotation_id', '=', 'video_annotations.id')
            ->when(!empty($labelIds), function ($query) use ($labelIds) {
                return $query->whereIn('video_annotation_labels.label_id', $labelIds);
            })
            ->whereIn('video_annotations.video_id', $oldVideoIds);

        // use unique ids, because an annotation with multiple labels would be duplicated
        $usedAnnotationIds = array_unique($annotationJoinLabel
            ->orderBy('video_annotations.id')
            ->pluck('video_annotations.id')
            ->toArray());

        $videoAnnotationLabelIds = $annotationJoinLabel
            ->orderBy('video_annotation_labels.id')
            ->pluck('video_annotation_labels.id')
            ->toArray();

        $chunkSize = 100;
        $newVideoIds = $copy->videos()->orderBy('id')->pluck('id');
        $volume->videos()
            ->with([
                'annotations' => fn($q) => $q->whereIn('id', $usedAnnotationIds),
                'annotations.labels' => fn($q) => $q->whereIn('id', $videoAnnotationLabelIds),
            ])
            ->when($volume->videos->count() != count($oldVideoIds), function ($query) use ($oldVideoIds) {
                return $query->whereIn('id', $oldVideoIds);
            })
            ->orderBy('id')
            // This is an optimized implementation to clone the annotations with only few database
            // queries. There are simpler ways to implement this, but they can be ridiculously inefficient.
            ->chunkById($chunkSize, function ($chunk, $page) use ($newVideoIds, $chunkSize, $usedAnnotationIds, $labelIds) {
                $insertData = [];
                $chunkNewVideoIds = [];
                // Consider all previous video chunks when calculating the start of the index.
                $baseVideoIndex = ($page - 1) * $chunkSize;
                foreach ($chunk as $index => $video) {
                    $newVideoId = $newVideoIds[$baseVideoIndex + $index];
                    // Collect relevant video IDs for the annotation query below.
                    $chunkNewVideoIds[] = $newVideoId;
                    foreach ($video->annotations as $annotation) {
                        $original = $annotation->getRawOriginal();
                        $original['video_id'] = $newVideoId;
                        unset($original['id']);
                        $insertData[] = $original;

                    }
                }
                VideoAnnotation::insert($insertData);
                // Get the IDs of all newly inserted annotations. Ordering is essential.
                $newAnnotationIds = VideoAnnotation::whereIn('video_id', $chunkNewVideoIds)
                    ->orderBy('id')
                    ->pluck('id');
                $insertData = [];
                foreach ($chunk as $video) {
                    foreach ($video->annotations as $annotation) {
                        $newAnnotationId = $newAnnotationIds->shift();
                        foreach ($annotation->labels as $annotationLabel) {
                            $original = $annotationLabel->getRawOriginal();
                            $original['annotation_id'] = $newAnnotationId;
                            unset($original['id']);
                            $insertData[] = $original;
                        }
                    }
                }
                VideoAnnotationLabel::insert($insertData);
            });
    }

    /**
     * Copies (selected) video labels from volume to volume copy.
     *
     * @param Volume $volume
     * @param Volume $copy
     * @param int[] $selectedFileIds
     * @param int[] $selectedLabelIds
     **/
    private function copyVideoLabels($volume, $copy, $selectedFileIds, $selectedLabelIds)
    {
        $selectedFileIds = empty($selectedFileIds) ?
            $volume->videos()->pluck('id')->sortBy('id') : $selectedFileIds;
        $oldVideos = $volume->videos()
            ->whereIn('id', $selectedFileIds)
            ->when(!empty($selectedLabelIds), function ($query) use ($selectedLabelIds) {
                return $query->whereIn('labels.id', $selectedLabelIds);
            })
            ->orderBy('id')
            ->get();
        $newVideoIds = $copy->videos()->orderBy('id')->pluck('id');

        foreach ($oldVideos as $videoIdx => $oldVideo) {
            $newVideoId = $newVideoIds[$videoIdx];
            $oldVideo->labels->map(function ($oldLabel) use ($newVideoId) {
                $origin = $oldLabel->getRawOriginal();
                $origin['video_id'] = $newVideoId;
                unset($origin['id']);
                return $origin;
            })->chunk(10000)->each(function ($chunk) {
                VideoLabel::insert($chunk->toArray());
            });
        }
    }

}
