<?php

namespace Biigle\Modules\Sync\Support\Export;

use Biigle\LabelTree;

class LabelTreeExport extends Export
{
    /**
     * IDs of the label trees of this export.
     *
     * @var array
     */
    protected $ids;

    /**
     * Create a new instance.
     *
     * @param array $ids Label tree IDs
     */
    function __construct($ids)
    {
        $this->ids = $ids;
    }

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
            $tree->makeVisible(['uuid']);
            // All imported trees should become private by default.
            $tree->makeHidden(['visibility_id', 'created_at', 'updated_at']);

            $tree->labels->each(function ($label) {
                $label->makeVisible('uuid');
                $label->makeHidden('label_tree_id');
            });
        });

        $ids = $trees->pluck('members')->flatten()->pluck('id')->unique();
        $users = (new UserExport($ids))->getContent();

        return [
            'users' => $users,
            'label-trees' => $trees->toArray(),
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function getFileName()
    {
        return 'label-trees.json';
    }
}
