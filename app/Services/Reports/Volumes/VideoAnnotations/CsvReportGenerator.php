<?php

namespace Biigle\Services\Reports\Volumes\VideoAnnotations;

use Biigle\Label;
use Biigle\LabelTree;
use Biigle\Services\Reports\CsvFile;
use Biigle\Services\Reports\MakesZipArchives;
use Biigle\Services\Reports\Volumes\VolumeReportGenerator;
use Biigle\Traits\RestrictsToNewestLabels;
use Biigle\User;
use DB;
use Illuminate\Support\Str;

class CsvReportGenerator extends VolumeReportGenerator
{
    use MakesZipArchives, RestrictsToNewestLabels;

    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    public $name = 'CSV video annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename = 'csv_video_annotation_report';

    /**
     * File extension of the report file.
     *
     * @var string
     */
    public $extension = 'zip';

    /**
     * Get the report name.
     *
     * @return string
     */
    public function getName()
    {
        $restrictions = [];

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
     * Generate the report.
     *
     * @param string $path Path to the report file that should be generated
     */
    public function generateReport($path)
    {
        $exists = $this->initQuery()->exists();
        $toZip = [];

        if ($this->shouldSeparateLabelTrees() && $exists) {
            $treeIds = $this->initQuery()
                ->select('labels.label_tree_id')
                ->distinct()
                ->pluck('label_tree_id');
            $trees = LabelTree::whereIn('id', $treeIds)->pluck('name', 'id');

            foreach ($trees as $id => $name) {
                $csv = $this->createCsv($this->query()->where('labels.label_tree_id', $id));
                $this->tmpFiles[] = $csv;
                $toZip[$csv->getPath()] = $this->sanitizeFilename("{$id}-{$name}", 'csv');
            }
        } elseif ($this->shouldSeparateUsers() && $exists) {
            $userIds = $this->initQuery()
                ->select('user_id')
                ->distinct()
                ->pluck('user_id');

            $users = User::whereIn('id', $userIds)
                ->selectRaw("id, concat(firstname, ' ', lastname) as name")
                ->pluck('name', 'id');

            foreach ($users as $id => $name) {
                $csv = $this->createCsv($this->query()->where('user_id', $id));
                $this->tmpFiles[] = $csv;
                $toZip[$csv->getPath()] = $this->sanitizeFilename("{$id}-{$name}", 'csv');
            }
        } else {
            $csv = $this->createCsv($this->query());
            $this->tmpFiles[] = $csv;
            $toZip[$csv->getPath()] = $this->sanitizeFilename("{$this->source->id}-{$this->source->name}", 'csv');
        }

        $this->makeZip($toZip, $path);
    }

    /**
     * Assembles the part of the DB query that is the same for all annotation reports.
     *
     * @param mixed $columns The columns to select
     * @return \Illuminate\Database\Query\Builder
     */
    public function initQuery($columns = [])
    {
        $query = DB::table('video_annotation_labels')
            ->join('video_annotations', 'video_annotation_labels.annotation_id', '=', 'video_annotations.id')
            ->join('videos', 'video_annotations.video_id', '=', 'videos.id')
            ->join('labels', 'video_annotation_labels.label_id', '=', 'labels.id')
            ->where('videos.volume_id', $this->source->id)
            ->when($this->isRestrictedToAnnotationSession(), [$this, 'restrictToAnnotationSessionQuery'])
            ->when($this->isRestrictedToNewestLabel(), function ($query) {
                return $this->restrictToNewestLabelQuery($query, $this->source);
            })
            ->when($this->isRestrictedToLabels(), function ($query) {
                return $this->restrictToLabelsQuery($query, 'video_annotation_labels');
            })
            ->select($columns);

        if ($this->shouldSeparateLabelTrees()) {
            $query->addSelect('labels.label_tree_id');
        } elseif ($this->shouldSeparateUsers()) {
            $query->addSelect('video_annotation_labels.user_id');
        }

        return $query;
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
            $query->where('video_annotations.created_at', '>=', $session->starts_at)
                ->where('video_annotations.created_at', '<', $session->ends_at)
                // ...and to the users of the session
                ->whereIn('video_annotation_labels.user_id', function ($query) use ($session) {
                    $query->select('user_id')
                        ->from('annotation_session_user')
                        ->where('annotation_session_id', $session->id);
                });
        });
    }

    /**
     * Assemble a new DB query for the video of this report.
     *
     * @return \Illuminate\Database\Query\Builder
     */
    protected function query()
    {
        $query = $this->initQuery([
                'video_annotation_labels.id as video_annotation_label_id',
                'video_annotation_labels.label_id',
                'labels.name as label_name',
                'users.id as user_id',
                'users.firstname',
                'users.lastname',
                'videos.id as video_id',
                'videos.filename as video_filename',
                'videos.attrs',
                'shapes.id as shape_id',
                'shapes.name as shape_name',
                'video_annotations.points',
                'video_annotations.frames',
                'video_annotations.id as annotation_id',
                'video_annotation_labels.created_at',
            ])
            ->join('shapes', 'video_annotations.shape_id', '=', 'shapes.id')
            ->leftJoin('users', 'video_annotation_labels.user_id', '=', 'users.id')
            ->orderBy('video_annotation_labels.id');

        return $query;
    }

    /**
     * Create a CSV file for this report.
     *
     * @param \Illuminate\Database\QueryBuilder $query The query for the CSV rows
     * @return CsvFile
     */
    protected function createCsv($query)
    {
        $csv = CsvFile::makeTmp();
        // column headers
        $csv->put([
            'video_annotation_label_id',
            'label_id',
            'label_name',
            'label_hierarchy',
            'user_id',
            'firstname',
            'lastname',
            'video_id',
            'video_filename',
            'shape_id',
            'shape_name',
            'points',
            'frames',
            'annotation_id',
            'created_at',
            'attributes',
        ]);

        $query->eachById(function ($row) use ($csv) {
            $csv->put([
                $row->video_annotation_label_id,
                $row->label_id,
                $row->label_name,
                $this->expandLabelName($row->label_id),
                $row->user_id,
                $row->firstname,
                $row->lastname,
                $row->video_id,
                $row->video_filename,
                $row->shape_id,
                $row->shape_name,
                $row->points,
                $row->frames,
                $row->annotation_id,
                $row->created_at,
                $row->attrs,
            ]);
        }, column: 'video_annotation_labels.id', alias: 'video_annotation_label_id');

        $csv->close();

        return $csv;
    }
}
