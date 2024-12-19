<?php

namespace Biigle\Services\Export;

use Biigle\Volume;
use DB;

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
                $volume->media_type_name = $volume->mediaType->name;
                $volume->setHidden(['media_type_id', 'mediaType']);
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
        $labelTreeIds = $this->getLabelTreeIds();
        $labelTreeExport = new LabelTreeExport($labelTreeIds);

        $userExport = $labelTreeExport->getAdditionalExports()[0];
        $userIds = $this->getUserIds();
        $userExport->addIds($userIds);

        $imageExport = new ImageExport($this->ids);
        $imageAnnotationExport = new ImageAnnotationExport($this->ids);
        $imageAnnotationLabelExport = new ImageAnnotationLabelExport($this->ids);
        $imageLabelExport = new ImageLabelExport($this->ids);

        $videoExport = new VideoExport($this->ids);
        $videoAnnotationExport = new VideoAnnotationExport($this->ids);
        $videoAnnotationLabelExport = new VideoAnnotationLabelExport($this->ids);
        $videoLabelExport = new VideoLabelExport($this->ids);

        return [
            $userExport,
            $labelTreeExport,
            $imageExport,
            $imageAnnotationExport,
            $imageAnnotationLabelExport,
            $imageLabelExport,
            $videoExport,
            $videoAnnotationExport,
            $videoAnnotationLabelExport,
            $videoLabelExport,
        ];
    }

    /**
     * Get the label tree IDs that are associated with the volumes of this export.
     *
     * @return array
     */
    protected function getLabelTreeIds()
    {
        return DB::table('labels')
            ->whereIn('id', function ($query) {
                $query->select('image_annotation_labels.label_id')
                    ->from('image_annotation_labels')
                    ->join('image_annotations', 'image_annotations.id', '=', 'image_annotation_labels.annotation_id')
                    ->join('images', 'images.id', '=', 'image_annotations.image_id')
                    ->whereIn('images.volume_id', $this->ids);
            })
            ->orWhereIn('id', function ($query) {
                $query->select('image_labels.label_id')
                    ->from('image_labels')
                    ->join('images', 'images.id', '=', 'image_labels.image_id')
                    ->whereIn('images.volume_id', $this->ids);
            })
            ->orWhereIn('id', function ($query) {
                $query->select('video_annotation_labels.label_id')
                    ->from('video_annotation_labels')
                    ->join('video_annotations', 'video_annotations.id', '=', 'video_annotation_labels.annotation_id')
                    ->join('videos', 'videos.id', '=', 'video_annotations.video_id')
                    ->whereIn('videos.volume_id', $this->ids);
            })
            ->orWhereIn('id', function ($query) {
                $query->select('video_labels.label_id')
                    ->from('video_labels')
                    ->join('videos', 'videos.id', '=', 'video_labels.video_id')
                    ->whereIn('videos.volume_id', $this->ids);
            })
            ->distinct()
            ->pluck('labels.label_tree_id')
            ->toArray();
    }

    /**
     * Get the user IDs that are associated with the volumes of this export.
     *
     * @return array
     */
    protected function getUserIds()
    {
        return DB::table('users')
            ->whereIn('id', function ($query) {
                $query->select('image_annotation_labels.user_id')
                    ->from('image_annotation_labels')
                    ->join('image_annotations', 'image_annotations.id', '=', 'image_annotation_labels.annotation_id')
                    ->join('images', 'images.id', '=', 'image_annotations.image_id')
                    ->whereIn('images.volume_id', $this->ids);
            })
            ->orWhereIn('id', function ($query) {
                $query->select('image_labels.user_id')
                    ->from('image_labels')
                    ->join('images', 'images.id', '=', 'image_labels.image_id')
                    ->whereIn('images.volume_id', $this->ids);
            })
            ->orWhereIn('id', function ($query) {
                $query->select('video_annotation_labels.user_id')
                    ->from('video_annotation_labels')
                    ->join('video_annotations', 'video_annotations.id', '=', 'video_annotation_labels.annotation_id')
                    ->join('videos', 'videos.id', '=', 'video_annotations.video_id')
                    ->whereIn('videos.volume_id', $this->ids);
            })
            ->orWhereIn('id', function ($query) {
                $query->select('video_labels.user_id')
                    ->from('video_labels')
                    ->join('videos', 'videos.id', '=', 'video_labels.video_id')
                    ->whereIn('videos.volume_id', $this->ids);
            })
            ->pluck('id')
            ->toArray();
    }
}
