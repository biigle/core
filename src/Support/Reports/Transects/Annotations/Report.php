<?php

namespace Dias\Modules\Export\Support\Reports\Transects\Annotations;

use DB;
use Illuminate\Support\Str;
use Dias\Modules\Export\Transect;
use Dias\Modules\Export\Support\Reports\Transects\Report as BaseReport;

class Report extends BaseReport
{
    /**
     * Cache for the annotation session this report may be restricted to
     *
     * @var Dias\AnnotationSession
     */
    protected $annotationSession;

    /**
     * Get the report name
     *
     * @return string
     */
    public function getName()
    {
        if ($this->isRestrictedToExportArea() && $this->isRestrictedToAnnotationSession()) {
            $name = $this->getAnnotationSession()->name;
            return "{$this->name} (restricted to export area and annotation session {$name})";
        } else if ($this->isRestrictedToExportArea()) {
            return "{$this->name} (restricted to export area)";
        } else if ($this->isRestrictedToAnnotationSession()) {
            $name = $this->getAnnotationSession()->name;
            return "{$this->name} (restricted to annotation session {$name})";
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
        if ($this->hasRestriction()) {
            $suffix = '_restricted_to';

            if ($this->isRestrictedToExportArea()) {
                $suffix .= "_export_area";
            }

            if ($this->isRestrictedToAnnotationSession()) {
                $name = Str::slug($this->getAnnotationSession()->name);
                $suffix .= "_annotation_session_{$name}";
            }

            return "{$this->filename}{$suffix}";
        }

        return $this->filename;
    }

    /**
     * Callback to be used in a `when` query statement that restricts the resulting annotations to the export area of the reansect of this report (if there is any).
     *
     * @param \Illuminate\Database\Query\Builder $query
     * @return \Illuminate\Database\Query\Builder
     */
    public function restrictToExportAreaQuery($query)
    {
        return $query->whereNotIn('annotations.id', $this->getSkipIds());
    }

    /**
     * Callback to be used in a `when` query statement that restricts the resulting annotation labels to the annotation session of this report.
     *
     * @param \Illuminate\Database\Query\Builder $query
     * @return \Illuminate\Database\Query\Builder
     */
    public function restrictToAnnotationSessionQuery($query)
    {
        $session = $this->getAnnotationSession();
        return $query->where(function ($query) use ($session) {
            // take only annotation labels that belong to the time span...
            $query->where('annotation_labels.created_at', '>=', $session->starts_at)
                ->where('annotation_labels.created_at', '<', $session->ends_at)
                // ...and to the users of the session
                ->whereIn('annotation_labels.user_id', function ($query) use ($session) {
                    $query->select('user_id')
                        ->from('annotation_session_user')
                        ->where('annotation_session_id', $session->id);
                });
        });

    }

    /**
     * Returns the annotation IDs to skip as outside of the transect export area
     *
     * We collect the IDs to skip rather than the IDs to include since there are probably
     * fewer annotations outside of the export area.
     *
     * @return array Annotation IDs
     */
    protected function getSkipIds()
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
     * Assembles the part of the DB query that is the same for all annotation reports
     *
     * @param mixed $columns The columns to select
     * @return \Illuminate\Database\Query\Builder
     */
    protected function initQuery($columns = [])
    {
        $query = DB::table('annotation_labels')
            ->join('annotations', 'annotation_labels.annotation_id', '=', 'annotations.id')
            ->join('images', 'annotations.image_id', '=', 'images.id')
            ->where('images.transect_id', $this->transect->id)
            ->when($this->isRestrictedToExportArea(), [$this, 'restrictToExportAreaQuery'])
            ->when($this->isRestrictedToAnnotationSession(), [$this, 'restrictToAnnotationSessionQuery'])
            ->select($columns);

        if ($this->shouldSeparateLabelTrees()) {
            $query->join('labels', 'annotation_labels.label_id', '=', 'labels.id')
                ->addSelect('labels.label_tree_id');
        }

        return $query;
    }

    /**
     * Is this report restricted in any way?
     *
     * @return boolean
     */
    protected function hasRestriction()
    {
        return $this->isRestrictedToExportArea() || $this->isRestrictedToAnnotationSession();
    }

    /**
     * Should this report be restricted to the export area?
     *
     * @return boolean
     */
    protected function isRestrictedToExportArea()
    {
        return $this->options->get('exportArea', false);
    }

    /**
     * Should this report be restricted an annotation session?
     *
     * @return boolean
     */
    protected function isRestrictedToAnnotationSession()
    {
        return !is_null($this->options->get('annotationSession', null));
    }

    /**
     * Returns the annotation session this report should be restricted to
     *
     * @return Dias\AnnotationSession|null
     */
    protected function getAnnotationSession()
    {
        if (!$this->annotationSession) {
            $this->annotationSession = $this->transect
                ->annotationSessions()
                ->find($this->options->get('annotationSession', null));
        }

        return $this->annotationSession;
    }
}
