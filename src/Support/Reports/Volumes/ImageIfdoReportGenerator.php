<?php

namespace Biigle\Modules\Reports\Support\Reports\Volumes;

use Biigle\Image;
use Biigle\Label;
use Biigle\LabelSource;
use Biigle\Modules\Reports\Support\Reports\Volumes\ImageAnnotations\AnnotationReportGenerator;
use Biigle\Shape;
use Biigle\User;
use DB;
use Exception;

class ImageIfdoReportGenerator extends AnnotationReportGenerator
{
    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    protected $name = 'image iFDO report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    protected $filename = 'image_ifdo_report';

    /**
     * File extension of the report file.
     *
     * @var string
     */
    protected $extension = 'yaml';

    /**
     * Labels that have been used in this volume.
     *
     * @var Illuminate\Support\Collection
     */
    protected $labels;

    /**
     * Users that have been used in this volume.
     *
     * @var Illuminate\Support\Collection
     */
    protected $users;

    /**
     * All labels that should be contained in the iFDO.
     *
     * @var array
     */
    protected $imageAnnotationLabels = [];

    /**
     * All users that should be contained in the iFDO.
     *
     * @var array
     */
    protected $imageAnnotationCreators = [];

    /**
     * iFDO image-annotation arrays for each image of the volume.
     *
     * @var array
     */
    protected $imageSetItems = [];

    /**
     * Label source model for the WoRMS database.
     *
     * @var LabelSource
     */
    protected $wormsLabelSource;

    /**
     * Generate the report.
     *
     * @param string $path Path to the report file that should be generated
     */
    public function generateReport($path)
    {
        $this->wormsLabelSource = LabelSource::where('name', 'worms')->first();
        $this->users = $this->getUsers()->keyBy('id');
        $this->labels = $this->getLabels()->keyBy('id');

        $this->query()->eachById([$this, 'processImage']);

        $ifdo = $this->source->getIfdo();

        if (is_null($ifdo)) {
            throw new Exception("No iFDO file found for the volume.");
        }

        $creators = array_map(function ($user) {
            return [
                'id' => $user->uuid,
                'name' => "{$user->firstname} {$user->lastname}",
                // TODO maybe leave this out? No way to determine the type here.
                'type' => 'expert',
            ];
        }, $this->imageAnnotationCreators);

        if ($this->options->get('stripIfdo', false)) {
            unset($ifdo['image-set-header']['image-annotation-creators']);
            unset($ifdo['image-set-header']['image-annotation-labels']);
            if (array_key_exists('image-set-items', $ifdo)) {
                foreach ($ifdo['image-set-items'] as &$item) {
                    if ($this->isArrayItem($item)) {
                        unset($item[0]['image-annotations']);
                        unset($item[0]['image-annotation-geometry-types']);
                    } else {
                        unset($item['image-annotations']);
                        unset($item['image-annotation-geometry-types']);
                    }
                }
                // Always unset by-reference variables of loops.
                unset($item);
            }
        }

        if (!empty($creators)) {
            $ifdo['image-set-header']['image-annotation-creators'] = array_merge(
                $ifdo['image-set-header']['image-annotation-creators'] ?? [],
                $creators
            );
        }

        $labels = array_map(function ($label) {
            if ($this->shouldConvertWormsId($label)) {
                return [
                    'id' => $this->getWormsUrn($label),
                    'name' => $label->name,
                ];
            }

            return [
                'id' => $label->id,
                'name' => $label->name,
            ];
        }, $this->imageAnnotationLabels);

        if (!empty($labels)) {
            $ifdo['image-set-header']['image-annotation-labels'] = array_merge(
                $ifdo['image-set-header']['image-annotation-labels'] ?? [],
                $labels
            );
        }

        if (!empty($this->imageSetItems)) {
            $keys = array_keys($this->imageSetItems);

            $ifdo['image-set-items'] = $ifdo['image-set-items'] ?? [];

            foreach ($keys as $key) {
                $this->mergeImageSetItem($key, $ifdo['image-set-items']);
            }
        }

        $this->writeYaml($ifdo, $path);
    }

