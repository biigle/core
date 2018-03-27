<?php

namespace Biigle\Modules\Sync\Support\Export;

use DB;
use Biigle\Volume;

class VolumeExport extends Export
{
    /**
     * {@inheritdoc}
     */
    public function getContent()
    {
        $volumes = Volume::whereIn('id', $this->ids)
            ->with(['images' => function ($query) {
                $query->select('id', 'filename', 'volume_id');
            }])
            ->get();

        // Use DB helper instead of model to save memory.
        $annotations = DB::table('annotations')
            ->join('images', 'image_id', '=', 'annotations.image_id')
            ->whereIn('images.volume_id', $this->ids)
            ->select(
                'images.volume_id',
                'annotations.image_id',
                'annotations.shape_id',
                'annotations.created_at',
                'annotations.updated_at',
                'annotations.points'
            )
            ->get()
            ->groupBy('volume_id')
            ->map(function ($group) {
                return $group->map(function ($annotation) {
                    unset($annotation->volume_id);
                    return (array) $annotation;
                });
            })
            ->toArray();

        $annotationLabels = DB::table('annotation_labels')
            ->join('annotations', 'annotations.id', '=', 'annotation_labels.annotation_id')
            ->join('images', 'images.id', '=', 'annotations.image_id')
            ->whereIn('images.volume_id', $this->ids)
            ->select(
                'images.volume_id',
                'annotation_labels.annotation_id',
                'annotation_labels.label_id',
                'annotation_labels.user_id',
                'annotation_labels.confidence',
                'annotation_labels.created_at',
                'annotation_labels.updated_at'
            )
            ->get()
            ->groupBy('volume_id')
            ->map(function ($group) {
                return $group->map(function ($label) {
                    unset($label->volume_id);
                    return (array) $label;
                });
            })
            ->toArray();

        $volumes->each(function ($volume) use ($annotations, $annotationLabels) {
            $volume->makeHidden(['creator_id', 'created_at', 'updated_at']);

            if (array_key_exists($volume->id, $annotations)) {
                $volume->annotations = $annotations[$volume->id];
            } else {
                $volume->annotations = [];
            }

            if (array_key_exists($volume->id, $annotationLabels)) {
                $volume->annotationLabels = $annotationLabels[$volume->id];
            } else {
                $volume->annotationLabels = [];
            }

            $volume->images->each(function ($image) {
                $image->makeHidden('volume_id');
            });
        });

        return $volumes->toArray();
    }

    /**
     * {@inheritdoc}
     */
    public function getFileName()
    {
        return 'volumes.json';
    }

    /**
     * {@inheritdoc}
     */
    public function getAdditionalExports()
    {

        $labelTreeIds = DB::table('labels')
            ->join('annotation_labels', 'annotation_labels.label_id', '=', 'labels.id')
            ->join('annotations', 'annotations.id', '=', 'annotation_labels.annotation_id')
            ->join('images', 'images.id', '=', 'annotations.image_id')
            ->whereIn('images.volume_id', $this->ids)
            ->select('labels.label_tree_id')
            ->distinct()
            ->get()
            ->pluck('label_tree_id')
            ->toArray();

        $labelTreeExport = new LabelTreeExport($labelTreeIds);

        $userExport = $labelTreeExport->getAdditionalExports()[0];
        $userIds = DB::table('annotation_labels')
            ->join('annotations', 'annotations.id', '=', 'annotation_labels.annotation_id')
            ->join('images', 'images.id', '=', 'annotations.image_id')
            ->whereIn('images.volume_id', $this->ids)
            ->select('annotation_labels.user_id')
            ->distinct()
            ->get()
            ->pluck('user_id')
            ->toArray();
        $userExport->addIds($userIds);

        return [$userExport, $labelTreeExport];
    }
}
