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
            ->select([
                'id',
                'name',
                'media_type_id',
                'url',
                'attrs',
            ])
            ->get()
            ->each(function ($volume) {
                $volume->setHidden([]);
                $volume->setAppends([]);
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
            ->whereIn('id', function ($query) {
                $query->select('annotation_labels.label_id')
                    ->from('annotation_labels')
                    ->join('annotations', 'annotations.id', '=', 'annotation_labels.annotation_id')
                    ->join('images', 'images.id', '=', 'annotations.image_id')
                    ->whereIn('images.volume_id', $this->ids);
            })
            ->orWhereIn('id', function ($query) {
                $query->select('image_labels.label_id')
                    ->from('image_labels')
                    ->join('images', 'images.id', '=', 'image_labels.image_id')
                    ->whereIn('images.volume_id', $this->ids);
            })
            ->select('labels.label_tree_id')
            ->distinct()
            ->get()
            ->pluck('label_tree_id')
            ->toArray();

        $labelTreeExport = new LabelTreeExport($labelTreeIds);

        $userExport = $labelTreeExport->getAdditionalExports()[0];
        $userIds = DB::table('users')
            ->whereIn('id', function ($query) {
                $query->select('annotation_labels.user_id')
                    ->from('annotation_labels')
                    ->join('annotations', 'annotations.id', '=', 'annotation_labels.annotation_id')
                    ->join('images', 'images.id', '=', 'annotations.image_id')
                    ->whereIn('images.volume_id', $this->ids);
            })
            ->orWhereIn('id', function ($query) {
                $query->select('image_labels.user_id')
                    ->from('image_labels')
                    ->join('images', 'images.id', '=', 'image_labels.image_id')
                    ->whereIn('images.volume_id', $this->ids);
            })
            ->pluck('id')
            ->toArray();

        $userExport->addIds($userIds);

        $imageExport = new ImageExport($this->ids);
        $annotationExport = new AnnotationExport($this->ids);
        $annotationLabelExport = new AnnotationLabelExport($this->ids);
        $imageLabelExport = new ImageLabelExport($this->ids);

        return [
            $userExport,
            $labelTreeExport,
            $imageExport,
            $annotationExport,
            $annotationLabelExport,
            $imageLabelExport,
        ];
    }
}
