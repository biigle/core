<?php

namespace Dias\Http\Controllers\Api;

use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;
use Hash;
use Dias\User;
use Symfony\Component\HttpKernel\Exception\HttpException;

class UserController extends Controller
{
    /**
     * Creates a new UserController instance.
     *
     * @param Request $request
     */
    public function __construct(Request $request)
    {
        parent::__construct($request);

        $this->middleware('admin', ['only' => [
            'update',
            'store',
            'destroy',
        ]]);

        $this->middleware('session', ['except' => [
            'find',
            'index',
            'show',
            'showOwn',
        ]]);
    }

    /**
     * Finds all users with firstnames or lastnames like `$pattern`.
     * Returns the first 10 results.
     *
     * @api {get} users/find/:pattern Find a user
     * @apiGroup Users
     * @apiName FindUsers
     * @apiPermission user
     * @apiDescription Searches for a user with firstname or lastname like `pattern` and returns the first 10 matches.
     *
     * @apiParam {String} pattern Part of the firstname or lastname of the user to search for.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "Joe User",
     *       "role_id": 2
     *    },
     *    {
     *       "id": 2,
     *       "name": "Jane User",
     *       "role_id": 2
     *    }
     * ]
     *
     * @param string $pattern
     * @return \Illuminate\Http\Response
     */
    public function find($pattern)
    {
        if (\DB::connection() instanceof \Illuminate\Database\PostgresConnection) {
            $operator = 'ilike';
        } else {
            $operator = 'like';
        }

        return User::where('firstname', $operator, '%'.$pattern.'%')
            ->orWhere('lastname', $operator, '%'.$pattern.'%')
            ->take(10)
            ->get();
    }

    /**
     * Shows a list of all users.
     *
     * @api {get} users Get all users
     * @apiGroup Users
     * @apiName IndexUsers
     * @apiPermission user
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "Joe User",
     *       "role_id": 2
     *    },
     *    {
     *       "id": 2,
     *       "name": "Jane User",
     *       "role_id": 2
     *    }
     * ]
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return User::all();
    }

    /**
     * Shows the specified user.
     *
     * @api {get} users/:id Get a user
     * @apiGroup Users
     * @apiName ShowUsers
     * @apiPermission user
     *
     * @apiParam {Number} id The user ID.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 1,
     *    "name": "Joe User",
     *    "role_id": 2
     * }
     *
     * @param int $id
     * @return User
     */
    public function show($id)
    {
        return User::findOrFail($id);
    }

    /**
     * Shows the requesting user.
     *
     * @api {get} users/my Get the own user
     * @apiGroup Users
     * @apiName ShowOwnUser
     * @apiPermission user
     * @apiDescription Returns the user making the request.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 1,
     *    "name": "Joe User",
     *    "role_id": 2
     * }
     *
     * @return User
     */
    public function showOwn()
    {
        return $this->user;
    }

    /**
     * Updates the attributes of the specified user.
     *
     * @api {put} users/:id Update a user
     * @apiGroup Users
     * @apiName UpdateUsers
     * @apiPermission admin
     * @apiDescription This action is allowed only by session cookie authentication.
     *
     * @apiParam {Number} id The user ID.
     *
     * @apiParam (Attributes that can be updated) {String} email The new email address of the user. Must be unique for all users.
     * @apiParam (Attributes that can be updated) {String} password The new password of the user. If this parameter is set, an additional `password_confirmation` parameter needs to be present, containing the same new password.
     * @apiParam (Attributes that can be updated) {String} firstname The new firstname of the user.
     * @apiParam (Attributes that can be updated) {String} lastname The new lastname of the user.
     *
     * @apiParamExample {String} Request example:
     * email: 'new@example.com'
     * password: 'TotallySecure'
     * password_confirmation: 'TotallySecure'
     * firstname: 'New'
     * lastname: 'Name'
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update($id)
    {
        if ($id == $this->user->id) {
            abort(400, 'The own user cannot be updated using this endpoint.');
        }

        $request = $this->request;

        $user = User::findOrFail($id);
        $this->validate($request, $user->updateRules());

        if ($request->has('password')) {
            // global admins do not need to provide the old password to set a new
            $user->password = bcrypt($request->input('password'));
        }

        $user->firstname = $request->input('firstname', $user->firstname);
        $user->lastname = $request->input('lastname', $user->lastname);
        $user->email = $request->input('email', $user->email);
        $user->save();
    }

    /**
     * Updates the attributes of the own user.
     *
     * @api {put} users/my Update the own user
     * @apiGroup Users
     * @apiName UpdateOwnUser
     * @apiPermission user
     * @apiDescription This action is allowed only by session cookie authentication.
     *
     *
     * @apiParam (Attributes that can be updated) {String} email The new email address of the user. Must be unique for all users. If this parameter is set, an additional `old_password` needs to be present, containing the user's current password.
     * @apiParam (Attributes that can be updated) {String} password The new password of the user. If this parameter is set, an additional `password_confirmation` parameter needs to be present, containing the same new password, as well as an `old_password` parameter, containing the old password.
     * @apiParam (Attributes that can be updated) {String} firstname The new firstname of the user.
     * @apiParam (Attributes that can be updated) {String} lastname The new lastname of the user.
     *
     * @apiParamExample {String} Request example:
     * email: 'new@example.com'
     * password: 'TotallySecure'
     * password_confirmation: 'TotallySecure'
     * firstname: 'New'
     * lastname: 'Name'
     *
     * @return \Illuminate\Http\Response
     */
    public function updateOwn()
    {
        $request = $this->request;

        $user = $this->user;
        $this->validate($request, $user->updateRules());

        // confirm change of credentials with old password
        if ($request->has('password') || $request->has('email')) {
            // the user has to provide their old password to set a new one
            if (!Hash::check($request->input('old_password'), $user->password)) {
                $errors = ['old_password' => [trans('validation.custom.old_password')]];

                return $this->buildFailedValidationResponse($request, $errors);
            }
        }

        if ($request->has('password')) {
            $user->password = bcrypt($request->input('password'));
        }

        $user->firstname = $request->input('firstname', $user->firstname);
        $user->lastname = $request->input('lastname', $user->lastname);
        $user->email = $request->input('email', $user->email);
        $wasDirty = $user->isDirty();
        $user->save();

        if (!static::isAutomatedRequest($request)) {
            return redirect()->back()
                ->with('saved', $wasDirty)
                ->with('_origin', $request->input('_origin'));
        }
    }

