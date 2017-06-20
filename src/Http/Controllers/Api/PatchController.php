<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api;

use Biigle\Annotation;
use Biigle\Http\Controllers\Api\Controller;
use Symfony\Component\HttpFoundation\File\Exception\FileNotFoundException;

class PatchController extends Controller
{
    /**
     * Show the patch image of an annotation.
     *
     * @api {get} annotations/:id/patch Get an annotation patch
     * @apiGroup Annotations
     * @apiName ShowAnnotationPatch
     * @apiParam {Number} id The annotation ID.
     * @apiPermission projectMember
     * @apiDescription Responds with an image file. If there is an active annotation session, access to annotations hidden by the session is denied.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $annotation = Annotation::with('image')->findOrFail($id);
        $this->authorize('access', $annotation);

        $file = config('largo.patch_storage').'/'.
            $annotation->image->volume_id.'/'.
            $annotation->id.'.'.config('largo.patch_format');

        try {
            return response()->download($file);
        } catch (FileNotFoundException $e) {
            abort(404, $e->getMessage());
        }
    }
}
