<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\LabelSource;
use Illuminate\Http\Request;
use \Illuminate\Http\Response;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

class LabelSourceController extends Controller
{
    /**
     * Find labels from a label source.
     *
     * @api {get} label-sources/:id/find Find labels from external sources
     * @apiGroup Label Trees
     * @apiName FondLabelTreesLabelSources
     * @apiDescription Returns an array with one object for each matching label. The label
     * objects may contain arbitrary data, depending on the label source.
     *
     * @apiParam {Number} id The label source ID
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\Response
     */
    public function find(Request $request, $id)
    {
        $source = LabelSource::findOrFail($id);
        $this->validate($request, ['query' => 'required']);

        try{
        $response = $source->getAdapter()->find($request);
        } catch(ServiceUnavailableHttpException $suhe){
            // getMessage() is not implemented for Symfony ServiceUnavailableHttpException
            $message = $suhe->getHeaders()['Retry-After'];
            $response = response(['message' => $suhe->getMessage()], Response::HTTP_SERVICE_UNAVAILABLE);

        }
        return $response;
    }
}
