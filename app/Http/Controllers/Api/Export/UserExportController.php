<?php

namespace Biigle\Http\Controllers\Api\Export;

use Biigle\Services\Export\UserExport;
use Biigle\User;

class UserExportController extends Controller
{
    /**
     * @api {get} export/users Get a user export
     * @apiGroup Sync
     * @apiName ShowUserExport
     *
     * @apiParam (Optional arguments) {String} except Comma separated IDs of the users that should not be included in the export file.
     * @apiParam (Optional arguments) {String} only Comma separated IDs of the users that should only be included in the export file.
     * @apiDescription The response is a ZIP archive that can be used for the user import. By default all users are exported.
     * @apiPermission admin
     */

    /**
     * {@inheritdoc}
     */
    protected function getQuery()
    {
        return User::getQuery();
    }

    /**
     * {@inheritdoc}
     */
    protected function getExport(array $ids)
    {
        return new UserExport($ids);
    }

    /**
     * {@inheritdoc}
     */
    protected function getExportFilename()
    {
        return 'biigle_user_export.zip';
    }

    /**
     * {@inheritdoc}
     */
    protected function isAllowed()
    {
        return in_array('users', config('sync.allowed_exports'));
    }
}
