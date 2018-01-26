<?php

namespace Biigle\Http\Controllers\Api\Traits;

use Exception;
use Biigle\Label;

trait ValidatesLabelParents
{
    /**
     * Chack if the label tree has a label.
     *
     * @param int $treeId
     * @param int $parentId
     * @throws Exception If the label does not exist in the tree.
     *
     * @return bool
     */
    protected function validateLabelParent($treeId, $parentId)
    {
        $exists = Label::where('id', $parentId)
            ->where('label_tree_id', $treeId)
            ->exists();

        if (!$exists) {
            throw new Exception('The parent label must belong to the same label tree than the new label.');
        }
    }
}
