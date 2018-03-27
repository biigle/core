<?php

namespace Biigle\Modules\Sync\Support\Export;

use DB;
use Biigle\LabelTree;

class LabelTreeExport extends Export
{
    /**
     * {@inheritdoc}
     */
    public function getContent()
    {
        $trees = LabelTree::whereIn('id', $this->ids)
            ->with('labels')
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
                $label->makeHidden('label_tree_id');
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
            ->whereIn('label_tree_id', $this->ids)
            ->select('user_id')
            ->distinct()
            ->pluck('user_id')
            ->toArray();

        return [new UserExport($ids)];
    }
}
