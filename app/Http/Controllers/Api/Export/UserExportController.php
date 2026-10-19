<?php

namespace Biigle\Http\Controllers\Api\Export;

use Biigle\User;

class UserExportController extends Controller
{
    /**
     * @api {post} export/users Request a user export
     * @apiGroup Sync
     * @apiName ShowUserExport
     *
     * @apiParam (Optional arguments) {String} except Comma separated IDs of the users that should not be included in the export file.
     * @apiParam (Optional arguments) {String} only Comma separated IDs of the users that should only be included in the export file.
     * @apiDescription Exactly one of `except` or `only` must be provided (not both). The response acknowledges the queued export.
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
    protected function getType(): string
    {
        return 'users';
    }

    /**
     * {@inheritdoc}
     */
    protected function getExportFilename()
    {
        return 'biigle_user_export.zip';
    }
}
