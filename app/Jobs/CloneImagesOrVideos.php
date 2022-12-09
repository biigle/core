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

    public $fileIds;

    public $fileLabelIds;

    public $labelIds;

    /**
     * Create a new job instance.
     *
     * @param Volume $volume The volume to create the files for.
     *
     * @return void
     */
    public function __construct(Volume $volume, Volume $copy, array $selectedFileIds = [],
                                array  $selectedFileLabelIds = [], array $selectedLabelIds = [])
    {
        $this->volume = $volume;
        $this->copy = $copy;
        $this->fileIds = $selectedFileIds;
        $this->fileLabelIds = $selectedFileLabelIds;
        $this->labelIds = $selectedLabelIds;
    }

    public function handle()
    {
        $volume = $this->volume;
        $copy = $this->copy;
        $fileIds = $this->fileIds;
        $fileLabelIds = $this->fileLabelIds;
        $annotationLabelIds = $this->labelIds;

        DB::transaction(function () use ($volume,$copy,$fileIds,$fileLabelIds,$annotationLabelIds){
            $fileLabelIds = empty($fileLabelIds) ? [] :
                $this->filterLabels($fileIds, $fileLabelIds, $volume->isImageVolume(), true);
            $annotationLabelIds = empty($annotationLabelIds) ? [] :
                $this->filterLabels($fileIds, $annotationLabelIds, $volume->isImageVolume(), false);

            if ($volume->isImageVolume()) {
                $this->copyImages($volume, $copy, $fileIds);
                if (!empty($annotationLabelIds)) {
                    $this->copyImageAnnotation($volume, $copy, $fileIds, $annotationLabelIds);
                }
                if (!empty($fileLabelIds)) {
                    $this->copyImageLabels($volume, $copy, $fileIds, $fileLabelIds);
                }
            } else {
                $this->copyVideos($volume, $copy, $fileIds);
                if (!empty($annotationLabelIds)) {
                    $this->copyVideoAnnotation($volume, $copy, $fileIds, $annotationLabelIds);
                }
                if (!empty($fileLabelIds)) {
                    $this->copyVideoLabels($volume, $copy, $fileIds, $fileLabelIds);
                }
            }
        });


        if ($copy->files()->exists()) {
            ProcessNewVolumeFiles::dispatch($copy);
        }

        $copy->flushThumbnailCache();

        if ($copy->creating_async) {
            $copy->creating_async = false;
            $copy->save();
        }

        if ($copy->isImageVolume()) {
            event('images.cloned', [$copy->id]);
        }
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
        $images = $volume->images()->orderBy('id')->whereIn('id', $selectedImageIds)->get();

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
    private function copyImageAnnotation($volume, $copy, $selectedFileIds, $selectedLabelIds)
    {

        $usedAnnotationIds = ImageAnnotation::with('labels')
            ->whereIn('image_id', $selectedFileIds)
            ->orderBy('id')
            ->get()
            ->filter(function ($annotation) use ($selectedLabelIds) {
                return !empty(array_intersect($annotation->labels->pluck('id')->toArray(), $selectedLabelIds));
            })
            ->pluck('id')
            ->toArray();

        $chunkSize = 100;
        $newImageIds = $copy->images()->orderBy('id')->pluck('id');
        $volume->images()
            ->whereIn('id', $selectedFileIds)
            ->orderBy('id')
            ->with('annotations.labels')
            // This is an optimized implementation to clone the annotations with only few database
            // queries. There are simpler ways to implement this, but they can be ridiculously inefficient.
            ->chunkById($chunkSize, function ($chunk, $page) use ($newImageIds, $chunkSize, $usedAnnotationIds, $selectedLabelIds) {
                $insertData = [];
                $chunkNewImageIds = [];
                // Consider all previous image chunks when calculating the start of the index.
                $baseImageIndex = ($page - 1) * $chunkSize;
                foreach ($chunk as $index => $image) {
                    $newImageId = $newImageIds[$baseImageIndex + $index];
                    // Collect relevant image IDs for the annotation query below.
                    $chunkNewImageIds[] = $newImageId;
                    foreach ($image->annotations as $annotation) {
                        if (in_array($annotation->id, $usedAnnotationIds)) {
                            $original = $annotation->getRawOriginal();
                            $original['image_id'] = $newImageId;
                            unset($original['id']);
                            $insertData[] = $original;
                        }
                    }
                }

                ImageAnnotation::insert($insertData);
                // Get the IDs of all newly inserted annotations. Ordering is essential.
                $newAnnotationIds = ImageAnnotation::whereIn('image_id', $chunkNewImageIds)
                    ->orderBy('id')
                    ->pluck('id');
                $insertData = [];
                foreach ($chunk as $image) {
                    $annotations = $image->annotations->filter(function ($annotation) use ($usedAnnotationIds) {
                        return in_array($annotation->id, $usedAnnotationIds);
                    });
                    foreach ($annotations as $annotation) {
                        $newAnnotationId = $newAnnotationIds->shift();
                        foreach ($annotation->labels as $annotationLabel) {
                            if (in_array($annotationLabel->id, $selectedLabelIds)) {
                                $original = $annotationLabel->getRawOriginal();
                                $original['annotation_id'] = $newAnnotationId;
                                unset($original['id']);
                                $insertData[] = $original;
                            }
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
        $oldImages = $volume->images()->whereIn('id', $selectedFileIds)
            ->orderBy('id')
            ->with('labels')
            ->get();
        $newImageIds = $copy->images()->orderBy('id')->pluck('id');


        foreach ($oldImages as $imageIdx => $oldImage) {
            $newImageId = $newImageIds[$imageIdx];
            $filteredLabels = $oldImage->labels->filter(function ($label) use ($selectedLabelIds) {
                return in_array($label->id, $selectedLabelIds);
            });
            $filteredLabels->map(function ($oldLabel) use ($newImageId) {
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
        $videos = $volume->videos()->orderBy('id')->whereIn('id', $selectedVideoIds)->get();

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
    private function copyVideoAnnotation($volume, $copy, $selectedFileIds, $selectedLabelIds)
    {
        $usedAnnotationIds = VideoAnnotation::with('labels')
            ->whereIn('video_id', $selectedFileIds)
            ->orderBy('id')
            ->get()
            ->filter(function ($annotation) use ($selectedLabelIds) {
                return !empty(array_intersect($annotation->labels->pluck('id')->toArray(), $selectedLabelIds));
            })
            ->pluck('id')
            ->toArray();
        $chunkSize = 100;
        $newVideoIds = $copy->videos()->orderBy('id')->pluck('id');
        $volume->videos()
            ->whereIn('id', $selectedFileIds)
            ->orderBy('id')
            ->with('annotations.labels')
            // This is an optimized implementation to clone the annotations with only few database
            // queries. There are simpler ways to implement this, but they can be ridiculously inefficient.
            ->chunkById($chunkSize, function ($chunk, $page) use ($newVideoIds, $chunkSize, $usedAnnotationIds, $selectedLabelIds) {
                $insertData = [];
                $chunkNewVideoIds = [];
                // Consider all previous video chunks when calculating the start of the index.
                $baseVideoIndex = ($page - 1) * $chunkSize;
                foreach ($chunk as $index => $video) {
                    $newVideoId = $newVideoIds[$baseVideoIndex + $index];
                    // Collect relevant video IDs for the annotation query below.
                    $chunkNewVideoIds[] = $newVideoId;
                    foreach ($video->annotations as $annotation) {
                        if (in_array($annotation->id, $usedAnnotationIds)) {
                            $original = $annotation->getRawOriginal();
                            $original['video_id'] = $newVideoId;
                            unset($original['id']);
                            $insertData[] = $original;
                        }
                    }
                }

                VideoAnnotation::insert($insertData);
                // Get the IDs of all newly inserted annotations. Ordering is essential.
                $newAnnotationIds = VideoAnnotation::whereIn('video_id', $chunkNewVideoIds)
                    ->orderBy('id')
                    ->pluck('id');
                $insertData = [];
                foreach ($chunk as $video) {
                    $annotations = $video->annotations->filter(function ($annotation) use ($usedAnnotationIds) {
                        return in_array($annotation->id, $usedAnnotationIds);
                    });
                    foreach ($annotations as $annotation) {
                        $newAnnotationId = $newAnnotationIds->shift();
                        foreach ($annotation->labels as $annotationLabel) {
                            if (in_array($annotationLabel->id, $selectedLabelIds)) {
                                $original = $annotationLabel->getRawOriginal();
                                $original['annotation_id'] = $newAnnotationId;
                                unset($original['id']);
                                $insertData[] = $original;
                            }
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
        $oldVideos = $volume->videos()->whereIn('id', $selectedFileIds)
            ->orderBy('id')
            ->with('labels')
            ->get();
        $newVideoIds = $copy->videos()->orderBy('id')->pluck('id');

        foreach ($oldVideos as $videoIdx => $oldVideo) {
            $newVideoId = $newVideoIds[$videoIdx];
            $filteredLabels = $oldVideo->labels->filter(function ($label) use ($selectedLabelIds) {
                return in_array($label->id, $selectedLabelIds);
            });
            $filteredLabels->map(function ($oldLabel) use ($newVideoId) {
                $origin = $oldLabel->getRawOriginal();
                $origin['video_id'] = $newVideoId;
                unset($origin['id']);
                return $origin;
            })
//                ->flatten(1)
                ->chunk(10000)->each(function ($chunk) {
                    VideoLabel::insert($chunk->toArray());
                });
        }
    }

}
