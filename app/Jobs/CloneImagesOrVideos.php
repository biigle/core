<?php

namespace Biigle\Jobs;

use \Illuminate\Contracts\Queue\ShouldQueue;
use Biigle\Http\Requests\CloneVolume;
use Biigle\Image;
use Biigle\ImageAnnotation;
use Biigle\ImageAnnotationLabel;
use Biigle\ImageLabel;
use Biigle\Project;
use Biigle\Video;
use Biigle\VideoAnnotation;
use Biigle\VideoAnnotationLabel;
use Biigle\VideoLabel;
use Biigle\Volume;
use Illuminate\Http\Request;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Ramsey\Uuid\Uuid;

class CloneImagesOrVideos extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;


    /**
     * The target project.
     *
     * @var Project
     */
    public Project $project;

    public Volume $copy;

    /**
     * The volume to clone.
     *
     * @var Volume
     */
    public Volume $volume;

    /**
     * Array containing file ids.
     *
     * @var array
     **/
    public array $onlyFiles;

    /**
     * Boolean for cloning annotation labels.
     *
     * @var bool
     **/
    public bool $cloneAnnotations;

    /**
     * Array containing annotation label ids.
     *
     * @var array
     **/
    public array $onlyAnnotationLabels;

    /**
     * Boolean for cloning file labels.
     *
     * @var bool
     **/
    public bool $cloneFileLabels;

    /**
     * Array containing file label ids.
     *
     * @var array
     **/
    public array $onlyFileLabels;

    /**
     * Array mapping original image uuids to cloned image uuids
     * @var array
     */
    protected $uuidMap;

    /**
     * Ignore this job if the project or volume does not exist any more.
     *
     * @var bool
     */
    protected $deleteWhenMissingModels = true;

    /**
     * Create a new job instance.
     *
     * @param CloneVolume|Request $request containing the project, volume, new volume name and ids of files and labels.
     *
     * @return void
     */
    public function __construct($request, $copy)
    {
        $this->project = $request->project;
        $this->copy = $copy;
        $this->volume = $request->volume;
        $this->onlyFiles = $request->input('only_files', []);
        $this->cloneAnnotations = $request->input('clone_annotations', false);
        $this->onlyAnnotationLabels = $request->input('only_annotation_labels', []);
        $this->cloneFileLabels = $request->input('clone_file_labels', false);
        $this->onlyFileLabels = $request->input('only_file_labels', []);
        $this->uuidMap = [];

    }

    public function handle()
    {
        DB::transaction(function () {
            $project = $this->project;
            $volume = $this->volume;
            $onlyFiles = $this->onlyFiles;
            $cloneAnnotations = $this->cloneAnnotations;
            $onlyAnnotationLabels = $this->onlyAnnotationLabels;
            $cloneFileLabels = $this->cloneFileLabels;
            $onlyFileLabels = $this->onlyFileLabels;
            $copy = $this->copy;

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
            if ($copy->files()->exists()) {
                ProcessCloneVolumeFiles::dispatch($copy, $this->uuidMap, []);
            }

            if ($volume->hasMetadata()) {
                $this->copyMetadataFile($volume, $copy);
            }
            $copy->creating_async = false;

            $copy->save();

            event('volume.cloned', $copy);
        });

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
        $volume->images()
            ->orderBy('id')
            ->when(!empty($selectedImageIds), fn ($query) => $query->whereIn('id', $selectedImageIds))
            ->get()->map(function ($image) use ($copy) {
                $original = $image->getRawOriginal();
                $original['volume_id'] = $copy->id;
                $original['uuid'] = (string)Uuid::uuid4();
                $this->uuidMap[$original['uuid']] = $image->uuid;
                unset($original['id']);
                return $original;
            })
            ->chunk(1000)
            ->each(function ($chunk) {
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
        // if no image ids specified use all images
        $selectedFileIds = empty($selectedFileIds) ?
            $volume->images()->pluck('id')->sortBy('id') : $selectedFileIds;

        $chunkSize = 100;
        $parameterLimit = 10000;
        $newImageIds = $copy->images()->orderBy('id')->pluck('id');
        $volume->images()
            ->with([
                'annotations' => fn ($q) => $q->orderBy('id'),
                'annotations.labels' => fn ($q) => $q->when(!empty($selectedLabelIds), fn ($q) => $q->whereIn('label_id', $selectedLabelIds))->orderBy('id'),
            ])
            ->when($volume->images->count() !== count($selectedFileIds), fn ($query) => $query->whereIn('id', $selectedFileIds))
            ->orderBy('id')
            // This is an optimized implementation to clone the annotations with only few database
            // queries. There are simpler ways to implement this, but they can be ridiculously inefficient.
            ->chunkById($chunkSize, function ($chunk, $page) use (
                $newImageIds,
                $chunkSize,
                $parameterLimit,
            ) {
                $insertData = [];
                $chunkNewImageIds = [];
                // Consider all previous image chunks when calculating the start of the index.
                $baseImageIndex = ($page - 1) * $chunkSize;
                /** @var Image $image */
                foreach ($chunk as $index => $image) {
                    $newImageId = $newImageIds[$baseImageIndex + $index];
                    // Collect relevant image IDs for the annotation query below.
                    $chunkNewImageIds[] = $newImageId;
                    foreach ($image->annotations as $annotation) {
                        if ($annotation->labels->isEmpty()) {
                            // Ignore annotation through label filtering.
                            continue;
                        }

                        $original = $annotation->getRawOriginal();
                        $original['image_id'] = $newImageId;
                        unset($original['id']);
                        $insertData[] = $original;

                    }
                }
                collect($insertData)->chunk($parameterLimit)->each(fn ($chunk) => ImageAnnotation::insert($chunk->toArray()));

                // Get the IDs of all newly inserted annotations. Ordering is essential.
                $newAnnotationIds = ImageAnnotation::whereIn('image_id', $chunkNewImageIds)
                    ->orderBy('id')
                    ->pluck('id');
                $insertData = [];
                /** @var Image $image */
                foreach ($chunk as $image) {
                    foreach ($image->annotations as $annotation) {
                        if ($annotation->labels->isEmpty()) {
                            // Ignore annotation through label filtering.
                            continue;
                        }

                        $newAnnotationId = $newAnnotationIds->shift();
                        foreach ($annotation->labels as $annotationLabel) {
                            $original = $annotationLabel->getRawOriginal();
                            $original['annotation_id'] = $newAnnotationId;
                            unset($original['id']);
                            $insertData[] = $original;
                        }
                    }
                }
                collect($insertData)->chunk($parameterLimit)->each(fn ($chunk) => ImageAnnotationLabel::insert($chunk->toArray()));

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
        $newImageIds = $copy->images()->orderBy('id')->pluck('id');

        $volume->images()
            ->when(
                !empty($selectedFileIds),
                fn ($q) => $q->whereIn('id', $selectedFileIds)
            )
            ->when(
                !empty($selectedLabelIds),
                fn ($q) => $q->with(['labels' => fn ($q) => $q->whereIn('label_id', $selectedLabelIds)]),
                fn ($q) => $q->with('labels')
            )
            ->orderBy('id')
            ->get()->map(function ($oldImage) use ($newImageIds) {
                $newImageId = $newImageIds->shift();
                $oldImage->labels->map(function ($oldLabel) use ($newImageId) {
                    $origin = $oldLabel->getRawOriginal();
                    $origin['image_id'] = $newImageId;
                    unset($origin['id']);
                    return $origin;
                })->chunk(10000)->each(function ($chunk) {
                    ImageLabel::insert($chunk->toArray());
                });
            });
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
        $volume->videos()
            ->orderBy('id')
            ->when(!empty($selectedVideoIds), fn ($query) => $query->whereIn('id', $selectedVideoIds))
            ->get()->map(function ($video) use ($copy) {
                $original = $video->getRawOriginal();
                $original['volume_id'] = $copy->id;
                $original['uuid'] = (string)Uuid::uuid4();
                unset($original['id']);
                $this->uuidMap[$original['uuid']] = $video->uuid;
                return $original;
            })
            ->chunk(1000)
            ->each(function ($chunk) {
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
        // if no video ids specified use all videos
        $selectedFileIds = empty($selectedFileIds) ?
            $volume->videos()->pluck('id')->sortBy('id') : $selectedFileIds;

        $chunkSize = 100;
        $parameterLimit = 10000;
        $newVideoIds = $copy->videos()->orderBy('id')->pluck('id');
        $volume->videos()
            ->with([
                'annotations' => fn ($q) => $q->orderBy('id'),
                'annotations.labels' => fn ($q) => $q->when(!empty($selectedLabelIds), fn ($q) => $q->whereIn('label_id', $selectedLabelIds))->orderBy('id'),
            ])
            ->when($volume->videos->count() !== count($selectedFileIds), fn ($query) => $query->whereIn('id', $selectedFileIds))
            ->orderBy('id')
            // This is an optimized implementation to clone the annotations with only few database
            // queries. There are simpler ways to implement this, but they can be ridiculously inefficient.
            ->chunkById($chunkSize, function ($chunk, $page) use (
                $newVideoIds,
                $chunkSize,
                $parameterLimit,
            ) {
                $insertData = [];
                $chunkNewVideoIds = [];
                // Consider all previous video chunks when calculating the start of the index.
                $baseVideoIndex = ($page - 1) * $chunkSize;
                /** @var Video $video */
                foreach ($chunk as $index => $video) {
                    $newVideoId = $newVideoIds[$baseVideoIndex + $index];
                    // Collect relevant video IDs for the annotation query below.
                    $chunkNewVideoIds[] = $newVideoId;
                    foreach ($video->annotations as $annotation) {
                        if ($annotation->labels->isEmpty()) {
                            // Ignore annotation through label filtering.
                            continue;
                        }

                        $original = $annotation->getRawOriginal();
                        $original['video_id'] = $newVideoId;
                        unset($original['id']);
                        $insertData[] = $original;

                    }
                }
                collect($insertData)->chunk($parameterLimit)->each(fn ($chunk) => VideoAnnotation::insert($chunk->toArray()));

                // Get the IDs of all newly inserted annotations. Ordering is essential.
                $newAnnotationIds = VideoAnnotation::whereIn('video_id', $chunkNewVideoIds)
                    ->orderBy('id')
                    ->pluck('id');
                $insertData = [];
                /** @var Video $video */
                foreach ($chunk as $video) {
                    foreach ($video->annotations as $annotation) {
                        if ($annotation->labels->isEmpty()) {
                            // Ignore annotation through label filtering.
                            continue;
                        }

                        $newAnnotationId = $newAnnotationIds->shift();
                        foreach ($annotation->labels as $annotationLabel) {
                            $original = $annotationLabel->getRawOriginal();
                            $original['annotation_id'] = $newAnnotationId;
                            unset($original['id']);
                            $insertData[] = $original;
                        }
                    }
                }
                collect($insertData)->chunk($parameterLimit)->each(fn ($chunk) => VideoAnnotationLabel::insert($chunk->toArray()));

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
        $newVideoIds = $copy->videos()->orderBy('id')->pluck('id');

        $volume->videos()
            ->when(
                !empty($selectedFileIds),
                fn ($q) => $q->whereIn('id', $selectedFileIds)
            )
            ->when(
                !empty($selectedLabelIds),
                fn ($q) => $q->with(['labels' => fn ($q) => $q->whereIn('label_id', $selectedLabelIds)]),
                fn ($q) => $q->with('labels')
            )
            ->orderBy('id')
            ->get()
            ->map(function ($oldVideo) use ($newVideoIds) {
                $newVideoId = $newVideoIds->shift();
                $oldVideo->labels->map(function ($oldLabel) use ($newVideoId) {
                    $origin = $oldLabel->getRawOriginal();
                    $origin['video_id'] = $newVideoId;
                    unset($origin['id']);
                    return $origin;
                })->chunk(10000)->each(function ($chunk) {
                    VideoLabel::insert($chunk->toArray());
                });
            });
    }

    private function copyMetadataFile(Volume $source, Volume $target): void
    {
        $disk = Storage::disk(config('volumes.metadata_storage_disk'));
        // The target metadata file path was updated in the controller method.
        $disk->copy($source->metadata_file_path, $target->metadata_file_path);
    }
}
