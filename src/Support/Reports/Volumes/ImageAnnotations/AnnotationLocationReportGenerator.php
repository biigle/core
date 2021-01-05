<?php

namespace Biigle\Modules\Reports\Support\Reports\Volumes\ImageAnnotations;

use Biigle\ImageAnnotationLabel;
use Biigle\LabelTree;
use Biigle\Modules\Reports\Support\File;
use Biigle\Modules\Reports\Support\Reports\MakesZipArchives;
use DB;
use GeoJson\Feature\Feature;
use GeoJson\Feature\FeatureCollection;
use GeoJson\Geometry\Point;

class AnnotationLocationReportGenerator extends AnnotationReportGenerator
{
    use MakesZipArchives;

    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    protected $name = 'annotation location image annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    protected $filename = 'annotation_location_image_annotation_report';

    /**
     * File extension of the report file.
     *
     * @var string
     */
    protected $extension = 'zip';

    /**
     * Generate the report.
     *
     * @param string $path Path to the report file that should be generated
     */
    public function generateReport($path)
    {
        $toZip = [];
        $items = $this->query()->get();

        if ($this->shouldSeparateLabelTrees() && $items->isNotEmpty()) {
            $items = $items->groupBy('label_tree_id');
            $trees = LabelTree::whereIn('id', $items->keys())->pluck('name', 'id');

            foreach ($trees as $id => $name) {
                $tmpItems = $items->get($id);
                $file = $this->createNdJSON($tmpItems);
                $this->tmpFiles[] = $file;
                $toZip[$file->getPath()] = $this->sanitizeFilename("{$id}-{$name}", 'ndjson');
            }
        } else {
            $file = $this->createNdJSON($items);
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
            'image_annotation_labels.id as annotation_label_id',
            'image_annotation_labels.label_id',
            'image_annotations.image_id',
            'images.filename',
            'images.attrs->metadata->yaw as yaw',
            'images.attrs->metadata->distance_to_ground as distance_to_ground',
            'images.attrs->width as width',
            'images.attrs->height as height',
            'images.lat',
            'images.lng',
            'image_annotations.points',
            'image_annotation_labels.id as annotation_label_id',
            'labels.name as label_name',
        ])
        ->whereNotNull('images.lat')
        ->whereNotNull('images.lng')
        ->whereNotNull('images.attrs->width')
        ->whereNotNull('images.attrs->height')
        ->whereNotNull('images.attrs->metadata->distance_to_ground')
        ->whereNotNull('images.attrs->metadata->yaw');
    }

    /**
     * Create the newline delimited GeoJSON file.
     *
     * @param \Illuminate\Support\Collection $items
     *
     * @return File
     */
    protected function createNdJSON($items)
    {
        $file = File::makeTmp();

        $items->each(function ($item) use ($file) {
            $properties = [
                '_id' => $item->annotation_label_id,
                '_image_id' => $item->image_id,
                '_image_filename' => $item->filename,
                '_image_latitude' => floatval($item->lat),
                '_image_longitude' => floatval($item->lng),
                '_label_name' => $item->label_name,
                '_label_id' => $item->label_id,
            ];

            $geometry = $this->estimateAnnotationPosition($item);

            $feature = new Feature($geometry, $properties);
            $file->put(json_encode($feature)."\n");
        });
        $file->close();

        return $file;
    }

    /**
     * Estimate the position of an annotation in world coordinates.
     *
     * @param object $item
     *
     * @return \GeoJson\Geometry\Geometry
     */
    protected function estimateAnnotationPosition($item)
    {
        // First calculate the offset of the annotation from the image center in pixels.

        $imageCenter = [$item->width / 2, $item->height / 2];
        $points = json_decode($item->points);

        // Annotation position relative to the image center. Also, change the y axis from
        // going top down to going bottom up. This is required for the correct rotation
        // and shift calculation below.
        $pointsOffsetInPx = [
            $points[0] - $imageCenter[0],
            ($item->height - $points[1]) - $imageCenter[1],
        ];

        // Now rotate the annotation position around the image center according to the
        // yaw. This assumes that 0° yaw is north and 90° yaw is east.
        // See: https://stackoverflow.com/a/34374437/1796523

        // Yaw specifies the clockwise rotation in degrees but the formula below expects
        // the counterclockwise angle in radians.
        $angle = deg2rad(360 - floatval($item->yaw));

        // We don't need to shift the rotated coordinates back by adding $imageCenter,
        // as we assume that latitude and longitude describe the image center point and
        // not [0, 0], so the center is the "origin" here.
        $rotatedOffsetInPx = [
            $pointsOffsetInPx[0] * cos($angle) - $pointsOffsetInPx[1] * sin($angle),
            $pointsOffsetInPx[0] * sin($angle) + $pointsOffsetInPx[1] * cos($angle),
        ];

        // Then convert the pixel offset to meters.

        /* We assume that the camera points straight to the ground and the opening angle
         * is 90°. Therefore, the width of the image in meters is twice the distance of
         * the  camera to the ground.
         *
         *                    camera
         *                       o      -      Angle a is 90°.
         *                      /a\     |     Distance d to the ground.
         *                     /   \    |d      w = 2 * d
         *                    /     \   |
         *              -----|-------|---
         *             ground    w
         */
        $imageWidthInM = 2 * floatval($item->distance_to_ground);

        // The ratio of meter per pixel.
        $scalingFactor = $imageWidthInM / $item->width;

        $rotatedOffsetInM = array_map(function($point) use ($scalingFactor) {
          return $point * $scalingFactor;
        }, $rotatedOffsetInPx);

        // Finally, shift the image coordinates by the offset in meters to estimate the
        // annotation position.
        // See: https://gis.stackexchange.com/a/2980/50820

        $R = 6378137;

        $rotatedOffsetInRadians = [
            $rotatedOffsetInM[0] / ($R * cos(M_PI * $item->lat / 180)),
            $rotatedOffsetInM[1] / $R,
        ];

        // Shifted image center position.
        return new Point([
            $item->lng + $rotatedOffsetInRadians[0] * 180 / M_PI,
            $item->lat + $rotatedOffsetInRadians[1] * 180 / M_PI,
        ]);
    }
}
