<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\ApiToken;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Str;

class ApiTokenController extends Controller
{
    /**
     * Creates a new ApiTokenController instance.
     */
    public function __construct()
    {
        $this->middleware('session', ['only' => [
            'store',
        ]]);
    }

    /**
     * Shows a list of all API tokens belonging to the authenticated user.
     *
     * @api {get} api-tokens Get all API tokens
     * @apiGroup Api Tokens
     * @apiName IndexApiTokens
     * @apiPermission user
     * @apiDescription A user can only see their own API tokens
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "created_at": "2016-04-24 09:52:05",
     *       "updated_at": "2016-04-24 09:52:05",
     *       "owner_id": 1,
     *       "purpose": "My custom Python script"
     *    }
     * ]
     *
     * @param Request $request
     * @return \Illuminate\Database\Eloquent\Collection<int, ApiToken>
     */
    public function index(Request $request)
    {
        return $request->user()->apiTokens;
    }

    /**
     * Creates a new API token.
     *
     * @api {post} api-tokens Create a new API token
     * @apiGroup Api Tokens
     * @apiName StoreApiTokens
     * @apiPermission editor
     * @apiDescription This action is allowed only by session cookie authentication. The token of the response is displayed only this single time!
     *
     * @apiParam (Required parameters) {String} purpose A short description of the purpose of the new token
     *
     * @apiParamExample {String} Request example:
     * purpose: 'Token for my custom Python script'
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 1,
     *    "created_at": "2016-04-24 09:52:05",
     *    "updated_at": "2016-04-24 09:52:05",
     *    "owner_id": 1,
     *    "purpose": "Token for my custom Python script",
     *    "token": "KMrUSYbdHxZKImInd3vcI8F8fzZ0Gx6H"
     * }
     *
     * @param Request $request
     * @return ApiToken|\Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $this->authorize('create', ApiToken::class);
        $this->validate($request, ['purpose' => 'required|max:255']);

        $token = new ApiToken;
        $token->owner_id = $request->user()->id;
        $token->purpose = $request->input('purpose');
        $secret = Str::random(32);
        $token->hash = bcrypt($secret);
        $token->save();
        // return the un-hashed token only this time
        $token->setAttribute('token', $secret);

        if ($this->isAutomatedRequest()) {
            return $token;
        }

        return $this->fuzzyRedirect()->with('token', $token);
    }

    /**
     * Removes the specified API token.
     *
     * @api {delete} api-tokens/:id Delete an API token
     * @apiGroup Api Tokens
     * @apiName DestroyApiTokens
     * @apiPermission user
     * @apiDescription A user can only destroy their own API tokens
     *
     * @apiParam {Number} id The API token ID
     *
     * @param Request $request
     * @param  int  $id
     * @return \Illuminate\Http\RedirectResponse|null
     */
    public function destroy(Request $request, $id)
    {
        $token = ApiToken::findOrFail($id);

        if ($request->user()->can('destroy', $token)) {
            $token->delete();

            if (!$this->isAutomatedRequest()) {
                return $this->fuzzyRedirect()->with('deleted', true);
            }
        } else {
            // Dont't disclose existing token IDs to other users.
            abort(Response::HTTP_NOT_FOUND);
        }
    }
}
