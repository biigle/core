<?php

namespace Biigle\Http\Controllers\Api;

use Exception;
use GuzzleHttp\Client;
use Illuminate\Http\Response;

class LabelbotOnnxModelController extends Controller
{
    /**
     * @api {get} /api/v1/labelbot-onnx-model Stream ONNX Model
     * @apiGroup Labelbot
     * @apiName StreamONNXModel
     * @apiPermission authenticatedUser
     * @apiDescription Fetches and streams the ONNX model file dynamically from a remote URL or local server.
     *
     * @apiSuccess (200) {File} model.onnx The ONNX model file is returned as a stream.
     * @apiSuccess (Response Headers) {String} Content-Type application/octet-stream
     * @apiSuccess (Response Headers) {String} Content-Disposition attachment; filename="model.onnx"
     *
     * @apiError (404) NotFound Returned if the ONNX model file is unavailable.
     *
     * @return \Symfony\Component\HttpFoundation\StreamedResponse Returns a streamed response containing the ONNX model file.
     */
    public function stream()
    {
        $url = config('labelbot.onnx_url');
        $chunkSize = config('labelbot.onnx_chunk_size');

        try {
            $client = new Client();
            $response = $client->request('GET', $url, ['stream' => true]);

            return response()->stream(function () use ($response, $chunkSize) {
                $body = $response->getBody();
                while (!$body->eof()) {
                    echo $body->read($chunkSize);
                    flush();
                }
            }, 200, [
                'Content-Type' => 'application/octet-stream',
                'Content-Disposition' => 'attachment; filename="model.onnx"',
            ]);
        } catch (Exception $e) {
            abort(Response::HTTP_NOT_FOUND);
        }
    }
}
