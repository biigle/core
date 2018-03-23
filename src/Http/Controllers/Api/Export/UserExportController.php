<?php

namespace Biigle\Modules\Sync\Http\Controllers\Api\Export;

use Biigle\User;
use Illuminate\Http\Request;
use Biigle\Http\Controllers\Api\Controller;
use Biigle\Modules\Sync\Support\Export\UserExport;

class UserExportController extends Controller
{
    /*
     * @api {get} export/users Get the export file for users
     * @apiGroup Export
     * @apiName ShowUserExport
     *
     * @apiParam (Optional arguments) {String} except Comma separated IDs of the users that should not be included in the export file.
     * @apiParam (Optional arguments) {String} only Comma separated IDs of the users that should only be included in the export file.
     * @apiDescription The response is a ZIP archive that can be used for the user import. By default all users are exported.
     * @apiPermission admin
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request)
    {
        $this->validate($request, [
            'except' => 'filled',
            'only' => 'filled',
        ]);

        $query = User::getQuery();

        if ($request->has('except')) {
            $query = $query->whereNotIn('id', explode(',', $request->input('except')));
        } elseif ($request->has('only')) {
            $query = $query->whereIn('id', explode(',', $request->input('only')));
        }

        $ids = $query->pluck('id');

        $export = new UserExport($ids);

        return response()
            ->download($export->getArchive(), 'biigle_user_export.zip')
            ->deleteFileAfterSend(true);
    }
}