    /**
     * Assemble a new DB query for the volume of this report.
     *
     * @return \Illuminate\Database\Query\Builder
     */
    protected function query()
    {
        $relations = [
            'annotations' => function ($query) {
                if ($this->isRestrictedToExportArea()) {
                    return $this->restrictToExportAreaQuery($query);
                }
            },
            'annotations.labels' => function ($query) {
                if ($this->isRestrictedToNewestLabel()) {
                    $query = $this->restrictToNewestLabelQuery($query);
                }

                if ($this->isRestrictedToLabels()) {
                    $query = $this->restrictToLabelsQuery($query);
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
     * @param Image $image
     *
     */
    public function processImage(Image $image)
    {
        $geometryTypes = [];

        // Remove annotations that should not be included because of an "onlyLabels"
        // filter.
        $annotations = $image->annotations->filter(function ($a) {
            return $a->labels->isNotEmpty();
        });

        $geometryTypes = $annotations->map(function ($a) {
                if ($a->shape_id === Shape::pointId()) {
                    return 'single-pixel';
                } elseif ($a->shape_id === Shape::circleId()) {
                    // Circles don't store the coordinates but could be converted to
                    // bounding boxes.
                    return 'bounding-box';
                } else {
                    // We treat ellipses as rectangles and rectangles as polygons.
                    // Also, line strings can only be represented as polygons in iFDO.
                    return 'polygon';
                }
            })
            ->unique()
            ->toArray();

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
                    'created-at' => (string) $aLabel->created_at,
                ];
            });

            return [
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
                'coordinates' => [],
                'labels' => [
                    [
                        'label' => $labelId,
                        'annotator' => $user->uuid,
                        'created-at' => (string) $iLabel->created_at,
                    ],
                ],
            ];
        });

        if ($labels->isNotEmpty()) {
            $geometryTypes[] = 'whole-image';
        }

        $this->imageSetItems[$image->filename] = [];

        // Use toBase() because the merge method of Eloquent collections works
        // differently.
        $imageAnnotations = $annotations->toBase()->merge($labels)->toArray();

        if (!empty($imageAnnotations)) {
            $this->imageSetItems[$image->filename]['image-annotations'] = $imageAnnotations;
            $this->imageSetItems[$image->filename]['image-annotation-geometry-types'] = $geometryTypes;
        }
    }

    /**
     * Write the report YAML file.
     *
     * @param array $content
     * @param string $path
     */
    protected function writeYaml(array $content, string $path)
    {
        yaml_emit_file($path, $content);
    }

    /**
     * Determine if the label ID should be converted to a WoRMS URN.
     *
     * @param Label $label
     *
     * @return bool
     */
    protected function shouldConvertWormsId(Label $label)
    {
        return $this->wormsLabelSource && $label->label_source_id === $this->wormsLabelSource->id;
    }

    /**
     * Get the WoRMS URN for a label (if it has one).
     *
     * @param Label $label
     *
     * @return string
     */
    protected function getWormsUrn($label)
    {
        return "urn:lsid:marinespecies.org:taxname:{$label->source_id}";
    }

    /**
     * Determine if an iFDO item is a single object or an array of objects.
     * Both are allowed for images. Only the latter should be the case for videos.
     *
     * @param array $item
     *
     * @return boolean
     */
    protected function isArrayItem($item)
    {
        return !empty($item) && array_reduce(array_keys($item), function ($carry, $key) {
            return $carry && is_numeric($key);
        }, true);
    }

    /**
     * Merge an image-set-items item of the original iFDO with the item generated by this
     * report.
     *
     * @param string $key Filename key of the item (guaranteed to be in
     * $this->imageSetItems).
     * @param array $ifdoItems image-set-items of the original iFDO
     */
    protected function mergeImageSetItem($key, &$ifdoItems)
    {
        if (array_key_exists($key, $ifdoItems)) {
            if ($this->isArrayItem($ifdoItems[$key])) {
                if ($this->isArrayItem($this->imageSetItems[$key])) {
                    $ifdoItems[$key][0] = array_merge_recursive(
                        $ifdoItems[$key][0],
                        $this->imageSetItems[$key][0]
                    );
                } else {
                    $ifdoItems[$key][0] = array_merge_recursive(
                        $ifdoItems[$key][0],
                        $this->imageSetItems[$key]
                    );
                }
            } else {
                $ifdoItems[$key] = array_merge_recursive(
                    $ifdoItems[$key],
                    $this->imageSetItems[$key]
                );
            }
        } else {
            $ifdoItems[$key] = $this->imageSetItems[$key];
        }
    }
}
