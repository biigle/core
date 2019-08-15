<?php

namespace Biigle\Modules\Sync\Support\Export;

use Biigle\LabelTree;

class PublicLabelTreeExport extends Export
{
    /**
     * {@inheritdoc}
     */
    public function getContent()
    {
        $tree = LabelTree::where('id', $this->ids[0])
            ->with('version')
            ->first();

        $tree->makeVisible(['uuid']);
        $tree->makeHidden(['visibility_id']);
        if ($tree->version) {
            $tree->version->makeHidden(['label_tree_id']);
        }

        return $tree->toArray();
    }

    /**
     * {@inheritdoc}
     */
    public function getFileName()
    {
        return 'label_tree.json';
    }

    /**
     * {@inheritdoc}
     */
    public function getAdditionalExports()
    {
        return [new PublicLabelExport([$this->ids[0]])];
    }
}
