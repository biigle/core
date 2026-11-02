<?php

namespace Biigle\Http\Controllers\Api\Export;

use Biigle\User;

class UserExportController extends Controller
{
    /**
     * @api {post} export/users Request a user export
     * @apiGroup Sync
     * @apiName StoreUserExport
     * @apiPermission admin
     * @apiDescription Exactly one of `except` or `only` must be provided (not both). The export file is generated in the background and the user is notified when it is ready. Responds with the new export file object.
     *
     * @apiParam (Optional arguments) {Number[]} except IDs of the users that should not be included in the export file.
     * @apiParam (Optional arguments) {Number[]} only IDs of the users that should only be included in the export file.
     * @apiParam (Optional arguments) {String} description A description of the export file (max. 255 characters).
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
}
