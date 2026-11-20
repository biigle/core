<?php

namespace Biigle\Http\Controllers\Api\Export;

use Biigle\LabelTree;

class LabelTreeExportController extends Controller
{
    /**
     * @api {post} export/label-trees Request a label tree export
     * @apiGroup Sync
     * @apiName StoreLabelTreeExport
     * @apiPermission admin
     * @apiDescription Exactly one of `except` or `only` must be provided (not both). The export file is generated in the background and the user is notified when it is ready. Responds with the new export file object.
     *
     * @apiParam (Optional arguments) {Number[]} except IDs of the label trees that should not be included in the export file.
     * @apiParam (Optional arguments) {Number[]} only IDs of the label trees that should only be included in the export file.
     * @apiParam (Optional arguments) {String} description A description of the export file (max. 255 characters).
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
    protected function getType(): string
    {
        return 'labelTrees';
    }
}
