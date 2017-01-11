<?php

namespace Biigle\Modules\Export\Http\Controllers\Api\Transects;

use Exception;
use Illuminate\Http\Request;
use Biigle\Modules\Export\Transect;
use Biigle\Transect as BaseTransect;
use Biigle\Http\Controllers\Api\Controller;

class ExportAreaController extends Controller
{
    /**
     * Show the export area of the transect
     *
     * @api {get} transects/:id/export-area Show the export area
     * @apiGroup Transects
     * @apiName IndexTransectsExportArea
     * @apiPermission projectMember
     * @apiDescription The export area is a rectangle defined by two points. This endpoint returns an array containing the coordinates as follows: `[x1, y1, x2, y2]`.
     * The first point may be any of the 4 points of the rectangle. The second point is the point not directly adjacent to the first.
     *
     * @apiSuccessExample {json} Success response:
     * [100, 100, 1200, 600]
     *
     * @param int $id Transect ID
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $transect = BaseTransect::findOrFail($id);
        $this->authorize('access', $transect);

        return Transect::convert($transect)->exportArea;
    }

    /**
     * Set the export area
     *
     * @api {post} transects/:id/export-area Set the export area
     * @apiGroup Transects
     * @apiName StoreTransectsExportArea
     * @apiPermission projectAdmin
     *
     * @apiParam (Required arguments) {Number[]} coordinates Coordinates of the export area formatted as `[x1, y1, x2, y2]` array of integers
     *
     * @param Request $request
     * @param int $id Transect ID
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, $id)
    {
        $transect = BaseTransect::findOrFail($id);
        $this->authorize('update', $transect);
        $this->validate($request, Transect::$storeRules);

        $transect = Transect::convert($transect);

        try {
            $transect->exportArea = $request->input('coordinates');
            $transect->save();
        } catch (Exception $e) {
            return $this->buildFailedValidationResponse($request, [
                'coordinates' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Remove the export area
     *
     * @api {delete} transects/:id/export-area Remove the export area
     * @apiGroup Transects
     * @apiName DestroyTransectsExportArea
     * @apiPermission projectAdmin
     *
     * @param int $id Transect ID
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $transect = BaseTransect::findOrFail($id);
        $this->authorize('update', $transect);
        $transect = Transect::convert($transect);
        $transect->exportArea = null;
        $transect->save();
    }
}
