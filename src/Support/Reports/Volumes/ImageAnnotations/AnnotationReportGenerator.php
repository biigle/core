<?php

namespace Biigle\Modules\Reports\Support\Reports\Volumes\ImageAnnotations;

use Biigle\Modules\Reports\Support\Reports\Volumes\VolumeReportGenerator;
use Biigle\Modules\Reports\Traits\RestrictsToExportArea;
use Biigle\Modules\Reports\Traits\RestrictsToNewestLabels;
use DB;
use Illuminate\Support\Str;

class AnnotationReportGenerator extends VolumeReportGenerator
{
    use RestrictsToExportArea, RestrictsToNewestLabels;

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
     * Callback to be used in a `when` query statement that restricts the resulting annotation labels to the annotation session of this report.
     *
     * @param \Illuminate\Database\Query\Builder $query
     * @return \Illuminate\Database\Query\Builder
     */
    public function restrictToAnnotationSessionQuery($query)
    {
        $session = $this->getAnnotationSession();

        return $query->where(function ($query) use ($session) {
            // take only annotations that belong to the time span...
            $query->where('image_annotations.created_at', '>=', $session->starts_at)
                ->where('image_annotations.created_at', '<', $session->ends_at)
                // ...and to the users of the session
                ->whereIn('image_annotation_labels.user_id', function ($query) use ($session) {
                    $query->select('user_id')
                        ->from('annotation_session_user')
                        ->where('annotation_session_id', $session->id);
                });
        });
    }

    /**
     * Assembles the part of the DB query that is the same for all annotation reports.
     *
     * @param mixed $columns The columns to select
     * @return \Illuminate\Database\Query\Builder
     */
    public function initQuery($columns = [])
    {
        $query = DB::table('image_annotation_labels')
            ->join('image_annotations', 'image_annotation_labels.annotation_id', '=', 'image_annotations.id')
            ->join('images', 'image_annotations.image_id', '=', 'images.id')
            ->join('labels', 'image_annotation_labels.label_id', '=', 'labels.id')
            ->where('images.volume_id', $this->source->id)
            ->when($this->isRestrictedToExportArea(), [$this, 'restrictToExportAreaQuery'])
            ->when($this->isRestrictedToAnnotationSession(), [$this, 'restrictToAnnotationSessionQuery'])
            ->when($this->isRestrictedToNewestLabel(), function ($query) {
                return $this->restrictToNewestLabelQuery($query, $this->source);
            })
            ->when($this->isRestrictedToLabels(), function ($query) {
                return $this->restrictToLabelsQuery($query, 'image_annotation_labels');
            })
            ->select($columns);

        if ($this->shouldSeparateLabelTrees()) {
            $query->addSelect('labels.label_tree_id');
        } elseif ($this->shouldSeparateUsers()) {
            $query->addSelect('image_annotation_labels.user_id');
        }

        return $query;
    }

    /**
     * Determines if this report should aggregate child labels.
     *
     * @return bool
     */
    protected function shouldAggregateChildLabels()
    {
        return $this->options->get('aggregateChildLabels', false);
    }
}