    /**
     * Creates a new user.
     *
     * @api {post} users Create a new user
     * @apiGroup Users
     * @apiName StoreUsers
     * @apiPermission admin
     * @apiDescription This action is allowed only by session cookie authentication. A new user gets the global role `editor` by default.
     *
     * @apiParam (Required parameters) {String} email The email address of the new user. Must be unique for all users.
     * @apiParam (Required parameters) {String} password The password of the new user.
     * @apiParam (Required parameters) {String} password_confirmation The password of the new user again.
     * @apiParam (Required parameters) {String} firstname The firstname of the new user.
     * @apiParam (Required parameters) {String} lastname The lastname of the new user.
     *
     * @apiParamExample {String} Request example:
     * email: 'new@example.com'
     * password: 'TotallySecure'
     * password_confirmation: 'TotallySecure'
     * firstname: 'New'
     * lastname: 'User'
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 2,
     *    "name": "Joe User",
     *    "role_id": 2
     * }
     *
     * @return User
     */
    public function store()
    {
        $this->validate($this->request, User::$registerRules);
        $user = new User;
        $user->firstname = $this->request->input('firstname');
        $user->lastname = $this->request->input('lastname');
        $user->email = $this->request->input('email');
        $user->password = bcrypt($this->request->input('password'));
        $user->save();

        return $user;
    }

    /**
     * Removes the specified user.
     *
     * @api {delete} users/:id Delete a user
     * @apiGroup Users
     * @apiName DestroyUsers
     * @apiPermission admin
     * @apiDescription This action is allowed only by session cookie authentication. If the user is the last admin of a project, they cannot be deleted. The admin role needs to be passed on to another member of the project first.
     *
     * @apiParam {Number} id The user ID.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        if ($id == $this->user->id) {
            abort(400, 'The own user cannot be deleted using this endpoint.');
        }

        $user = User::findOrFail($id);
        $user->delete();

        return response('Deleted.', 200);
    }

    /**
     * Removes the own user.
     *
     * @api {delete} users/my Delete the own user
     * @apiGroup Users
     * @apiName DestroyOwnUser
     * @apiPermission user
     * @apiDescription This action is allowed only by session cookie authentication. If the user is the last admin of a project, they cannot be deleted. The admin role needs to be passed on to another member of the project first.
     *
     * @return \Illuminate\Http\Response
     */
    public function destroyOwn()
    {
        $user = $this->user;

        try {
            $user->checkCanBeDeleted();
        } catch (HttpException $e) {
            return $this->buildFailedValidationResponse(
                $this->request,
                ['submit' => [$e->getMessage()]]
            );
        }

        auth()->logout();
        // delete the user AFTER logging them out, otherwise logout would save
        // them again
        $user->delete();

        if (static::isAutomatedRequest($this->request)) {
            return response('Deleted.', 200);
        }

        return redirect('auth/login');
    }

    /**
     * Generates a new API token.
     *
     * @api {post} users/my/token Generate a new API token
     * @apiDescription This action is allowed only by session cookie authentication.
     * @apiGroup Users
     * @apiName StoreOwnTokenUsers
     * @apiPermission user
     *
     * @return \Illuminate\Http\Response
     */
    public function storeOwnToken()
    {
        $this->user->generateApiKey();
        $this->user->save();

        if (!static::isAutomatedRequest($this->request)) {
            return redirect()->route('settings-tokens')->with('generated', true);
        }
    }

    /**
     * Generates a new API token.
     *
     * @api {delete} users/my/token Revoke an API token
     * @apiDescription This action is allowed only by session cookie authentication.
     * @apiGroup Users
     * @apiName DestroyOwnTokenUsers
     * @apiPermission user
     *
     * @return \Illuminate\Http\Response
     */
    public function destroyOwnToken()
    {
        $this->user->api_key = null;
        $this->user->save();

        if (!static::isAutomatedRequest($this->request)) {
            return redirect()->route('settings-tokens')->with('deleted', true);
        }
    }
}
