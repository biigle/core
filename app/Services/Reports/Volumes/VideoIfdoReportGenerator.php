<?php

namespace Biigle\Services\Reports\Volumes;

use Biigle\Image;
use Biigle\Label;
use Biigle\Traits\RestrictsToNewestLabels;
use Biigle\Shape;
use Biigle\User;
use Biigle\Video;
use Biigle\Volume;

class VideoIfdoReportGenerator extends IfdoReportGenerator
{
    use RestrictsToNewestLabels;

    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    public $name = 'video iFDO report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename = 'video_ifdo_report';

    /**
     * Assemble a new DB query for the volume of this report.
     *
     * @return \Illuminate\Database\Query\Builder
     */
    protected function query()
    {
        $relations = [
            'annotations' => function ($query) {
                // This makes the beavior more consistent in tests, too.
                return $query->orderBy('video_annotations.id');
            },
            'annotations.labels' => function ($query) {
                if ($this->isRestrictedToNewestLabel()) {
                    $query = $this->restrictToNewestLabelQuery($query, $this->source);
                }

                if ($this->isRestrictedToLabels()) {
                    $query = $this->restrictToLabelsQuery($query, 'video_annotation_labels');
                }

                return $query;
            },
            'labels' => function ($query) {
                if ($this->isRestrictedToLabels()) {
                    return $query->whereIn('video_labels.label_id', $this->getOnlyLabels());
                }

                return $query;
            },
        ];

        return $this->source->videos()->with($relations);
    }

    /**
     * Get all users who annotated in the volume.
     *
     * @return Illuminate\Support\Collection
     */
    protected function getUsers()
    {
        return User::whereIn('id', function ($query) {
                $query->select('user_id')
                    ->from('video_annotation_labels')
                    ->join('video_annotations', 'video_annotations.id', '=', 'video_annotation_labels.annotation_id')
                    ->join('videos', 'video_annotations.video_id', '=', 'videos.id')
                    ->where('videos.volume_id', $this->source->id);
            })
            ->orWhereIn('id', function ($query) {
                $query->select('user_id')
                    ->from('video_labels')
                    ->join('videos', 'video_labels.video_id', '=', 'videos.id')
                    ->where('videos.volume_id', $this->source->id);
            })
            ->get();
    }

    /**
     * Get all labels that were used in the volume.
     *
     * @return Illuminate\Support\Collection
     */
    protected function getLabels()
    {
        return Label::whereIn('id', function ($query) {
                $query->select('label_id')
                    ->from('video_annotation_labels')
                    ->join('video_annotations', 'video_annotations.id', '=', 'video_annotation_labels.annotation_id')
                    ->join('videos', 'video_annotations.video_id', '=', 'videos.id')
                    ->where('videos.volume_id', $this->source->id);
            })
            ->orWhereIn('id', function ($query) {
                $query->select('label_id')
                    ->from('video_labels')
                    ->join('videos', 'video_labels.video_id', '=', 'videos.id')
                    ->where('videos.volume_id', $this->source->id);
            })
            ->get();
    }

    /**
     * Create the image-set-item entry for a video.
     *
     * @param Image|Video $video
     *
     */
    public function processFile(Image|Video $video)
    {
        // Remove annotations that should not be included because of an "onlyLabels"
        // filter.
        $annotations = $video->annotations->filter(function ($a) {
            return $a->labels->isNotEmpty();
        });

        $annotations = $annotations->map(function ($annotation) {
            $labels = $annotation->labels->map(function ($aLabel) {
                $user = $this->users->get($aLabel->user_id);
                if (!in_array($user, $this->imageAnnotationCreators)) {
                    $this->imageAnnotationCreators[] = $user;
                }

                $label = $this->labels->get($aLabel->label_id);
                if (!in_array($label, $this->imageAnnotationLabels)) {
                    $this->imageAnnotationLabels[] = $label;
                }

                if ($this->shouldConvertWormsId($label)) {
                    $labelId = $this->getWormsUrn($label);
                } else {
                    $labelId = $label->id;
                }

                return [
                    'label' => "$labelId",
                    'annotator' => $user->uuid,
                    'created-at' => $aLabel->created_at->toJson(),
                ];
            });

            return [
                'shape' => $this->getGeometryName($annotation),
                'coordinates' => $annotation->points,
                'frames' => $annotation->frames,
                'labels' => $labels->toArray(),
            ];
        });

        $labels = $video->labels->map(function ($iLabel) {
            $user = $this->users->get($iLabel->user_id);
            if (!in_array($user, $this->imageAnnotationCreators)) {
                $this->imageAnnotationCreators[] = $user;
            }

            $label = $this->labels->get($iLabel->label_id);
            if (!in_array($label, $this->imageAnnotationLabels)) {
                $this->imageAnnotationLabels[] = $label;
            }

            if ($this->shouldConvertWormsId($label)) {
                $labelId = $this->getWormsUrn($label);
            } else {
                $labelId = $label->id;
            }

            return [
                'shape' => 'whole-image',
                'coordinates' => [],
                'labels' => [
                    [
                        'label' => "$labelId",
                        'annotator' => $user->uuid,
                        'created-at' => $iLabel->created_at->toJson(),
                    ],
                ],
            ];
        });

        $this->imageSetItems[$video->filename] = [];

        // Use toBase() because the merge method of Eloquent collections works
        // differently.
        $videoAnnotations = $annotations->toBase()->merge($labels)->toArray();

        if (!empty($videoAnnotations)) {
            // In contrast to image items, video items should always be an array.
            // However, we only fill the first array entry with this report.
            $this->imageSetItems[$video->filename][] = [
                'image-annotations' => $videoAnnotations,
            ];
        }
    }
}
