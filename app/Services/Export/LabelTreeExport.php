<?php

namespace Biigle\Services\Export;

use Biigle\LabelTree;
use DB;

class LabelTreeExport extends Export
{
    /**
     * {@inheritdoc}
     */
    public function getContent()
    {
        $trees =
            LabelTree::where(function ($query) {
                $query->whereIn('id', $this->ids)
                    // Also add master trees of all included versioned trees.
                    ->orWhereIn('id', function ($query) {
                        $query->select('label_tree_versions.label_tree_id')
                            ->from('label_tree_versions')
                            ->join('label_trees', 'label_trees.version_id', '=', 'label_tree_versions.id')
                            ->whereIn('label_trees.id', $this->ids);
                    });
            })
            ->with('labels', 'version')
            ->with(['members' => function ($query) {
                $query->select('users.id', 'label_tree_user.role_id');
            }])
            ->get();

        $trees->each(function ($tree) {
            $tree->makeVisible('uuid');
            // All imported trees should become private by default.
            $tree->makeHidden(['visibility_id', 'created_at', 'updated_at']);

            $tree->labels->each(function ($label) {
                $label->makeVisible('uuid');
                $label->makeHidden(['label_tree_id', 'source_id', 'label_source_id']);
            });
        });

        return $trees->toArray();
    }

    /**
     * {@inheritdoc}
     */
    public function getFileName()
    {
        return 'label_trees.json';
    }

    /**
     * {@inheritdoc}
     */
    public function getAdditionalExports()
    {
        $ids = DB::table('label_tree_user')
            ->where(function ($query) {
                $query->whereIn('label_tree_id', $this->ids)
                    // Also add master trees of all included versioned trees.
                    ->orWhereIn('label_tree_id', function ($query) {
                        $query->select('label_tree_versions.label_tree_id')
                            ->from('label_tree_versions')
                            ->join('label_trees', 'label_trees.version_id', '=', 'label_tree_versions.id')
                            ->whereIn('label_trees.id', $this->ids);
                    });
            })
            ->select('user_id')
            ->distinct()
            ->pluck('user_id')
            ->toArray();

        return [new UserExport($ids)];
    }
}
