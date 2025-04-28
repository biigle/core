<?php

namespace Biigle\Services\Reports\Volumes\ImageAnnotations;

use Biigle\Image;
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
        $rows = $this->query()->get();

        if ($this->shouldSeparateLabelTrees() && $rows->isNotEmpty()) {
            $rows = $rows->groupBy('label_tree_id');
            $allLabels = null;
            if ($this->shouldUseAllLabels()) {
                $allLabels = $this->getVolumeLabels();
                $treeIds = $allLabels->pluck('label_tree_id');
                $trees = LabelTree::whereIn('id', $treeIds)->pluck('name', 'id');
                $allLabels = $allLabels->groupBy('label_tree_id');
            } else {
                $treeIds = $rows->keys()->reject(fn ($k) => !$k);
                $trees = LabelTree::whereIn('id', $treeIds)->pluck('name', 'id');
            }

            foreach ($trees as $id => $name) {
                if ($this->shouldUseAllLabels()) {
                    $labels = $allLabels->get($id);
                } else {
                    $labelIds = $rows->get($id)->pluck('label_id')->unique();
                    $labels = Label::whereIn('id', $labelIds)->get();
                }
                $this->tmpFiles[] = $this->createCsv($rows->flatten(), $name, $labels);
            }
        } elseif ($this->shouldSeparateUsers() && $rows->isNotEmpty()) {
            $allFilenames = $rows->pluck('filename')->unique();
            $rows = $rows->groupBy('user_id');
            $userIds = $rows->keys()->reject(fn ($k) => !$k);
            $users = User::whereIn('id', $userIds)
                ->selectRaw("id, concat(firstname, ' ', lastname) as name")
                ->pluck('name', 'id');
            $labels = null;
            if ($this->shouldUseAllLabels()) {
                $labels = $this->getVolumeLabels();
            }

            foreach ($users as $id => $name) {
                $rowGroup = $rows->get($id);
                if (!$this->shouldUseAllLabels()) {
                    $labels = Label::whereIn('id', $rowGroup->pluck('label_id'))->get();
                }
                $userFilenames = $rowGroup->pluck('filename')->unique();
                $missingFiles = $allFilenames->diff($userFilenames);
                // Include empty images again, as they were removed during grouping
                foreach ($missingFiles as $f) {
                    $rowGroup->add((object) [
                        'filename' => $f,
                        'count' => 0,
                        'label_id' => null,
                        'user_id' => $id
                    ]);
                }
                $this->tmpFiles[] = $this->createCsv($rowGroup, $name, $labels);
            }
        } else {
            $allLabelIds = $rows->pluck('label_id')->reject(fn ($k) => !$k);
            $labels = $this->shouldUseAllLabels() ? $this->getVolumeLabels() : Label::whereIn('id', $allLabelIds)->get();
            $this->tmpFiles[] = $this->createCsv($rows, $this->source->name, $labels);
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
            ->select(DB::raw('images.filename, image_annotation_labels.label_id, count(image_annotation_labels.label_id) as count'))
            ->groupBy('image_annotation_labels.label_id', 'images.id');

        if ($this->shouldSeparateLabelTrees()) {
            $query->addSelect('labels.label_tree_id')
                ->groupBy('image_annotation_labels.label_id', 'images.id', 'labels.label_tree_id');
        } elseif ($this->shouldSeparateUsers()) {
            $query->addSelect('image_annotation_labels.user_id')
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
            ->when($this->isRestrictedToNewestLabel(), fn ($query) => $this->restrictToNewestLabelQuery($query, $this->source, true))
            ->addSelect($columns);

        if ($this->shouldSeparateLabelTrees()) {
            $query->addSelect('labels.label_tree_id');
        } elseif ($this->shouldSeparateUsers()) {
            $query->addSelect('image_annotation_labels.user_id');
        }

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
        if ($this->isRestrictedToAnnotationSession() || $this->isRestrictedToLabels() || $this->isRestrictedToExportArea()) {
            return Label::join('image_annotation_labels', function ($join) {
                // Use advanced joins to set labels and annotations on null if not present or not selected
                $join->on('labels.id', '=', 'image_annotation_labels.label_id')
                    ->when($this->isRestrictedToLabels(), fn ($q) => $this->restrictToLabelsQuery($q, 'image_annotation_labels'));
            })
                ->join('image_annotations', function ($join) {
                    $join->on('image_annotation_labels.annotation_id', '=', 'image_annotations.id')
                        ->when($this->isRestrictedToAnnotationSession(), [$this, 'restrictToAnnotationSessionQuery'])
                        ->when($this->isRestrictedToExportArea(), [$this, 'restrictToExportAreaQuery']);
                })
                ->rightJoin('images', 'image_annotations.image_id', '=', 'images.id')
                ->distinct();
        }

        return Label::join('image_annotation_labels', 'labels.id', '=', 'image_annotation_labels.label_id')
            ->join('image_annotations', 'image_annotation_labels.annotation_id', '=', 'image_annotations.id')
            ->rightJoin('images', 'image_annotations.image_id', '=', 'images.id');
    }

    /**
     * Create a CSV file for a single sheet of the spreadsheet of this report.
     *
     * @param \Illuminate\Support\Collection $rows The rows for the CSV
     * @param string $title The title to put in the first row of the CSV
     * @param \Illuminate\Support\Collection $labels
     *
     * @return CsvFile
     */
    protected function createCsv($rows, $title, $labels)
    {
        $rows = $rows
            ->groupBy('filename')
            ->sortBy(fn ($annotation, $file) => $file, SORT_NATURAL);

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
        $originalLabels = $labels;
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
        $usedParentLabels = $labels->filter(fn ($label) => $presentLabels->has($label->id));

        // All labels are also used here, but because the option was not explicitly set, it doesn't enforce to show all labels.
        if ($this->shouldSeparateUsers()) {
            // Get unused (empty) labels
            $emptyLabels = $originalLabels
                ->filter(fn ($labels) => !$labels->isUsed())
                ->when($this->isRestrictedToLabels(), fn ($labels) =>
                    $labels->whereIn('id', $this->getOnlyLabels()));

            // Aggregate empty child labels
            $emptyLabels = $emptyLabels->filter(fn ($label) => $emptyLabels->where('id', $label->parent_id)->isEmpty());
            $labels = $usedParentLabels->merge($emptyLabels);
        } else {
            $labels = $usedParentLabels;
        }

        return [$rows, $labels];
    }
}
