<?php

namespace Biigle\Modules\Sync\Support\Import;

use Biigle\Label;
use Carbon\Carbon;
use Biigle\LabelTree;
use Biigle\Visibility;

class LabelTreeImport extends Import
{
    /**
     * Caches the decoded label tree import file.
     *
     * @var Illuminate\Support\Collection
     */
    protected $importLabelTrees;

    /**
     * Perform the import
     *
     * @param array|null $onlyTrees IDs of the label tree import candidates to limit the import to.
     * @param array|null $onlyLabels IDs of the label import candidates to limit the import to.
     * @param array $nameConflictResolution Array mapping label IDs to 'import' or 'existing' for how to resolve name conflicts.
     * @param array $parentConflictResolution Array mapping label IDs to 'import' or 'existing' for how to resolve parent conflicts.
     * @return array Array containing 'labelTrees', 'labels' and 'users', mapping external IDs (from the import file) to IDs of the database.
     */
    public function perform($onlyTrees = null, $onlyLabels = null, $nameConflictResolution = [], $parentConflictResolution = [])
    {
        // Do this first so it may fail before any trees or labels are created.
        $userIdMap = (new UserImport($this->path))->perform();

        $now = Carbon::now();

        $insertTrees = $this->getLabelTreeImportCandidates()
            ->map(function ($tree) use ($now) {
                return [
                    'name' => $tree['name'],
                    'description' => $tree['description'],
                    'uuid' => $tree['uuid'],
                    'visibility_id' => Visibility::$private->id,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            });

        LabelTree::insert($insertTrees->toArray());


        $labelTrees = $this->getImportLabelTrees()->keyBy('uuid');
        $existingTrees = LabelTree::whereIn('uuid', $labelTrees->keys())
            ->pluck('id', 'uuid');

        $labelTreeIdMap = [];
        foreach ($labelTrees as $tree) {
            if ($existingTrees->has($tree['uuid'])) {
                $labelTreeIdMap[$tree['id']] = $existingTrees[$tree['uuid']];
            }
        }

        //TODO insert all labels that belong to imported label trees and that should
        //be merged into existing label trees.
        // $insertLabels = $labelTrees->whereIn('uuid', $insertTrees->pluck('uuid'))
        //     ->pluck('labels')
        //     ->collapse()
        //     ->map(function ($label) {
        //         dd($label);
        //     });

        $labels = $labelTrees->pluck('labels')->collapse()->keyBy('uuid');

        $existingLabelIds = Label::whereIn('uuid', $labels->keys())
            ->pluck('id', 'uuid');

        $labelIdMap = [];
        foreach ($labels as $label) {
            if ($existingLabelIds->has($label['uuid'])) {
                $labelIdMap[$label['id']] = $existingLabelIds[$label['uuid']];
            }
        }

        return [
            'labelTrees' => $labelTreeIdMap,
            'labels' => $labelIdMap,
            'users' => $userIdMap,
        ];
    }

    /**
     * Get the contents of the label tree import file.
     *
     * @return \Illuminate\Support\Collection
     */
    public function getImportLabelTrees()
    {
        if (!$this->importLabelTrees) {
            $this->importLabelTrees = $this->collectJson('label_trees.json');
        }

        return $this->importLabelTrees;
    }

    /**
     * Get label trees that can be imported and don't already exist.
     *
     * @return \Illuminate\Support\Collection
     */
    public function getLabelTreeImportCandidates()
    {
        $trees = $this->getImportLabelTrees();
        $existing = LabelTree::whereIn('uuid', $trees->pluck('uuid'))->pluck('uuid');

        // Use values() to discard the original keys.
        return $trees->whereNotIn('uuid', $existing)->values();
    }

    /**
     * Get labels of existing label trees that can be imported.
     * If an import label exists but has a conflicting name or parent_id, it will get
     * the additional conflicting_name and/or conflicting_parent_id attributes.
     *
     * @return \Illuminate\Support\Collection
     */
    public function getLabelImportCandidates()
    {
        $trees = $this->getImportLabelTrees()->keyBy('id');
        $existingTrees = LabelTree::whereIn('uuid', $trees->pluck('uuid'))->pluck('uuid');

        // Get all import labels of existing label trees.
        $labels = $this->getImportLabelTrees()
            ->whereIn('uuid', $existingTrees)
            ->map(function ($tree) {
                return array_map(function ($label) use ($tree) {
                    $label['label_tree_name'] = $tree['name'];
                    return $label;
                }, $tree['labels']);
            })
            ->collapse()
            ->keyBy('id');

        // Add the parent_uuid property for import labels.
        $labels = $labels->map(function ($label) use ($labels) {
            $parent = $labels->get($label['parent_id']);
            $label['parent_uuid'] = $parent ? $parent['uuid'] : null;

            return $label;
        });

        // Get existing labels with the same UUID than import labels.
        $existingLabels = Label::whereIn('uuid', $labels->pluck('uuid'))
            ->select('id', 'name', 'parent_id', 'uuid')
            ->get()
            ->keyBy('id');

        // Add the parent_uuid property of existing labels.
        $existingLabels = $existingLabels->each(function ($label) use ($existingLabels) {
            $parent = $existingLabels->get($label->parent_id);
            $label->parent_uuid = $parent ? $parent->uuid : null;
        })->keyBy('uuid');

        // Add the conflicting attributes to the labels if there are any. Discard any
        // import labels that already exist and have no conflicts. Use values() to
        // discard the original keys.
        return $labels->map(function ($label) use ($trees, $existingLabels) {
                $existingLabel = $existingLabels->get($label['uuid']);
                if ($existingLabel) {
                    $label['discard'] = true;

                    if ($existingLabel->name !== $label['name']) {
                        $label['conflicting_name'] = $existingLabel->name;
                        unset($label['discard']);
                    }

                    if ($existingLabel->parent_uuid !== $label['parent_uuid']) {
                        $label['conflicting_parent_id'] = $existingLabel->parent_id;
                        unset($label['discard']);
                    }
                }

                unset($label['parent_uuid']);

                return $label;
            })
            ->reject(function ($label) {
                return array_key_exists('discard', $label);
            })
            ->values();
    }

    /**
     * Get users who might be implicitly imported along with a label tree.
     *
     * @return \Illuminate\Support\Collection
     */
    public function getUserImportCandidates()
    {
        return (new UserImport($this->path))->getUserImportCandidates();
    }

    /**
     * @{inheritdoc}
     */
    protected function expectedFiles()
    {
        return [
            'users.json',
            'label_trees.json',
        ];
    }

    /**
     * {@inheritdoc}
     */
    protected function validateFile($basename)
    {
        switch ($basename) {
            case 'users.json':
                return (new UserImport($this->path))->validateFile($basename);

            case 'label_trees.json':
                return $this->expectKeysInJson('label_trees.json', [
                    'id',
                    'name',
                    'description',
                    'labels',
                    'members',
                    'uuid',
                ]);
        }

        return parent::validateFile($basename);
    }
}
