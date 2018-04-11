<?php

namespace Biigle\Modules\Sync\Support\Import;

use Biigle\Label;
use Biigle\LabelTree;

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
     * @return array Map of external user IDs (from the import file) to user IDs of the database and of external labels to the labels of the database.
     */
    public function perform($onlyTrees = null, $onlyLabels = null)
    {

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
     * Get users that might be implicitly imported along with a label tree.
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
