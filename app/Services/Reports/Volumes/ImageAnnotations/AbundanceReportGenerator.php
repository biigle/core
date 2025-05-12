<?php

namespace Biigle\Services\Reports\Volumes\ImageAnnotations;

use Biigle\Label;
use Biigle\LabelTree;
use Biigle\Services\Reports\CsvFile;
use Biigle\User;
use DB;

class AbundanceReportGenerator extends AnnotationReportGenerator
{
    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    public $name = 'abundance image annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename = 'abundance_image_annotation_report';

    /**
     * File extension of the report file.
     *
     * @var string
     */
    public $extension = 'xlsx';

    /**
     * Generate the report.
     *
     * @param string $path Path to the report file that should be generated
     */
    public function generateReport($path)
    {
        $query = $this->query();
        // Separate the annotated images from the empty ones, since only the annotated images could require additional processing.
        $annotatedImagesQuery = $query->clone()->whereNotNull('label_id')->get();
        if ($this->shouldSeparateLabelTrees()) {
            $annotatedImagesQuery = $annotatedImagesQuery->groupBy('label_tree_id');
            $allLabels = null;
            // Get query for images that have no annotations
            $emptyImagesQuery = $query->clone()->whereNull('label_id')->select('filename');

            if ($this->shouldUseAllLabels()) {
                $allLabels = $this->getVolumeLabels();
                $treeIds = $allLabels->pluck('label_tree_id');
                $trees = LabelTree::whereIn('id', $treeIds)->pluck('name', 'id');
                $allLabels = $allLabels->groupBy('label_tree_id');
            } else {
                $trees = LabelTree::whereIn('id', $annotatedImagesQuery->keys())->pluck('name', 'id');
            }

            foreach ($trees as $id => $name) {
                if ($this->shouldUseAllLabels()) {
                    $labels = $allLabels->get($id);
                } else {
                    $labelIds = $annotatedImagesQuery->get($id)->pluck('label_id')->unique();
                    $labels = Label::whereIn('id', $labelIds)->get();
                }
                $this->tmpFiles[] = $this->createCsv($annotatedImagesQuery->flatten(), $name, $labels, $emptyImagesQuery);
            }
        } elseif ($this->shouldSeparateUsers()) {
            $annotatedImagesQuery = $annotatedImagesQuery->groupBy('user_id');
            $users = User::whereIn('id', $annotatedImagesQuery->keys())
                ->selectRaw("id, concat(firstname, ' ', lastname) as name")
                ->pluck('name', 'id');
            $labels = null;

            if ($this->shouldUseAllLabels()) {
                $labels = $this->getVolumeLabels();
            }

            foreach ($users as $id => $name) {
                $usedImageIds = $annotatedImagesQuery->get($id)->pluck('image_id')->unique();
                $emptyImagesQuery = $this->source->images()->select('filename')->whereNotIn('id', $usedImageIds);
                $rowGroup = $annotatedImagesQuery->get($id);

                if (!$this->shouldUseAllLabels()) {
                    $labels = Label::whereIn('id', $rowGroup->pluck('label_id'))->get();
                }

                $this->tmpFiles[] = $this->createCsv($rowGroup, $name, $labels, $emptyImagesQuery);
            }
        } else {
            // Get query for images that have no annotations
            $emptyImagesQuery = $query->clone()->whereNull('label_id')->select('filename');
            $allLabelIds = $annotatedImagesQuery->pluck('label_id')->reject(fn ($k) => !$k);
            $labels = $this->shouldUseAllLabels() ? $this->getVolumeLabels() : Label::whereIn('id', $allLabelIds)->get();
            $this->tmpFiles[] = $this->createCsv($annotatedImagesQuery, $this->source->name, $labels, $emptyImagesQuery);
        }

        $this->executeScript('csvs_to_xlsx', $path);
    }

    /**
     * Assemble a new DB query for the volume of this report.
     *
     * @return \Illuminate\Database\Query\Builder
     */
    protected function query()
    {
        $query = $this->initQuery()
            ->orderBy('images.filename')
            ->selectRaw('images.filename, image_annotation_labels.label_id, count(image_annotation_labels.label_id) as count')
            ->groupBy('image_annotation_labels.label_id', 'images.id');

        if ($this->shouldSeparateLabelTrees()) {
            $query->addSelect('labels.label_tree_id')
                ->groupBy('image_annotation_labels.label_id', 'labels.label_tree_id');
        } elseif ($this->shouldSeparateUsers()) {
            $query->addSelect('image_annotation_labels.user_id')
                ->addSelect('images.id as image_id')
                ->groupBy('image_annotation_labels.label_id', 'images.id', 'image_annotation_labels.user_id');
        }

        return $query;
    }

    /**
     * Assembles the part of the DB query that is used for the abundance report.
     * Overrides AnnotationReportGenerator's initQuery() because it requires a special query
     * where images without (selected) annotation labels are kept after filtering.
     *
     * @param mixed $columns The columns to select
     * @return \Illuminate\Database\Query\Builder
     */
    public function initQuery($columns = [])
    {
        $query = $this->getImageAnnotationLabelQuery()
            ->where('images.volume_id', $this->source->id)
            // Add this label filter here, since it won’t delete any annotations
            ->when($this->isRestrictedToNewestLabel(), fn ($query) => $this->restrictToNewestLabelQuery($query, $this->source, true))
            ->addSelect($columns);

        return $query;
    }

