<?php

namespace Biigle\Traits;

use DB;

trait RestrictsToExportArea
{
    /**
     * Callback to be used in a `when` query statement that restricts the resulting annotations to the export area of the reansect of this report (if there is any).
     *
     * @param \Illuminate\Database\Query\Builder $query
     * @return \Illuminate\Database\Query\Builder
     */
    public function restrictToExportAreaQuery($query)
    {
        return $query->whereNotIn('image_annotations.id', $this->getSkipIds());
    }

    /**
     * Should this report be restricted to the export area?
     *
     * @return bool
     */
    protected function isRestrictedToExportArea()
    {
        return $this->options->get('exportArea', false);
    }

    /**
     * Returns the annotation IDs to skip as outside of the volume export area.
     *
     * We collect the IDs to skip rather than the IDs to include since there are probably
     * fewer annotations outside of the export area.
     *
     * @return array Annotation IDs
     */
    protected function getSkipIds()
    {
        $skip = [];
        $exportArea = $this->source->exportArea;

        if (!$exportArea) {
            // take all annotations if no export area is specified
            return $skip;
        }

        $exportArea = [
            // min x
            min($exportArea[0], $exportArea[2]),
            // min y
            min($exportArea[1], $exportArea[3]),
            // max x
            max($exportArea[0], $exportArea[2]),
            // max y
            max($exportArea[1], $exportArea[3]),
        ];

        $processAnnotation = function ($annotation) use ($exportArea, &$skip) {
            $points = json_decode($annotation->points);
            $size = sizeof($points);
            // Works for circles with 3 elements in $points, too!
            for ($x = 0, $y = 1; $y < $size; $x += 2, $y += 2) {
                if ($points[$x] >= $exportArea[0] &&
                    $points[$x] <= $exportArea[2] &&
                    $points[$y] >= $exportArea[1] &&
                    $points[$y] <= $exportArea[3]) {
                    // As long as one point of the annotation is inside the
                    // area, don't skip it.
                    return;
                }
            }

            $skip[] = $annotation->id;
        };

        DB::table('image_annotations')
            ->join('images', 'image_annotations.image_id', '=', 'images.id')
            ->where('images.volume_id', $this->source->id)
            ->select('image_annotations.id as id', 'image_annotations.points')
            ->eachById($processAnnotation, 500, 'image_annotations.id', 'id');

        return $skip;
    }
}
