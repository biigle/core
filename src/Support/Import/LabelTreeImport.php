<?php

namespace Biigle\Modules\Sync\Support\Import;

use DB;
use Exception;
use Biigle\Role;
use Biigle\Label;
use Carbon\Carbon;
use Biigle\LabelTree;
use Biigle\Visibility;
use Illuminate\Support\Collection;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class LabelTreeImport extends Import
{
    /**
     * Caches the decoded label tree import file.
     *
     * @var Collection
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
        try {
            $insertTrees = $this->getInsertLabelTrees($onlyTrees);
            $labelTreeIdMap = $this->insertLabelTrees($insertTrees);

            $insertUserIds = $this->getInsertUserIds($insertTrees);
            $userIdMap = (new UserImport($this->path))->perform($insertUserIds);
            $this->attachLabelTreeMembers($insertTrees, $labelTreeIdMap, $userIdMap);

            $labelCandidates = $this->getInsertLabels($onlyLabels);
            $labelHasConflict = function ($label) {
                return array_key_exists('conflicting_name', $label) || array_key_exists('conflicting_parent_id', $label);
            };

            $insertLabels = $labelCandidates->reject($labelHasConflict);
            // Insert all labels with parent_id null first.
            $labelIdMap = $this->insertLabels($insertLabels, $labelTreeIdMap);
            // Then set the parent_id based on the IDs of the newly existing labels.
            $this->updateInsertedLabelParentIds($insertLabels, $labelIdMap);

            $mergeLabels = $labelCandidates->filter($labelHasConflict);
            $this->mergeLabels($mergeLabels, $nameConflictResolution, $parentConflictResolution, $labelIdMap);
        } catch (Exception $e) {
            // Attempt to delete any imported label trees and labels.
            if (isset($labelTreeIdMap)) {
                LabelTree::whereIn('uuid', $insertTrees->pluck('uuid'))->delete();
            }

            if (isset($labelIdMap)) {
                Label::whereIn('uuid', $insertLabels->pluck('uuid'))->delete();
            }

            throw $e;
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
     * @return Collection
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
     * @return Collection
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
     * @return Collection
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
                    $label['label_tree_id'] = $tree['id'];
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
     * @return Collection
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

    /**
     * Get the array that can be used to insert the label trees that should be imported.
     *
     * @param array|null $onlyTrees IDs of the label tree import candidates to limit the import to
     *
     * @return Collection
     */
    protected function getInsertLabelTrees($onlyTrees)
    {
        $now = Carbon::now();

        return $this->getLabelTreeImportCandidates()
            ->when(is_array($onlyTrees), function ($collection) use ($onlyTrees) {
                return $collection->whereIn('id', $onlyTrees);
            })
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
    }

    /**
     * Insert label trees that should be imported in the database.
     *
     * @param Collection $trees Label trees to insert.
     *
     * @return array Map of import label tree IDs to existing label tree IDs.
     */
    protected function insertLabelTrees($trees)
    {
        LabelTree::insert($trees->toArray());

        $labelTrees = $this->getImportLabelTrees()->keyBy('uuid');
        $existingTrees = LabelTree::whereIn('uuid', $labelTrees->keys())
            ->pluck('id', 'uuid');

        $labelTreeIdMap = [];
        foreach ($labelTrees as $tree) {
            if ($existingTrees->has($tree['uuid'])) {
                $labelTreeIdMap[$tree['id']] = $existingTrees[$tree['uuid']];
            }
        }

        return $labelTreeIdMap;
    }

    /**
     * Get IDs of label tree admins that should be imported.
     *
     * @param Collection $trees Label trees that have been imported.
     *
     * @return array
     */
    protected function getInsertUserIds($trees)
    {
        return $this->getImportLabelTrees()
            ->whereIn('uuid', $trees->pluck('uuid'))
            ->pluck('members')
            ->collapse()
            ->filter(function ($user) {
                return $user['role_id'] === Role::$admin->id;
            })
            ->pluck('id')
            ->unique()
            ->toArray();
    }

    /**
     * Attach members to imported label trees.
     *
     * @param Collection $trees Imported label trees
     * @param array $labelTreeIdMap Map of import label trees to existing label trees.
     * @param array $userIdMap Map of import users to existing users.
     */
    protected function attachLabelTreeMembers($trees, $labelTreeIdMap, $userIdMap)
    {
        $insertMembers = $this->getImportLabelTrees()
            ->whereIn('uuid', $trees->pluck('uuid'))
            ->map(function ($tree) {
                return array_map(function ($member) use ($tree) {
                    $member['label_tree_id'] = $tree['id'];
                    return $member;
                }, $tree['members']);
            })
            ->collapse()
            ->filter(function ($user) use ($userIdMap) {
                return array_key_exists($user['id'], $userIdMap);
            })
            ->map(function ($member) use ($labelTreeIdMap, $userIdMap) {
                return [
                    'user_id' => $userIdMap[$member['id']],
                    'label_tree_id' => $labelTreeIdMap[$member['label_tree_id']],
                    'role_id' => $member['role_id'],
                ];
            });

        DB::table('label_tree_user')->insert($insertMembers->toArray());
    }

    /**
     * Get the array that can be used to insert the labels that should be imported.
     *
     * @param array|null $onlyLabels IDs of the label import candidates to limit the import to.
     *
     * @return Collection
     */
    protected function getInsertLabels($onlyLabels)
    {
        // As the import label trees have been imported at this point, their import
        // labels are included in the candidates now, too.
        return $this->getLabelImportCandidates()
            ->when(is_array($onlyLabels), function ($collection) use ($onlyLabels) {
                return $collection->whereIn('id', $onlyLabels);
            });
    }

    /**
     * Insert labels that should be imported in the database.
     *
     * @param Collection $labels The labels to insert
     * @param array $labelTreeIdMap Map of import label tree IDs to existing label tree IDs
     *
     * @return array Map of import label IDs to existing label IDs.
     */
    protected function insertLabels($labels, $labelTreeIdMap)
    {
        $labels = $labels->map(function ($label) use ($labelTreeIdMap) {
            return [
                'name' => $label['name'],
                'color' => $label['color'],
                'label_tree_id' => $labelTreeIdMap[$label['label_tree_id']],
                'uuid' => $label['uuid'],
            ];
        });

        Label::insert($labels->toArray());

        // This is not the same than $labels. It might inclide already existing labels,
        // too because we want the ID map of all labels of the import and not only of all
        // imported labels.
        $importLabels = $this->getImportLabelTrees()
            ->pluck('labels')
            ->collapse();

        $existingLabels = Label::whereIn('uuid', $importLabels->pluck('uuid'))
            ->pluck('id', 'uuid');

        $labelIdMap = [];
        foreach ($importLabels as $label) {
            if ($existingLabels->has($label['uuid'])) {
                $labelIdMap[$label['id']] = $existingLabels[$label['uuid']];
            }
        }

        return $labelIdMap;
    }

    /**
     * Update/set the parent_id of imported labels.
     *
     * @param Collection $labels Labels to update the parent_id of.
     * @param array $labelIdMap Map of import label IDs to existing label IDs.
     */
    protected function updateInsertedLabelParentIds($labels, $labelIdMap)
    {
        $labels->reject(function ($label) use ($labelIdMap) {
                return is_null($label['parent_id']) ||
                    // This might be the case if a user selectively imports a child label
                    // but not its parent.
                    !array_key_exists($label['parent_id'], $labelIdMap);
            })
            ->each(function ($label) use ($labelIdMap) {
                Label::where('id', $labelIdMap[$label['id']])
                    ->update(['parent_id' => $labelIdMap[$label['parent_id']]]);
            });
    }

    /**
     * Merge conflicts between import labels and existing labels.
     *
     * @param Collection $mergeLabels Import labels to merge.
     * @param array $nameConflictResolution
     * @param array $parentConflictResolution
     * @param array $labelIdMap Map of import label IDs to existing label IDs.
     */
    protected function mergeLabels($mergeLabels, $nameConflictResolution, $parentConflictResolution, $labelIdMap)
    {
        $nameConflicts = $mergeLabels->filter(function ($label) {
                return array_key_exists('conflicting_name', $label);
            })
            ->each(function ($label) use ($nameConflictResolution) {
                if (!array_key_exists($label['id'], $nameConflictResolution)) {
                    throw new UnprocessableEntityHttpException("Unresolved name conflict for label '{$label['name']}'.");
                }
            })
            ->filter(function ($label) use ($nameConflictResolution) {
                return $nameConflictResolution[$label['id']] === 'import';
            });

        $parentConflicts = $mergeLabels->filter(function ($label) {
                return array_key_exists('conflicting_parent_id', $label);
            })
            ->each(function ($label) use ($parentConflictResolution) {
                if (!array_key_exists($label['id'], $parentConflictResolution)) {
                    throw new UnprocessableEntityHttpException("Unresolved parent conflict for label '{$label['name']}'.");
                }
            })
            ->filter(function ($label) use ($parentConflictResolution) {
                return $parentConflictResolution[$label['id']] === 'import';
            });

        // Resolve name and parent conflicts *after* the check if every conflict has a
        // resolution.
        $nameConflicts->each(function ($label) use ($labelIdMap) {
            Label::where('id', $labelIdMap[$label['id']])
                ->update(['name' => $label['name']]);
        });

        $parentConflicts->each(function ($label) use ($labelIdMap) {
            $id = null;
            if (array_key_exists($label['parent_id'], $labelIdMap)) {
                $id = $labelIdMap[$label['parent_id']];
            }
            Label::where('id', $labelIdMap[$label['id']])
                ->update(['parent_id' => $id]);
        });
    }
}