    /**
     * Construct a join query for (filtered) images, image annotations, image annotation labels, and labels
     *
     * @return \Illuminate\Database\Eloquent\Builder|\Biigle\Label
     */
    protected function getImageAnnotationLabelQuery()
    {
        // Filter records here to keep images with no selected annotation labels or without any annotation labels
        return Label::join('image_annotation_labels', function ($join) {
            // Use advanced joins to set labels and annotations on null if not present or not selected
            $join->on('labels.id', '=', 'image_annotation_labels.label_id')
                ->when($this->isRestrictedToLabels(), fn($q) => $this->restrictToLabelsQuery($q, 'image_annotation_labels'));
        })
            ->join('image_annotations', function ($join) {
                $join->on('image_annotation_labels.annotation_id', '=', 'image_annotations.id')
                    ->when($this->isRestrictedToAnnotationSession(), [$this, 'restrictToAnnotationSessionQuery'])
                    ->when($this->isRestrictedToExportArea(), [$this, 'restrictToExportAreaQuery']);
            })
            ->rightJoin('images', 'image_annotations.image_id', '=', 'images.id')
            ->distinct();
    }

    /**
     * Create a CSV file for a single sheet of the spreadsheet of this report.
     *
     * @param \Illuminate\Support\Collection $rows The rows for the CSV
     * @param string $title The title to put in the first row of the CSV
     * @param \Illuminate\Support\Collection $labels
     * @param \Illuminate\Database\Query\Builder $emptyImagesQuery The query for images without annotations
     *
     * @return CsvFile
     */
    protected function createCsv($rows, $title, $labels, $emptyImagesQuery)
    {
        $rows = $rows->groupBy('filename');

        if ($this->shouldAggregateChildLabels()) {
            [$rows, $labels] = $this->aggregateChildLabels($rows, $labels);
        }

        $labels = $labels->sortBy('id');

        $csv = CsvFile::makeTmp();
        $csv->put($title);

        $columns = ['image_filename'];
        foreach ($labels as $label) {
            $columns[] = $label->name;
        }
        $csv->putCsv($columns);

        foreach ($rows as $filename => $annotations) {
            $row = [$filename];
            $annotations = $annotations->keyBy('label_id');
            foreach ($labels as $label) {
                if ($annotations->has($label->id)) {
                    $row[] = $annotations[$label->id]->count;
                } else {
                    $row[] = 0;
                }
            }

            $csv->putCsv($row);
        }

        $labelsCount = $labels->count();
        $emptyImagesQuery->orderBy('filename')->chunk(1000, function ($images) use ($labelsCount, $csv) {
            foreach ($images as $image) {
                $row = [$image->filename];
                for ($i = 0; $i < $labelsCount; $i++) {
                    $row[] = 0;
                }
                $csv->putCsv($row);
            }
        });

        $csv->close();

        return $csv;
    }

    /**
     * Aggregate the number of child labels to the number of the highest parent label
     * and remove the child labels from the list.
     *
     * @param \Illuminate\Support\Collection $rows
     * @param \Illuminate\Support\Collection $labels
     *
     * @return array
     */
    protected function aggregateChildLabels($rows, $labels)
    {
        // Add all possible labels because the parent to which the child labels should
        // be aggregated may not have "own" annotations. Unused labels are filtered
        // later.
        $addLabels = Label::whereIn('label_tree_id', $labels->pluck('label_tree_id')->unique())
            ->whereNotIn('id', $labels->pluck('id'))
            ->when($this->isRestrictedToLabels(), function ($query) {
                $query->whereIn('id', $this->getOnlyLabels());
            })
            ->get();

        $labels = $labels->concat($addLabels);

        $parentIdMap = $labels->pluck('parent_id', 'id')
            ->when($this->isRestrictedToLabels(), function ($labels) {
                $onlyLabels = $this->getOnlyLabels();

                return $labels->map(function ($value) use ($onlyLabels) {
                    // Act as if excluded parent labels do not exist.
                    return in_array($value, $onlyLabels) ? $value : null;
                });
            })
            ->reject(fn ($value) => is_null($value));

        // Determine the highest parent label for all child labels.
        do {
            $hoistedParentLabel = false;
            foreach ($parentIdMap as $id => $parentId) {
                if ($parentIdMap->has($parentId)) {
                    $parentIdMap[$id] = $parentIdMap[$parentId];
                    $hoistedParentLabel = true;
                }
            }
        } while ($hoistedParentLabel);

        $presentLabels = collect([]);

        foreach ($rows as $filename => $annotations) {
            // Aggregate the number of annotations of child labels to the number of their
            // parent.
            $annotations = $annotations->keyBy('label_id');
            foreach ($annotations as $labelId => $annotation) {
                $parentId = $parentIdMap->get($labelId);
                if ($parentId) {
                    $presentLabels->push($parentId);
                    if ($annotations->has($parentId)) {
                        $annotations[$parentId]->count += $annotation->count;
                    } else {
                        // Add a new entry for a parent label which has no "own"
                        // annotations.
                        $annotations[$parentId] = (object) [
                            'count' => $annotation->count,
                            'label_id' => $parentId,
                            'filename' => $filename,
                        ];
                    }
                } else {
                    $presentLabels->push($labelId);
                }
            }

            // Remove rows of child labels so they are not counted twice.
            $rows[$filename] = $annotations->values()
                ->reject(fn ($annotation) => $parentIdMap->has($annotation->label_id));
        }

        // Remove all labels that did not occur (as parent) in the rows.
        $presentLabels = $presentLabels->unique()->flip();
        $labels = $labels->filter(fn ($label) => $presentLabels->has($label->id));

        return [$rows, $labels];
    }
}
