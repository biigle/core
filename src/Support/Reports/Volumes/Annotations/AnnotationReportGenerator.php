<?php

namespace Biigle\Modules\Reports\Support\Reports\Volumes\Annotations;

use DB;
use Illuminate\Support\Str;
use Biigle\AnnotationSession;
use Biigle\Modules\Reports\Volume;
use Biigle\Modules\Reports\Support\Reports\Volumes\VolumeReportGenerator;

class AnnotationReportGenerator extends VolumeReportGenerator
{
    /**
     * Cache for the annotation session the report may be restricted to.
     *
     * @var Biigle\AnnotationSession
     */
    protected $annotationSession;

    /**
     * Get the report name.
     *
     * @return string
     */
    public function getName()
    {
        $restrictions = [];

        if ($this->isRestrictedToExportArea()) {
            $restrictions[] = 'export area';
        }

        if ($this->isRestrictedToAnnotationSession()) {
            $name = $this->getAnnotationSessionName();
            $restrictions[] = "annotation session {$name}";
        }

        if ($this->isRestrictedToNewestLabel()) {
            $restrictions[] = 'newest label of each annotation';
        }

        if (!empty($restrictions)) {
            $suffix = implode(', ', $restrictions);

            return "{$this->name} (restricted to {$suffix})";
        }

        return $this->name;
    }

    /**
     * Get the filename.
     *
     * @return string
     */
    public function getFilename()
    {
        $restrictions = [];

        if ($this->isRestrictedToExportArea()) {
            $restrictions[] = 'export_area';
        }

        if ($this->isRestrictedToAnnotationSession()) {
            $name = Str::slug($this->getAnnotationSessionName());
            $restrictions[] = "annotation_session_{$name}";
        }

        if ($this->isRestrictedToNewestLabel()) {
            $restrictions[] = 'newest_label';
        }

        if (!empty($restrictions)) {
            $suffix = implode('_', $restrictions);

            return "{$this->filename}_restricted_to_{$suffix}";
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
     * Callback to be used in a `when` query statement that restricts the results to the newest annotation labels of each annotation.
     *
     * @param \Illuminate\Database\Query\Builder $query
     * @return \Illuminate\Database\Query\Builder
     */
    public function restrictToNewestLabelQuery($query)
    {
        // This is a quite inefficient query. Here is why:
        // We could use "select distinct on" directly on the query but this would be
        // overridden by the subsequent select() in self::initQuery(). If we would add
        // the "select distinct on" **after** the select(), we would get invalid syntax:
        // "select *, distinct on".
        return $query->whereIn('annotation_labels.id', function ($query) {
            return $query->selectRaw('distinct on (annotation_id) id')
                ->from('annotation_labels')
                ->orderBy('annotation_id', 'desc')
                ->orderBy('id', 'desc')
                ->orderBy('created_at', 'desc');
        });
    }

    /**
     * Get the name of the annotation session if it exists.
     *
     * @return string
     */
    protected function getAnnotationSessionName()
    {
        $session = $this->getAnnotationSession();

        return $session ? $session->name : $this->options->get('annotationSession', '');
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
        $exportArea = Volume::convert($this->source)->exportArea;

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
            ->where('images.volume_id', $this->source->id)
            ->select('annotations.id as id', 'annotations.points')
            ->chunkById(500, $handleChunk, 'annotations.id', 'id');

        return $skip;
    }

    /**
     * Assembles the part of the DB query that is the same for all annotation reports.
     *
     * @param mixed $columns The columns to select
     * @return \Illuminate\Database\Query\Builder
     */
    protected function initQuery($columns = [])
    {
        $query = DB::table('annotation_labels')
            ->join('annotations', 'annotation_labels.annotation_id', '=', 'annotations.id')
            ->join('images', 'annotations.image_id', '=', 'images.id')
            ->join('labels', 'annotation_labels.label_id', '=', 'labels.id')
            ->where('images.volume_id', $this->source->id)
            ->when($this->isRestrictedToExportArea(), [$this, 'restrictToExportAreaQuery'])
            ->when($this->isRestrictedToAnnotationSession(), [$this, 'restrictToAnnotationSessionQuery'])
            ->when($this->isRestrictedToNewestLabel(), [$this, 'restrictToNewestLabelQuery'])
            ->select($columns);

        if ($this->shouldSeparateLabelTrees()) {
            $query->addSelect('labels.label_tree_id');
        }

        return $query;
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
     * Should this report be restricted an annotation session?
     *
     * @return bool
     */
    protected function isRestrictedToAnnotationSession()
    {
        return !is_null($this->options->get('annotationSession', null));
    }

    /**
     * Returns the annotation session this report should be restricted to.
     *
     * @return AnnotationSession|null
     */
    protected function getAnnotationSession()
    {
        if (!$this->annotationSession) {
            $this->annotationSession = AnnotationSession::find($this->options->get('annotationSession', null));
        }

        return $this->annotationSession;
    }

    /**
     * Determines if this report should take only the newest label of each annotation.
     *
     * @return bool
     */
    protected function isRestrictedToNewestLabel()
    {
        return $this->options->get('newestLabel', false);
    }
}
