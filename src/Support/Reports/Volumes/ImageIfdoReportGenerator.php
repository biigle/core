<?php

namespace Biigle\Modules\Reports\Support\Reports\Volumes;

use Biigle\Image;
use Biigle\Label;
use Biigle\Modules\Reports\Support\Reports\Volumes\ImageAnnotations\AnnotationReportGenerator;
use Biigle\User;
use DB;

class ImageIfdoReportGenerator extends AnnotationReportGenerator
{
    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    protected $name = 'iFDO report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    protected $filename = 'ifdo_report';

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
     * Generate the report.
     *
     * @param string $path Path to the report file that should be generated
     */
    public function generateReport($path)
    {
        $this->users = $this->getUsers()->keyBy('id');
        $this->labels = $this->getLabels()->keyBy('id');

        $this->query()->eachById([$this, 'processImage']);

        $ifdo = $this->source->getIfdo();

        if (is_null($ifdo)) {
            // throw
        }

        $creators = array_map(function ($user) {
            return [
                'id' => $user->uuid,
                'name' => "{$user->firstname} {$user->lastname}",
                // TODO maybe leave this out? No way to determine the type here.
                'type' => 'expert',
            ];
        }, $this->imageAnnotationCreators);

        $ifdo['image-set-header']['image-annotation-creators'] = $creators;

        $labels = array_map(function ($label) {
            return [
                'id' => $label->id,
                'name' => $label->name,
            ];
        }, $this->imageAnnotationLabels);

        $ifdo['image-set-header']['image-annotation-labels'] = $labels;

        if (array_key_exists('image-set-items', $ifdo)) {
            $ifdo['image-set-items'] = array_merge($ifdo['image-set-items'], $this->imageSetItems);
        } else {
            $ifdo['image-set-items'] = $this->imageSetItems;
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
        return $this->source->images()
            ->with(['annotations' => function ($query) {
                if ($this->isRestrictedToExportArea()) {
                    return $this->restrictToExportAreaQuery($query);
                }
            }])
            ->with(['annotations.labels' => function ($query) {
                if ($this->isRestrictedToNewestLabel()) {
                    $query = $this->restrictToNewestLabelQuery($query);
                }

                if ($this->isRestrictedToLabels()) {
                    $query = $this->restrictToLabelsQuery($query);
                }

                return $query;
            }]);
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
        })->get();
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
        })->get();
    }

    /**
     * Create the image-set-item entry for an image.
     *
     * @param Image $image
     *
     */
    public function processImage(Image $image)
    {
        $annotations = $image->annotations->map(function ($annotation) {
            $labels = $annotation->labels->map(function ($aLabel) {
                $user = $this->users->get($aLabel->user_id);
                if (!in_array($user, $this->imageAnnotationCreators)) {
                    $this->imageAnnotationCreators[] = $user;
                }

                $label = $this->labels->get($aLabel->label_id);
                if (!in_array($label, $this->imageAnnotationLabels)) {
                    $this->imageAnnotationLabels[] = $label;
                }

                return [
                    'label' => $label->id,
                    'annotator' => $user->uuid,
                    'confidence' => $aLabel->confidence,
                ];
            });

            return [
                'coordinates' => $annotation->points,
                'labels' => $labels->toArray(),
            ];
        });

        $this->imageSetItems[$image->filename] = [
            'image-annotations' => $annotations->toArray(),
        ];
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
}
