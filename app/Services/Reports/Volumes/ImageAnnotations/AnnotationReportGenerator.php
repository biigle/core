<?php

namespace Biigle\Services\Reports\Volumes\ImageAnnotations;

use DB;
use Biigle\Image;
use Illuminate\Support\Str;
use Biigle\Traits\RestrictsToExportArea;
use Biigle\Traits\RestrictsToNewestLabels;
use Biigle\Services\Reports\Volumes\VolumeReportGenerator;

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
        $query = $this->getImageAnnotationLabelQuery()
            ->where('images.volume_id', $this->source->id)
            ->when($this->isRestrictedToExportArea(), [$this, 'restrictToExportAreaQuery'])
            ->when($this->isRestrictedToAnnotationSession(), [$this, 'restrictToAnnotationSessionQuery'])
            ->when($this->isRestrictedToNewestLabel(), fn ($query) => $this->restrictToNewestLabelQuery($query, $this->source))
            ->when($this->isRestrictedToLabels(), fn ($query) => $this->restrictToLabelsQuery($query, 'image_annotation_labels'))
            ->when($this->shouldUseAllImages(), fn($q) => $q->orWhereNull('labels.id'))
            ->select($columns);

        if ($this->shouldSeparateLabelTrees()) {
            $query->addSelect('labels.label_tree_id');
        } elseif ($this->shouldSeparateUsers()) {
            $query->addSelect('image_annotation_labels.user_id');
        }

        return $query;
    }

    /**
     * Query that joins images, annotations and annotation labels
     *
     * @return \Illuminate\Database\Query\Builder|Image
     */
    protected function getImageAnnotationLabelQuery()
    {
        if ($this->shouldUseAllImages()) {
            // Use leftJoin to collect images without annotations too
            return Image::leftJoin('image_annotations', 'images.id', '=', 'image_annotations.image_id')
                ->leftJoin('image_annotation_labels', 'image_annotations.id', '=', 'image_annotation_labels.annotation_id')
                ->leftJoin('labels', 'image_annotation_labels.label_id', '=', 'labels.id');
        }

        return DB::table('image_annotation_labels')
            ->join('image_annotations', 'image_annotation_labels.annotation_id', '=', 'image_annotations.id')
            ->join('images', 'image_annotations.image_id', '=', 'images.id')
            ->join('labels', 'image_annotation_labels.label_id', '=', 'labels.id');
    }

    protected function shouldUseAllImages()
    {
        return get_called_class() === AbundanceReportGenerator::class;
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
