<?php

namespace Dias\Http\Controllers\Api;

use Illuminate\Http\Request;
use Dias\ApiToken;

class ApiTokenController extends Controller
{
    /**
     * Creates a new ApiTokenController instance.
     *
     * @param Request $request
     */
    public function __construct(Request $request)
    {
        parent::__construct($request);

        $this->middleware('session', ['only' => [
            'store',
        ]]);
    }

    /**
     * Shows a list of all API tokens belonging to the authenticated user
     *
     * @api {get} api-tokens Get all API tokens
     * @apiGroup ApiTokens
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
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return $this->user->apiTokens;
    }

    /**
     * Creates a new API token.
     *
     * @api {post} api-tokens Create a new API token
     * @apiGroup ApiTokens
     * @apiName StoreApiTokens
     * @apiPermission user
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
     * @return \Illuminate\Http\Response
     */
    public function store()
    {
        $this->validate($this->request, ApiToken::$createRules);

        $token = new ApiToken;
        $token->owner_id = $this->user->id;
        $token->purpose = $this->request->input('purpose');
        $secret = str_random(32);
        $token->hash = bcrypt($secret);
        $token->save();
        // return the un-hashed token only this time
        $token->setAttribute('token', $secret);

        if (!static::isAutomatedRequest($this->request)) {
            return redirect()->back()->with('token', $token);
        }

        return $token;
    }

    /**
     * Removes the specified API token.
     *
     * @api {delete} api-tokens/:id Delete an API token
     * @apiGroup ApiTokens
     * @apiName DestroyApiTokens
     * @apiPermission user
     * @apiDescription A user can only destroy their own API tokens
     *
     * @apiParam {Number} id The API token ID
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $token = ApiToken::findOrFail($id);

        // IDs are automatically casted to ints by Eloquent
        if ((int) $token->owner_id === $this->user->id) {
            $token->delete();

            if (!static::isAutomatedRequest($this->request)) {
                return redirect()->back()->with('deleted', true);
            }
        } else {
            // dont't disclose existing token IDs to other users
            abort(404);
        }
    }
}
