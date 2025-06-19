<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\FederatedSearchInstance;
use Biigle\Http\Requests\StoreFederatedSearchInstance;
use Biigle\Http\Requests\UpdateFederatedSearchInstance;
use Biigle\Jobs\UpdateFederatedSearchIndex;

class FederatedSearchInstanceController extends Controller
{
    /**
     * Connect a remote federated search instance.
     *
     * @api {post} federated-search-instances Connect a remote instance
     * @apiGroup FederatedSearch
     * @apiName StoreInstance
     * @apiPermission admin
     *
     * @apiParam (Required parameters) {String} name Name of the connected instance.
     * @apiParam (Required parameters) {String} url Base URL to the instance (e.g. `https://example.com`).
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 1,
     *    "created_at": "2020-08-20 08:29:00",
     *    "updated_at": "2020-08-20 08:29:00",
     *    "indexed_at": null,
     *    "name": "my remote BIIGLE instance",
     *    "url": "https://example.com"
     * }
     *
     * @param StoreFederatedSearchInstance $request
     * @return FederatedSearchInstance|\Illuminate\Http\RedirectResponse
     */
    public function store(StoreFederatedSearchInstance $request)
    {
        $instance = FederatedSearchInstance::create($request->validated());

        if ($this->isAutomatedRequest()) {
            return $instance;
        }

        return $this->fuzzyRedirect('admin-federated-search', ['edit' => $instance->id])
            ->with('message', 'New instance created')
            ->with('messageType', 'success');
    }

    /**
     * update federated search instance.
     *
     * @api {put} federated-search-instances/:id Update a remote instance
     * @apiGroup FederatedSearch
     * @apiName UpdateInstance
     * @apiPermission admin
     *
     * @apiParam (Attributes that can be updated) {String} name Name of the connected
     * instance.
     * @apiParam (Attributes that can be updated) {String} url Base URL to the instance.
     * @apiParam (Attributes that can be updated) {String} remote_token Token that is used to authenticate requests to the remote instance. Adding a token will enable regular requests to fetch the search index from the remote instance. Removing the token will disable the regular requests.
     * @apiParam (Attributes that can be updated) {Boolean} local_token Set to `true` to (re-)set a new token that can be used by the remote instance to authenticate to the local instance. A new token is returned only once in plain text as `new_local_token`. Set this attribute to `false` to clear the local token and thus deny access by the remote instance.
     *
     * @param UpdateFederatedSearchInstance $request
     * @return FederatedSearchInstance|\Illuminate\Http\RedirectResponse
     */
    public function update(UpdateFederatedSearchInstance $request)
    {
        $instance = $request->instance;
        $instance->fill($request->only('name', 'url'));

        if ($request->has('remote_token')) {
            $instance->remote_token = $request->input('remote_token');
        }

        if ($request->has('local_token')) {
            if ($request->input('local_token')) {
                $token = $instance->createLocalToken();
            } else {
                $instance->local_token = null;
            }
        }

        $instance->save();

        if ($request->has('remote_token')) {
            if ($instance->remote_token) {
                // Dispatch the job immediately and don't wait for the scheduled job.
                UpdateFederatedSearchIndex::dispatch($instance);
            } else {
                // Delete indexed models if indexing is disabled.
                $instance->models()->delete();
            }
        }

        if ($this->isAutomatedRequest()) {
            if (isset($token)) {
                /** @phpstan-ignore-next-line */
                $instance->new_local_token = $token;
            }

            return $instance;
        }

        $response = $this->fuzzyRedirect();

        if (isset($token)) {
            $response = $response->with('new_local_token', $token);
        }

        return $response;
    }

    /**
     * Disonnect a remote federated search instance.
     *
     * @api {delete} federated-search-instances/:id Disonnect a remote instance
     * @apiGroup FederatedSearch
     * @apiName DestroyInstance
     * @apiPermission admin
     *
     * @apiParam {Number} id ID of the instance to disconnect
     *
     * @param int $id
     * @return \Illuminate\Http\RedirectResponse|void
     */
    public function destroy($id)
    {
        $instance = FederatedSearchInstance::findOrFail($id);
        $this->authorize('destroy', $instance);
        $instance->delete();

        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect()
                ->with('message', 'The instance was deleted.')
                ->with('messageType', 'success');
        }
    }
}
