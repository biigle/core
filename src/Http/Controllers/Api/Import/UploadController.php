<?php

namespace Biigle\Modules\Sync\Http\Controllers\Api\Import;

use File;
use Exception;
use ZipArchive;
use Illuminate\Http\Request;
use Biigle\Http\Controllers\Api\Controller;
use Biigle\Modules\Sync\Support\Import\ArchiveManager;

class UploadController extends Controller
{
    /**
     * Initiate a new import
     *
     * @api {post} import Initiate a new import
     * @apiGroup Sync
     * @apiName InitiateImport
     * @apiPermission admin
     * @apiDescription Redirects to the import page in the admin panel where the import can be edited and performed.
     *
     * @apiParam (Required parameters) {File} archive The export archive file.
     *
     * @param Request $request
     * @param ArchiveManager $manager
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, ArchiveManager $manager)
    {
        $this->validate($request, ['archive' => 'required|file|mimes:zip']);

        try {
            $token = $manager->store($request->file('archive'));
        } catch (Exception $e) {
            return $this->buildFailedValidationResponse($request, [
                'archive' => [$e->getMessage()],
            ]);
        }

        return redirect()->route('admin-import-show', $token);
    }
}
