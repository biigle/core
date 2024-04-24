<?php

namespace Biigle\Jobs;

use Biigle\Image;
use Biigle\ImageAnnotationLabel;
use Biigle\ImageLabel;
use Biigle\PendingVolume;
use Biigle\Services\MetadataParsing\FileMetadata;
use Biigle\VideoAnnotationLabel;
use Biigle\VideoLabel;
use Biigle\VolumeFile;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class ImportVolumeMetadata extends Job implements ShouldQueue
{
    use SerializesModels, InteractsWithQueue;

    /**
     * The number of annotation (label) rows to insert in one chunk.
     *
     * @var integer
     */
    public static $insertChunkSize = 5000;

    /**
     * Ignore this job if the pending volume does not exist any more.
     *
     * @var bool
     */
    protected $deleteWhenMissingModels = true;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 12;

    /**
     * Create a new job instance.
     *
     */
    public function __construct(public PendingVolume $pv)
    {
        //
    }

    public function handle(): void
    {
        if ($this->pv->volume->creating_async) {
            // Wait 10 minutes so the volume has a chance to finish creating the files.
            // Do this for a maximum of 120 min (12 tries).
            $this->release(600);

            return;
        }

        DB::transaction(function () {
            $metadata = $this->pv->getMetadata();

            $annotationUserMap = $metadata->getMatchingUsers($this->pv->user_map, $this->pv->only_annotation_labels);
            $annotationLabelMap = $metadata->getMatchingLabels($this->pv->label_map, $this->pv->only_annotation_labels);

            $fileLabelUserMap = $metadata->getMatchingUsers($this->pv->user_map, $this->pv->only_file_labels);
            $fileLabelLabelMap = $metadata->getMatchingLabels($this->pv->label_map, $this->pv->only_file_labels);

            foreach ($this->pv->volume->files()->lazyById() as $file) {
                $metaFile = $metadata->getFile($file->filename);
                if (!$metaFile) {
                    continue;
                }

                if ($this->pv->import_annotations && $metaFile->hasAnnotations()) {
                    $this->insertAnnotations($metaFile, $file, $annotationUserMap, $annotationLabelMap);
                }

                if ($this->pv->import_file_labels && $metaFile->hasFileLabels()) {
                    $this->insertFileLabels($metaFile, $file, $fileLabelUserMap, $fileLabelLabelMap);
                }
            }
        });

        $this->pv->delete();
    }

    /**
     * Insert metadata annotations of a file into the database.
     */
    protected function insertAnnotations(
        FileMetadata $meta,
        VolumeFile $file,
        array $userMap,
        array $labelMap
    ): void {
        $insertAnnotations = [];
        $insertAnnotationLabels = [];

        foreach ($meta->getAnnotations() as $index => $annotation) {
            // This will remove labels that should be ignored based on $onlyLabels and
            // that have no match in the database.
            $annotationLabels = array_filter(
                $annotation->labels,
                fn ($lau) => !is_null($labelMap[$lau->label->id] ?? null)
            );

            if (empty($annotationLabels)) {
                continue;
            }

            $insertAnnotations[] = $annotation->getInsertData($file->id);

            $insertAnnotationLabels[] = array_map(fn ($lau) => [
                'label_id' => $labelMap[$lau->label->id],
                'user_id' => $userMap[$lau->user->id],
            ], $annotationLabels);

            // Insert in chunks because a single file can have tens of thousands of
            // annotations (e.g. a video or mosaic).
            if (($index % static::$insertChunkSize) === 0) {
                $this->insertAnnotationChunk($file, $insertAnnotations, $insertAnnotationLabels);
                $insertAnnotations = [];
                $insertAnnotationLabels = [];
            }
        }

        if (!empty($insertAnnotations)) {
            $this->insertAnnotationChunk($file, $insertAnnotations, $insertAnnotationLabels);
        }
    }

    protected function insertAnnotationChunk(
        VolumeFile $file,
        array $annotations,
        array $annotationLabels
    ): void {
        $file->annotations()->insert($annotations);

        $ids = $file->annotations()
            ->orderBy('id', 'desc')
            ->take(count($annotations))
            ->pluck('id')
            ->reverse()
            ->toArray();

        foreach ($ids as $index => $id) {
            foreach ($annotationLabels[$index] as &$i) {
                $i['annotation_id'] = $id;
            }
        }

        // Flatten. Use array_values to prevent accidental array unpacking with string
        // keys (which makes the linter complain).
        $annotationLabels = array_merge(...array_values($annotationLabels));

        if ($file instanceof Image) {
            foreach ($annotationLabels as &$i) {
                $i['confidence'] = 1.0;
            }

            ImageAnnotationLabel::insert($annotationLabels);
        } else {
            VideoAnnotationLabel::insert($annotationLabels);
        }
    }

    /**
     * Insert metadata file labels of a file into the database.
     */
    protected function insertFileLabels(
        FileMetadata $meta,
        VolumeFile $file,
        array $userMap,
        array $labelMap
    ): void {
        // This will remove labels that should be ignored based on $onlyLabels and
        // that have no match in the database.
        $fileLabels = array_filter(
            $meta->getFileLabels(),
            fn ($lau) => !is_null($labelMap[$lau->label->id] ?? null)
        );

        if (empty($fileLabels)) {
            return;
        }

        $insertFileLabels = array_map(fn ($lau) => [
            'label_id' => $labelMap[$lau->label->id],
            'user_id' => $userMap[$lau->user->id],
        ], $fileLabels);

        if ($file instanceof Image) {
            foreach ($insertFileLabels as &$i) {
                $i['image_id'] = $file->id;
            }

            ImageLabel::insert($insertFileLabels);
        } else {
            foreach ($insertFileLabels as &$i) {
                $i['video_id'] = $file->id;
            }

            VideoLabel::insert($insertFileLabels);
        }
    }
}
