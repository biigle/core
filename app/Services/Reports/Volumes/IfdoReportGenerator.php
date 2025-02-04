<?php

namespace Biigle\Services\Reports\Volumes;

use Biigle\Annotation;
use Biigle\Ifdo\Ifdo;
use Biigle\Image;
use Biigle\Label;
use Biigle\LabelSource;
use Biigle\Modules\MetadataIfdo\IfdoParser;
use Biigle\Shape;
use Biigle\Volume;
use Exception;
use File;
use Storage;

abstract class IfdoReportGenerator extends VolumeReportGenerator
{
    /**
     * File extension of the report file.
     *
     * @var string
     */
    public $extension = 'json';

    /**
     * Labels that have been used in this volume.
     *
     * @var \Illuminate\Support\Collection
     */
    protected $labels;

    /**
     * Users that have been used in this volume.
     *
     * @var \Illuminate\Support\Collection
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
     * @var ?LabelSource
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

        $this->processFiles();

        if (!$this->hasIfdo($this->source)) {
            throw new Exception("No iFDO file found for the volume.");
        }

        $ifdo = $this->getIfdo($this->source)->getJsonData();

        $creators = array_map(function ($user) {
            return [
                'id' => $user->uuid,
                'name' => "{$user->firstname} {$user->lastname}",
                'uuid' => $user->uuid,
            ];
        }, $this->imageAnnotationCreators);

        if ($this->options->get('stripIfdo', false)) {
            unset($ifdo['image-set-header']['image-annotation-creators'], $ifdo['image-set-header']['image-annotation-labels']);
            if (array_key_exists('image-set-items', $ifdo)) {
                foreach ($ifdo['image-set-items'] as &$item) {
                    if ($this->isArrayItem($item)) {
                        foreach ($item as &$entry) {
                            unset($entry['image-annotations']);
                        }
                        // Always unset by-reference variables of loops.
                        unset($entry);
                    } else {
                        unset($item['image-annotations']);
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
            $id = $label->id;
            if ($this->shouldConvertWormsId($label)) {
                $id = $this->getWormsUrn($label);
            }

            return [
                'id' => "$id",
                'name' => $label->name,
                'uuid' => $label->uuid,
                'color' => $label->color,
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

        $this->writeIfdo($ifdo, $path);
    }

    /**
     * Get all users who annotated in the volume.
     *
     * @return \Illuminate\Support\Collection
     */
    abstract protected function getUsers();

    /**
     * Get all labels that were used in the volume.
     *
     * @return \Illuminate\Support\Collection
     */
    abstract protected function getLabels();

    /**
     * Determine if the volume has a iFDO metadata file.
     */
    protected function hasIfdo(Volume $source): bool
    {
        return $source->metadata_file_path && $source->metadata_parser === IfdoParser::class;
    }

    /**
     * Create the image-set-item entries for the images or videos.
     */
    abstract public function processFiles();

    /**
     * Get the iFDO object of the volume if it has any.
     */
    protected function getIfdo(Volume $source): ?Ifdo
    {
        $content = Storage::disk($source->getMetadataFileDisk())
            ->get($source->metadata_file_path);

        if (!$content) {
            return null;
        }

        return Ifdo::fromString($content);
    }

    /**
     * Write the report JSON file.
     *
     * @param array $content
     * @param string $path
     */
    protected function writeIfdo(array $content, string $path)
    {
        File::put($path, json_encode($content));
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
        return !empty($item) && array_reduce(array_keys($item), fn ($carry, $key) => $carry && is_numeric($key), true);
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

    /**
     * Get an iFDO geometry name string for an annotation.
     *
     * @param Annotation $annotation
     *
     * @return string
     */
    protected function getGeometryName(Annotation $annotation)
    {
        if ($annotation->shape_id === Shape::pointId()) {
            return 'single-pixel';
        } elseif ($annotation->shape_id === Shape::lineId()) {
            return 'polyline';
        } elseif ($annotation->shape_id === Shape::circleId()) {
            return 'circle';
        } elseif ($annotation->shape_id === Shape::rectangleId()) {
            return 'rectangle';
        } elseif ($annotation->shape_id === Shape::ellipseId()) {
            return 'ellipse';
        } elseif ($annotation->shape_id === Shape::wholeFrameId()) {
            return 'whole-image';
        } else {
            return 'polygon';
        }
    }
}
