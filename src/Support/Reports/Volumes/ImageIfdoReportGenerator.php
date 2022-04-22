<?php

namespace Biigle\Modules\Reports\Support\Reports\Volumes;

use Biigle\Image;
use Biigle\Label;
use Biigle\Shape;
use Biigle\User;
use Biigle\Video;
use Biigle\Modules\Reports\Traits\RestrictsToExportArea;
use Biigle\Modules\Reports\Traits\RestrictsToNewestLabels;

class ImageIfdoReportGenerator extends IfdoReportGenerator
{
    use RestrictsToExportArea, RestrictsToNewestLabels;

    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    public $name = 'image iFDO report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename = 'image_ifdo_report';

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
                $query = $query->orderBy('image_annotations.id');

                if ($this->isRestrictedToExportArea()) {
                    return $this->restrictToExportAreaQuery($query);
                }
            },
            'annotations.labels' => function ($query) {
                if ($this->isRestrictedToNewestLabel()) {
                    $query = $this->restrictToNewestLabelQuery($query, 'image_annotation_labels');
                }

                if ($this->isRestrictedToLabels()) {
                    $query = $this->restrictToLabelsQuery($query, 'image_annotation_labels');
                }

                return $query;
            },
            'labels' => function ($query) {
                if ($this->isRestrictedToLabels()) {
                    return $query->whereIn('image_labels.label_id', $this->getOnlyLabels());
                }
            },
        ];

        return $this->source->images()->with($relations);
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
                    ->from('image_annotation_labels')
                    ->join('image_annotations', 'image_annotations.id', '=', 'image_annotation_labels.annotation_id')
                    ->join('images', 'image_annotations.image_id', '=', 'images.id')
                    ->where('images.volume_id', $this->source->id);
            })
            ->orWhereIn('id', function ($query) {
                $query->select('user_id')
                    ->from('image_labels')
                    ->join('images', 'image_labels.image_id', '=', 'images.id')
                    ->where('images.volume_id', $this->source->id);
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
                    ->from('image_annotation_labels')
                    ->join('image_annotations', 'image_annotations.id', '=', 'image_annotation_labels.annotation_id')
                    ->join('images', 'image_annotations.image_id', '=', 'images.id')
                    ->where('images.volume_id', $this->source->id);
            })
            ->orWhereIn('id', function ($query) {
                $query->select('label_id')
                    ->from('image_labels')
                    ->join('images', 'image_labels.image_id', '=', 'images.id')
                    ->where('images.volume_id', $this->source->id);
            })
            ->get();
    }

    /**
     * Create the image-set-item entry for an image.
     *
     * @param Image|Video $image
     *
     */
    public function processFile(Image|Video $image)
    {
        // Remove annotations that should not be included because of an "onlyLabels"
        // filter.
        $annotations = $image->annotations->filter(function ($a) {
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
                    'label' => $labelId,
                    'annotator' => $user->uuid,
                    'confidence' => $aLabel->confidence,
                    'created-at' => $aLabel->created_at->toJson(),
                ];
            });

            return [
                'type' => $this->getGeometryType($annotation),
                'coordinates' => $annotation->points,
                'labels' => $labels->toArray(),
            ];
        });

        $labels = $image->labels->map(function ($iLabel) {
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
                'type' => 'whole-image',
                'coordinates' => [],
                'labels' => [
                    [
                        'label' => $labelId,
                        'annotator' => $user->uuid,
                        'created-at' => $iLabel->created_at->toJson(),
                    ],
                ],
            ];
        });

        $this->imageSetItems[$image->filename] = [];

        // Use toBase() because the merge method of Eloquent collections works
        // differently.
        $imageAnnotations = $annotations->toBase()->merge($labels)->toArray();

        if (!empty($imageAnnotations)) {
            $this->imageSetItems[$image->filename]['image-annotations'] = $imageAnnotations;
        }
    }
}
