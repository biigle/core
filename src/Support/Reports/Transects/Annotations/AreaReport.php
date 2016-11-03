<?php

namespace Dias\Modules\Export\Support\Reports\Transects\Annotations;

use DB;
use StdClass;
use Dias\Image;
use Dias\Shape;
use Dias\LabelTree;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Laserpoints\Image as LImage;

class AreaReport extends Report
{
    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    protected $name = 'annotation area report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    protected $filename = 'annotation_area_report';

    /**
     * File extension of the report file.
     *
     * @var string
     */
    protected $extension = 'xlsx';

    /**
     * All images that contain annotations which are included in this report
     *
     * @var Illuminate\Database\Eloquent\Collection
     */
    protected $images;

    /**
     * Generate the report.
     *
     * @return void
     */
    public function generateReport()
    {
        $rows = $this->query()->get();

        $this->images = Image::whereIn('id', $rows->pluck('image_id')->unique())
            ->select('id', 'filename', 'attrs')
            ->get()
            ->keyBy('id');

        if ($this->shouldSeparateLabelTrees()) {
            $rows = $rows->groupBy('label_tree_id');
            $trees = LabelTree::whereIn('id', $rows->keys())->pluck('name', 'id');

            foreach ($trees as $id => $name) {
                $this->tmpFiles[] = $this->createCsv($rows->get($id), $name);
            }

        } else {
            $this->tmpFiles[] = $this->createCsv($rows, $this->transect->name);
        }

        $this->executeScript('extended_report');
    }

    /**
     * Assemble a new DB query for the transect of this report.
     *
     * @return \Illuminate\Database\Query\Builder
     */
    protected function query()
    {
        $query = $this->initQuery([
                'annotations.id as annotation_id',
                'shapes.id as shape_id',
                'shapes.name as shape_name',
                'annotation_labels.label_id',
                'labels.name as label_name',
                'annotations.image_id',
                'annotations.points',
            ])
            ->join('shapes', 'annotations.shape_id', '=', 'shapes.id')
            // We can only compute the area from annotations that have and area.
            ->whereIn('shapes.id', [
                Shape::$circleId,
                Shape::$rectangleId,
                Shape::$polygonId,
            ])
            ->orderBy('annotation_labels.id');

        if (!$this->shouldSeparateLabelTrees()) {
            $query->join('labels', 'annotation_labels.label_id', '=', 'labels.id');
        }

        return $query;
    }

    /**
     * Create a CSV file for a single sheet of the spreadsheet of this report
     *
     * @param \Illuminate\Support\Collection $rows The rows for the CSV
     * @param string $title The title to put in the first row of the CSV
     * @return CsvFile
     */
    protected function createCsv($rows, $title = '')
    {
        $rows = $this->parseRows($rows);
        $csv = CsvFile::makeTmp();
        $csv->put([$title]);
        $csv->put([
            'annotation_id',
            'shape_id',
            'shape_name',
            'label_ids',
            'label_names',
            'image_id',
            'image_filename',
            'annotation_width_m',
            'annotation_height_m',
            'annotation_area_sqm',
            'annotation_width_px',
            'annotation_height_px',
            'annotation_area_sqpx',
        ]);

        foreach ($rows as $row) {
            $csv->put([
                $row->id,
                $row->shape_id,
                $row->shape_name,
                implode(', ', $row->label_ids),
                implode(', ', $row->label_names),
                $row->image_id,
                $row->image_filename,
                $row->width_m,
                $row->height_m,
                $row->area_sqm,
                $row->width_px,
                $row->height_px,
                $row->area_sqpx,
            ]);
        }

        $csv->close();

        return $csv;
    }

    /**
     * Creates the array of annotations that is inserted into the CSV file
     *
     * @param  Illuminate\Support\Collection $rows
     * @return array
     */
    protected function parseRows($rows)
    {
        $annotations = [];

        foreach ($rows as $row) {
            if (array_key_exists($row->annotation_id, $annotations)) {
                $annotations[$row->annotation_id]->label_ids[] = $row->label_id;
                $annotations[$row->annotation_id]->label_names[] = $row->label_name;
            } else {
                $annotation = new StdClass();
                $annotation->id = $row->annotation_id;
                $annotation->shape_id = $row->shape_id;
                $annotation->shape_name = $row->shape_name;
                $annotation->label_ids = [$row->label_id];
                $annotation->label_names = [$row->label_name];
                $annotation->image_id = $row->image_id;
                $annotation->image_filename = $this->images[$row->image_id]->filename;

                $this->setSize($annotation, $row);

                $annotations[$row->annotation_id] = $annotation;
            }
        }

        return $annotations;
    }

