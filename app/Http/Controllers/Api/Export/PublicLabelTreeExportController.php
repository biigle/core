<?php

namespace Biigle\Http\Controllers\Api\Export;

use Biigle\Http\Controllers\Api\Controller as BaseController;
use Biigle\Http\Requests\ShowPublicLabelTreeExport;
use Biigle\Services\Export\PublicLabelTreeExport;

class PublicLabelTreeExportController extends BaseController
{
    /**
     * Handle a public label tree export request.
     *
     * @api {get} public-export/label-trees/:id Download a label tree
     * @apiGroup Sync
     * @apiName ShowPublicLabelTreeExport
     * @apiDescription The response is a ZIP archive that contains a JSON file with label tree attributes and a CSV file with label attributes.
     *
     * @apiParam {Number} id The label tree ID
     *
     * @apiPermission labelTreeMemberIfPrivate
     *
     * @param ShowPublicLabelTreeExport $request
     * @return \Illuminate\Http\Response
     */
    public function show(ShowPublicLabelTreeExport $request)
    {
        $export = new PublicLabelTreeExport([$request->tree->id]);

        return response()
            ->download($export->getArchive(), 'biigle_label_tree_export.zip', [
                'Content-Type' => 'application/zip',
            ])
            ->deleteFileAfterSend(true);
    }
}
