<?php

namespace Biigle\Modules\Reports\Support\Reports\Volumes\ImageAnnotations;

use Biigle\ImageAnnotationLabel;
use Biigle\LabelTree;
use Biigle\Modules\Reports\Support\File;
use Biigle\Modules\Reports\Support\Reports\MakesZipArchives;
use Biigle\User;
use DB;
use GeoJson\Feature\Feature;
use GeoJson\Feature\FeatureCollection;
use GeoJson\Geometry\Point;

class ImageLocationReportGenerator extends AnnotationReportGenerator
{
    use MakesZipArchives;

    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    public $name = 'image location image annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename = 'image_location_image_annotation_report';

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
        $usedLabelsQuery = ImageAnnotationLabel::join('image_annotations', 'image_annotation_labels.annotation_id', '=', 'image_annotations.id')
            ->join('images', 'image_annotations.image_id', '=', 'images.id')
            ->join('labels', 'image_annotation_labels.label_id', '=', 'labels.id')
            ->where('images.volume_id', $this->source->id)
            ->when($this->isRestrictedToLabels(), function ($query) {
                return $this->restrictToLabelsQuery($query, 'image_annotation_labels');
            })
            ->orderBy('labels.id')
            ->distinct();

        $labels = $this->query()->get();

        $images = $this->source->images()
            ->whereNotNull('lng')
            ->whereNotNull('lat');

        if ($this->shouldSeparateLabelTrees() && $labels->isNotEmpty()) {
            $labels = $labels->groupBy('label_tree_id');
            $trees = LabelTree::whereIn('id', $labels->keys())->pluck('name', 'id');

            foreach ($trees as $id => $name) {
                $usedLabels = (clone $usedLabelsQuery)
                    ->where('labels.label_tree_id', $id)
                    ->pluck('labels.name', 'labels.id');

                $tmpLabels = $labels->get($id)->groupBy('image_id');
                $file = $this->createNdJSON($images, $usedLabels, $tmpLabels);
                $this->tmpFiles[] = $file;
                $toZip[$file->getPath()] = $this->sanitizeFilename("{$id}-{$name}", 'ndjson');
            }
        } elseif ($this->shouldSeparateUsers() && $labels->isNotEmpty()) {
            $usedLabels = $usedLabelsQuery->pluck('labels.name', 'labels.id');
            $labels = $labels->groupBy('user_id');
            $users = User::whereIn('id', $labels->keys())
                ->selectRaw("id, concat(firstname, ' ', lastname) as name")
                ->pluck('name', 'id');

            foreach ($users as $id => $name) {
                $tmpLabels = $labels->get($id)->groupBy('image_id');
                $file = $this->createNdJSON($images, $usedLabels, $tmpLabels);
                $this->tmpFiles[] = $file;
                $toZip[$file->getPath()] = $this->sanitizeFilename("{$id}-{$name}", 'ndjson');
            }
        } else {
            $usedLabels = $usedLabelsQuery->pluck('labels.name', 'labels.id');
            $labels = $labels->groupBy('image_id');
            $file = $this->createNdJSON($images, $usedLabels, $labels);
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
        return $this->initQuery([
            'image_annotations.image_id',
            'image_annotation_labels.label_id',
        ]);
    }

    /**
     * Create the newline delimited GeoJSON file.
     *
     * @param \Illuminate\Database\Query\Builder $query
     * @param \Illuminate\Support\Collection $usedLabels
     * @param \Illuminate\Support\Collection $labels
     *
     * @return File
     */
    protected function createNdJSON($query, $usedLabels, $labels)
    {
        $file = File::makeTmp();

        $query->each(function ($image) use ($usedLabels, $labels, $file) {
            $properties = [
                '_id' => $image->id,
                '_filename' => $image->filename,
            ];

            foreach ($usedLabels as $id => $name) {
                $item = $labels->get($image->id);
                if ($item) {
                    $properties["{$name} (#{$id})"] = $item->where('label_id', $id)->count();
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
