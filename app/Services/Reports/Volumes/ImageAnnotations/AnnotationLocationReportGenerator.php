<?php

namespace Biigle\Services\Reports\Volumes\ImageAnnotations;

use Biigle\LabelTree;
use Biigle\Services\Reports\File;
use Biigle\Services\Reports\MakesZipArchives;
use Biigle\Shape;
use Biigle\User;
use DB;
use GeoJson\Feature\Feature;
use GeoJson\Geometry\LineString;
use GeoJson\Geometry\Point;
use GeoJson\Geometry\Polygon;

class AnnotationLocationReportGenerator extends AnnotationReportGenerator
{
    use MakesZipArchives;

    /**
     * Earth radius in cm.
     *
     * @var int
     */
    const EARTH_RADIUS = 6378137;

    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    public $name = 'annotation location image annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename = 'annotation_location_image_annotation_report';

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
        } elseif ($this->shouldSeparateUsers() && $items->isNotEmpty()) {
            $items = $items->groupBy('user_id');
            $users = User::whereIn('id', $items->keys())
                ->selectRaw("id, concat(firstname, ' ', lastname) as name")
                ->pluck('name', 'id');

            foreach ($users as $id => $name) {
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
        return $this
            ->initQuery([
                'image_annotation_labels.id as annotation_label_id',
                'image_annotation_labels.label_id',
                'image_annotations.image_id',
                'image_annotations.shape_id',
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
            $file->put(json_encode($feature));
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
        $flatPoints = json_decode($item->points);

        // GeoJSON does no support circles so we treat them as points.
        if ($item->shape_id === Shape::circleId()) {
            unset($flatPoints[2]);
        }

        $points = [];
        $limit = count($flatPoints) - 1;
        for ($i = 0; $i < $limit; $i += 2) {
            $points[] = [$flatPoints[$i], $flatPoints[$i + 1]];
        }

        // Annotation position relative to the image center. Also, change the y axis from
        // going top down to going bottom up. This is required for the correct rotation
        // and shift calculation below.
        $pointsOffsetInPx = array_map(fn ($point) => [
            $point[0] - $imageCenter[0],
            ($item->height - $point[1]) - $imageCenter[1],
        ], $points);

        // Now rotate the annotation position around the image center according to the
        // yaw. This assumes that 0° yaw is north and 90° yaw is east.
        // See: https://stackoverflow.com/a/34374437/1796523

        // Yaw specifies the clockwise rotation in degrees but the formula below expects
        // the counterclockwise angle in radians.
        $angle = deg2rad(360 - floatval($item->yaw));

        // We don't need to shift the rotated coordinates back by adding $imageCenter,
        // as we assume that latitude and longitude describe the image center point and
        // not [0, 0], so the center is the "origin" here.
        $rotatedOffsetInPx = array_map(fn ($point) => [
            $point[0] * cos($angle) - $point[1] * sin($angle),
            $point[0] * sin($angle) + $point[1] * cos($angle),
        ], $pointsOffsetInPx);

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

        $rotatedOffsetInM = array_map(fn ($point) => [
            $point[0] * $scalingFactor,
            $point[1] * $scalingFactor,
        ], $rotatedOffsetInPx);

        // Finally, shift the image coordinates by the offset in meters to estimate the
        // annotation position.
        // See: https://gis.stackexchange.com/a/2980/50820

        $rotatedOffsetInRadians = array_map(fn ($point) => [
            $point[0] / (self::EARTH_RADIUS * cos(M_PI * $item->lat / 180)),
            $point[1] / self::EARTH_RADIUS,
        ], $rotatedOffsetInM);

        $coordinates = array_map(function ($point) use ($item) {
            // Shifted image center position.
            return [
                $item->lng + $point[0] * 180 / M_PI,
                $item->lat + $point[1] * 180 / M_PI,
            ];
        }, $rotatedOffsetInRadians);

        switch ($item->shape_id) {
            case Shape::pointId():
            case Shape::circleId():
                return new Point($coordinates[0]);
            case Shape::lineId():
                return new LineString($coordinates);
        }

        // The last polygon coordinate must equal the first.
        $last = count($coordinates) - 1;
        if ($coordinates[0][0] !== $coordinates[$last][0] || $coordinates[0][1] !== $coordinates[$last][1]) {
            $coordinates[] = $coordinates[0];
        }

        // Catch some edge cases where a polygon does not have at least three unique
        // coordinates (triangle).
        while (count($coordinates) < 4) {
            $coordinates[] = $coordinates[0];
        }

        return new Polygon([$coordinates]);
    }
}