    /**
     * Calculate the pixel/sqm size and dimensions for an annotation.
     *
     * @param StdClass $annotation The annotation object to set the size of.
     * @param StdClass $row        Object containing information on the annotation from
     *                             the DB.
     */
    protected function setSize($annotation, $row)
    {
        $points = json_decode($row->points);

        // If we can't compute the dimensions or area, leave them blank.
        $annotation->width_px = '';
        $annotation->height_px = '';
        $annotation->area_sqpx = '';
        $annotation->width_m = '';
        $annotation->height_m = '';
        $annotation->area_sqm = '';

        switch ($annotation->shape_id) {
            case Shape::$circleId:
                // width and height are the diameter
                $annotation->width_px = 2 * $points[2];
                $annotation->height_px = $annotation->width_px;
                $annotation->area_sqpx = pow($points[2], 2) * M_PI;
                break;

            case Shape::$rectangleId:
                // A --- B
                // |     |
                // D --- C
                //
                // dim1 is the distance from A to B, dim2 from B to C

                $dim1 = sqrt(pow($points[0] - $points[2], 2) + pow($points[1] - $points[3], 2));
                $dim2 = sqrt(pow($points[2] - $points[4], 2) + pow($points[3] - $points[5], 2));
                $annotation->width_px = max($dim1, $dim2);
                $annotation->height_px = min($dim1, $dim2);
                $annotation->area_sqpx = $dim1 * $dim2;
                break;

            case Shape::$polygonId:
                // See: http://www.mathopenref.com/coordpolygonarea.html and
                // http://www.mathopenref.com/coordpolygonarea2.html
                // For a description of the polygon area algorithm.
                $min = [INF, INF];
                $max = [-INF, -INF];
                $area = 0;
                $count = count($points);
                // The last vertex is the 'previous' one to the first.
                // -1 to get the last element and -1 to get the x coordinate.
                $j = $count - 2;

                for ($i = 0; $i < $count; $i += 2) {
                    $area += ($points[$j] + $points[$i]) * ($points[$j + 1] - $points[$i + 1]);
                    // $j is the previous vertex to $i
                    $j = $i;

                    // Find the minimal and maximal coordinates, too.
                    $min[0] = min($min[0], $points[$i]);
                    $min[1] = min($min[1], $points[$i + 1]);
                    $max[0] = max($max[0], $points[$i]);
                    $max[1] = max($max[1], $points[$i + 1]);
                }

                $annotation->width_px = $max[0] - $min[0];
                $annotation->height_px = $max[1] - $min[1];
                $annotation->area_sqpx = abs($area / 2);
                break;

            default:
                // We can't compute the area for this shape.
                return;
        }

        // If the laserpoint detection module exists and the laserpoint detection was
        // performed for the image of the annotation, compute the dimensions and area
        // in m (m²) as well.
        if (class_exists(LImage::class)) {
            $image = $this->images[$row->image_id];

            // Cache the area and number of pixels in the original image object so we
            // don't have to convert the object and fetch the values again for each
            // annotation.
            if (!property_exists($image, 'area') || !property_exists($image, 'px')) {
                $laserpointsImage = LImage::convert($image);
                $image->area = $laserpointsImage->area;
                $image->px = $laserpointsImage->px;
            }

            $imageArea = $image->area;
            $imagePx = $image->px;

            if (!is_null($imageArea) && !is_null($imagePx)) {
                // If we assume a pixel is a little square then this is the area of a
                // single pixel.
                $area = $imageArea / $imagePx;
                // And this is the width/height of a single pixel.
                $widthHeight = sqrt($area);

                $annotation->width_m = $widthHeight * $annotation->width_px;
                $annotation->height_m = $widthHeight * $annotation->height_px;
                $annotation->area_sqm = $area * $annotation->area_sqpx;
            }
        }
    }
}
