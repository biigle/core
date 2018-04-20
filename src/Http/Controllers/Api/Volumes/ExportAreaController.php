<?php

namespace Biigle\Modules\Reports\Http\Controllers\Api\Volumes;

use Exception;
use Illuminate\Http\Request;
use Biigle\Volume as BaseVolume;
use Biigle\Modules\Reports\Volume;
use Biigle\Http\Controllers\Api\Controller;
use Illuminate\Validation\ValidationException;

class ExportAreaController extends Controller
{
    /**
     * Show the export area of the volume.
     *
     * @api {get} volumes/:id/export-area Show the export area
     * @apiGroup Volumes
     * @apiName IndexVolumesExportArea
     * @apiPermission projectMember
     * @apiDescription The export area is a rectangle defined by two points. This endpoint returns an array containing the coordinates as follows: `[x1, y1, x2, y2]`.
     * The first point may be any of the 4 points of the rectangle. The second point is the point not directly adjacent to the first.
     *
     * @apiSuccessExample {json} Success response:
     * [100, 100, 1200, 600]
     *
     * @param int $id Volume ID
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $volume = BaseVolume::findOrFail($id);
        $this->authorize('access', $volume);

        return Volume::convert($volume)->exportArea;
    }

    /**
     * Set the export area.
     *
     * @api {post} volumes/:id/export-area Set the export area
     * @apiGroup Volumes
     * @apiName StoreVolumesExportArea
     * @apiPermission projectAdmin
     *
     * @apiParam (Required arguments) {Number[]} coordinates Coordinates of the export area formatted as `[x1, y1, x2, y2]` array of integers
     *
     * @param Request $request
     * @param int $id Volume ID
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, $id)
    {
        $volume = BaseVolume::findOrFail($id);
        $this->authorize('update', $volume);
        $this->validate($request, Volume::$storeRules);

        $volume = Volume::convert($volume);

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
     *
     * @param int $id Volume ID
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $volume = BaseVolume::findOrFail($id);
        $this->authorize('update', $volume);
        $volume = Volume::convert($volume);
        $volume->exportArea = null;
        $volume->save();
    }
}
