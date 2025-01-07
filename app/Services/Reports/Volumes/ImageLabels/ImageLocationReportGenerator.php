<?php

namespace Biigle\Services\Reports\Volumes\ImageLabels;

use Biigle\ImageLabel;
use Biigle\LabelTree;
use Biigle\Services\Reports\File;
use Biigle\Services\Reports\MakesZipArchives;
use Biigle\Services\Reports\Volumes\VolumeReportGenerator;
use Biigle\User;
use DB;
use GeoJson\Feature\Feature;
use GeoJson\Feature\FeatureCollection;
use GeoJson\Geometry\Point;

class ImageLocationReportGenerator extends VolumeReportGenerator
{
    use MakesZipArchives;

    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    public $name = 'image location image label report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename = 'image_location_image_label_report';

    /**
     * File extension of the report file.
     *
     * @var string
     */
    public $extension = 'zip';

    /**
     * Generate the report.
     *
     * @param string $path Path to the report file that should be generated
     */
    public function generateReport($path)
    {
        $toZip = [];
        $usedImageLabelsQuery = ImageLabel::join('images', 'image_labels.image_id', '=', 'images.id')
            ->join('labels', 'image_labels.label_id', '=', 'labels.id')
            ->where('images.volume_id', $this->source->id)
            ->when($this->isRestrictedToLabels(), function ($query) {
                return $this->restrictToLabelsQuery($query, 'image_labels');
            })
            ->orderBy('labels.id')
            ->distinct();

        $imageLabels = $this->query()->get();

        $images = $this->source->images()
            ->whereNotNull('lng')
            ->whereNotNull('lat');

        if ($this->shouldSeparateLabelTrees() && $imageLabels->isNotEmpty()) {
            $imageLabels = $imageLabels->groupBy('label_tree_id');
            $trees = LabelTree::whereIn('id', $imageLabels->keys())->pluck('name', 'id');

            foreach ($trees as $id => $name) {
                $usedImageLabels = (clone $usedImageLabelsQuery)
                    ->where('labels.label_tree_id', $id)
                    ->pluck('labels.name', 'labels.id');

                $tmpImageLabels = $imageLabels->get($id)->groupBy('image_id');
                $file = $this->createNdJSON($images, $usedImageLabels, $tmpImageLabels);
                $this->tmpFiles[] = $file;
                $toZip[$file->getPath()] = $this->sanitizeFilename("{$id}-{$name}", 'ndjson');
            }
        } elseif ($this->shouldSeparateUsers() && $imageLabels->isNotEmpty()) {
            $usedImageLabels = $usedImageLabelsQuery->pluck('labels.name', 'labels.id');
            $imageLabels = $imageLabels->groupBy('user_id');
            $users = User::whereIn('id', $imageLabels->keys())
                ->selectRaw("id, concat(firstname, ' ', lastname) as name")
                ->pluck('name', 'id');

            foreach ($users as $id => $name) {
                $tmpImageLabels = $imageLabels->get($id)->groupBy('image_id');
                $file = $this->createNdJSON($images, $usedImageLabels, $tmpImageLabels);
                $this->tmpFiles[] = $file;
                $toZip[$file->getPath()] = $this->sanitizeFilename("{$id}-{$name}", 'ndjson');
            }
        } else {
            $usedImageLabels = $usedImageLabelsQuery->pluck('labels.name', 'labels.id');
            $imageLabels = $imageLabels->groupBy('image_id');
            $file = $this->createNdJSON($images, $usedImageLabels, $imageLabels);
            $this->tmpFiles[] = $file;
            $toZip[$file->getPath()] = $this->sanitizeFilename("{$this->source->id}-{$this->source->name}", 'ndjson');
        }

        $this->makeZip($toZip, $path);
    }

    /**
     * Assemble a new DB query for the volume of this report.
     *
     * @return \Illuminate\Database\Query\Builder
     */
    public function query()
    {
        $query = DB::table('image_labels')
            ->join('images', 'image_labels.image_id', '=', 'images.id')
            ->select([
                'image_labels.image_id',
                'image_labels.label_id',
            ])
            ->where('images.volume_id', $this->source->id)
            ->when($this->isRestrictedToLabels(), function ($query) {
                return $this->restrictToLabelsQuery($query, 'image_labels');
            });

        if ($this->shouldSeparateLabelTrees()) {
            $query->join('labels', 'labels.id', '=', 'image_labels.label_id')
                ->addSelect('labels.label_tree_id');
        } elseif ($this->shouldSeparateUsers()) {
            $query->addSelect('image_labels.user_id');
        }

        return $query;
    }

    /**
     * Create the newline delimited GeoJSON file.
     *
     * @param \Illuminate\Database\Query\Builder $query
     * @param \Illuminate\Support\Collection $usedImageLabels
     * @param \Illuminate\Support\Collection $imageLabels
     *
     * @return File
     */
    protected function createNdJSON($query, $usedImageLabels, $imageLabels)
    {
        $file = File::makeTmp();

        $query->each(function ($image) use ($usedImageLabels, $imageLabels, $file) {
            $properties = [
                '_id' => $image->id,
                '_filename' => $image->filename,
            ];

            foreach ($usedImageLabels as $id => $name) {
                $item = $imageLabels->get($image->id);
                if ($item && $item->firstWhere('label_id', $id)) {
                    $properties["{$name} (#{$id})"] = 1;
                } else {
                    $properties["{$name} (#{$id})"] = 0;
                }
            }

            $feature = new Feature(new Point([$image->lng, $image->lat]), $properties);
            $file->put(json_encode($feature)."\n");
        });
        $file->close();

        return $file;
    }
}
