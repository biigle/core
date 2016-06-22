<?php

namespace Dias\Modules\Ate\Http\Controllers\Api;

use Dias\Http\Controllers\Api\Controller;
use Dias\Annotation;
use Symfony\Component\HttpFoundation\File\Exception\FileNotFoundException;

class AteController extends Controller
{
    /**
     * Show the patch image of an annotation
     *
     * @api {get} annotations/:id/patch Get an annotation patch
     * @apiGroup Annotations
     * @apiName ShowAnnotationPatch
     * @apiParam {Number} id The annotation ID.
     * @apiPermission projectMember
     * @apiDescription Responds with an image file
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function showPatch($id)
    {
        $annotation = Annotation::with('image')->findOrFail($id);
        $this->authorize('access', $annotation);

        $file = config('ate.patch_storage').'/'.
            $annotation->image->transect_id.'/'.
            $annotation->id.'.'.config('ate.patch_format');

        try {
            return response()->download($file);
        } catch (FileNotFoundException $e) {
            abort(404, $e->getMessage());
        }
    }

}
