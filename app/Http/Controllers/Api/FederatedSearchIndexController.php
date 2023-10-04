<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Jobs\GenerateFederatedSearchIndex;
use Cache;

class FederatedSearchIndexController extends Controller
{
    /**
     * Show the federated search index.
     *
     * @api {get} federated-search-index Get the federated search index
     * @apiGroup Federated Search
     * @apiName Index
     * @apiPermission federatedSearchInstance
     * @apiDescription **Important:** This endpoint does not use the regular
     * authentication method of API endpoints and expects an authentication token of a
     * remote instance that was configured for federated search.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "label_trees": [
     *        {
     *            "id": 1,
     *            "name": "test tree",
     *            "description": "this is my test tree",
     *            "created_at": "2020-08-19 13:19:06",
     *            "updated_at": "2020-08-19 13:19:06",
     *            "url": "/label-trees/1",
     *            "members" => [2]
     *        }
     *    ],
     *    "projects": [
     *        {
     *            "id": 2,
     *            "name": "test project",
     *            "description": "this is my test project",
     *            "created_at": "2020-08-19 13:21:49",
     *            "updated_at": "2020-08-19 13:21:49",
     *            "thumbnail_url": "https://example.com/thumbs/1.jpg",
     *            "url": "/projects/2",
     *            "members": [2],
     *            "label_trees": [1],
     *            "volumes": [1]
     *        }
     *    ],
     *    "volumes": [
     *        {
     *            "id": 1,
     *            "name": "test volume",
     *            "created_at": "2020-08-19 13:23:19",
     *            "updated_at": "2020-08-19 13:23:19",
     *            "url": "/volumes/1",
     *            "thumbnail_url": "https://example.com/thumbs/2.jpg",
     *            "thumbnail_urls": [
     *                "https://example.com/thumbs/2.jpg",
     *                "https://example.com/thumbs/3.jpg",
     *            ],
     *        }
     *    ],
     *    "users": [
     *        {
     *             "id": 2,
     *             "uuid": "a24ada02-5f3f-3fe6-b64e-98473ce70b9a"
     *        }
     *    ]
     * }
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $key = config('biigle.federated_search.cache_key');

        if (!Cache::has($key)) {
            // The index should be continuously regenerated with a scheduled job. This is
            // a fallback in case the job wasn't performed for some reason.
            GenerateFederatedSearchIndex::dispatchSync();
        }

        return Cache::get($key);
    }
}
