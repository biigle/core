<?php

namespace Dias\Modules\Export\Support\Reports\Annotations;

use DB;
use Dias\Project;
use Dias\Modules\Export\Transect;
use Dias\Modules\Export\Support\Reports\Report;

class AnnotationReport extends Report
{
    /**
     * Specifies if the report is restricted to the export area
     *
     * @var bool
     */
    protected $restricted;

    /**
     * Create a report instance.
     *
     * @param Project $project The project for which the report should be generated.
     * @param bool $restricted Is the report restricted to the export area?
     */
    public function __construct(Project $project, $restricted)
    {
        parent::__construct($project);
        $this->restricted = $restricted;
    }

    /**
     * Get the report name
     *
     * @return string
     */
    public function getName()
    {
        if ($this->restricted) {
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
        if ($this->restricted) {
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
     * @param int $id Transect ID
     *
     * @return array Annotation IDs
     */
    protected function getSkipIds($id)
    {
        $skip = [];
        $exportArea = Transect::find($id)->exportArea;

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
            ->where('images.transect_id', $id)
            ->select('annotations.id as id', 'annotations.points')
            ->chunkById(500, $handleChunk, 'annotations.id', 'id');

        return $skip;
    }
}
