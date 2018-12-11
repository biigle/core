<?php

namespace Biigle\Modules\Sync\Http\Controllers\Api\Export;

use Biigle\LabelTree;
use Biigle\Modules\Sync\Support\Export\LabelTreeExport;

class LabelTreeExportController extends Controller
{
    /**
     * @api {get} export/label-trees Get a label tree export
     * @apiGroup Sync
     * @apiName ShowLabelTreeExport
     *
     * @apiParam (Optional arguments) {String} except Comma separated IDs of the label trees that should not be included in the export file.
     * @apiParam (Optional arguments) {String} only Comma separated IDs of the label trees that should only be included in the export file.
     * @apiDescription The response is a ZIP archive that can be used for the label tree import. By default all label trees are exported.
     * @apiPermission admin
     */

    /**
     * {@inheritdoc}
     */
    protected function getQuery()
    {
        return LabelTree::getQuery();
    }

    /**
     * {@inheritdoc}
     */
    protected function getExport(array $ids)
    {
        return new LabelTreeExport($ids);
    }

    /**
     * {@inheritdoc}
     */
    protected function getExportFilename()
    {
        return 'biigle_label_tree_export.zip';
    }

    /**
     * {@inheritdoc}
     */
    protected function isAllowed()
    {
        return in_array('labelTrees', config('sync.allowed_exports'));
    }
}
