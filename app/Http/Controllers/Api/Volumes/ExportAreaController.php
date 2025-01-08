<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Volume;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

class ExportAreaController extends Controller
{
    /**
     * Show the export area of the volume.
     *
     * @api {get} volumes/:id/export-area Get the export area
     * @apiGroup Reports
     * @apiName IndexVolumesExportArea
     * @apiPermission projectMember
     * @apiDescription The export area is a rectangle defined by two points. This endpoint returns an array containing the coordinates as follows: `[x1, y1, x2, y2]`.
     * The first point may be any of the 4 points of the rectangle. The second point is the point not directly adjacent to the first. Only available for image volumes.
     *
     * @apiSuccessExample {json} Success response:
     * [100, 100, 1200, 600]
     *
     * @param int $id Volume ID
     * @return array
     */
    public function show($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        if (!$volume->isImageVolume()) {
            abort(Response::HTTP_NOT_FOUND);
        }

        return $volume->exportArea;
    }

    /**
     * Set the export area.
     *
     * @api {post} volumes/:id/export-area Set the export area
     * @apiGroup Volumes
     * @apiName StoreVolumesExportArea
     * @apiPermission projectAdmin
     * @apiDescription Only available for image volumes.
     *
     * @apiParam (Required arguments) {Number[]} coordinates Coordinates of the export area formatted as `[x1, y1, x2, y2]` array of integers
     *
     * @param Request $request
     * @param int $id Volume ID
     */
    public function store(Request $request, $id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('update', $volume);
        if (!$volume->isImageVolume()) {
            throw ValidationException::withMessages(['id' => 'The export area can only be set for image volumes.']);
        }
        $this->validate($request, ['coordinates' => 'required|array']);

        try {
            $volume->exportArea = $request->input('coordinates');
            $volume->save();
        } catch (Exception $e) {
            throw ValidationException::withMessages(['coordinates' => $e->getMessage()]);
        }
    }

    /**
     * Remove the export area.
     *
     * @api {delete} volumes/:id/export-area Remove the export area
     * @apiGroup Volumes
     * @apiName DestroyVolumesExportArea
     * @apiPermission projectAdmin
     * @apiDescription Only available for image volumes.
     *
     * @param int $id Volume ID
     */
    public function destroy($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('update', $volume);
        if (!$volume->isImageVolume()) {
            abort(Response::HTTP_NOT_FOUND);
        }
        $volume->exportArea = null;
        $volume->save();
    }
}
