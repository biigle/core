<?php

namespace Dias\Modules\Export\Support\Reports\Transects\Annotations;

use DB;
use Dias\Modules\Export\Transect;
use Dias\Modules\Export\Support\Reports\Transects\Report as BaseReport;

class Report extends BaseReport
{
    /**
     * Get the report name
     *
     * @return string
     */
    public function getName()
    {
        if ($this->isRestricted()) {
            return "{$this->name} (restricted to export area)";
        }

        return $this->name;
    }

    /**
     * Get the filename
     *
     * @return string
     */
    public function getFilename()
    {
        if ($this->isRestricted()) {
            return "{$this->filename}_restricted";
        }

        return $this->filename;
    }

    /**
     * Returns the annotation IDs to skip as outside of the transect export area
     *
     * We collect the IDs to skip rather than the IDs to include since there are probably
     * fewer annotations outside of the export area.
     *
     * @return array Annotation IDs
     */
    public function getSkipIds()
    {
        $skip = [];
        $exportArea = Transect::convert($this->transect)->exportArea;

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

        $handleChunk = function ($annotations) use ($exportArea, &$skip) {
            foreach ($annotations as $annotation) {
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
                            continue 2;
                    }
                }

                $skip[] = $annotation->id;
            }
        };

        DB::table('annotations')
            ->join('images', 'annotations.image_id', '=', 'images.id')
            ->where('images.transect_id', $this->transect->id)
            ->select('annotations.id as id', 'annotations.points')
            ->chunkById(500, $handleChunk, 'annotations.id', 'id');

        return $skip;
    }

    /**
     * Should this report be restricted to the export area?
     *
     * @return boolean
     */
    protected function isRestricted()
    {
        return $this->options->get('exportArea', false);
    }
}
