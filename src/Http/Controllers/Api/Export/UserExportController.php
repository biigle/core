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

        if ($request->has('except')) {
            $ids = User::whereNotIn('id', explode(',', $request->input('except')))->pluck('id');
        } elseif ($request->has('except')) {
            $ids = User::whereIn('id', explode(',', $request->input('only')))->pluck('id');
        } else {
            $ids = User::pluck('id');
        }

        $export = new UserExport($ids);

        return response()
            ->download($export->getArchive(), 'biigle_user_export.zip')
            ->deleteFileAfterSend(true);
    }
}
