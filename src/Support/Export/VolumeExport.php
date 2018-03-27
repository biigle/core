<?php

namespace Biigle\Modules\Sync\Support\Export;

use DB;

class VolumeExport extends Export
{
    /**
     * {@inheritdoc}
     */
    public function getContent()
    {
        $volumes = DB::table('volumes')
            ->whereIn('id', $this->ids)
            ->select([
                'id',
                'name',
                'media_type_id',
                'url',
                'attrs',
            ])
            ->get()
            ->map(function ($volume) {
                return (array) $volume;
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

        $imageExport = new ImageExport($this->ids);
        $annotationExport = new AnnotationExport($this->ids);
        $annotationLabelExport = new AnnotationLabelExport($this->ids);

        return [
            $userExport,
            $labelTreeExport,
            $imageExport,
            $annotationExport,
            $annotationLabelExport,
        ];
    }
}
