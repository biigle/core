<?php

namespace Biigle\Http\Controllers\Api;

use Hash;
use Biigle\User;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;
use Symfony\Component\HttpKernel\Exception\HttpException;

class UserController extends Controller
{
    /**
     * Creates a new UserController instance.
     */
    public function __construct()
    {
        $this->middleware('session', ['only' => [
            'updateOwn',
            'destroyOwn',
        ]]);

        $this->middleware('can:admin', ['only' => [
            'update',
            'store',
            'destroy',
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
     *       "firstname": "Joe",
     *       "lastname": "User",
     *       "role_id": 2
     *    },
     *    {
     *       "id": 2,
     *       "firstname": "Jane",
     *       "lastname": "User",
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

        return User::select('id', 'firstname', 'lastname', 'role_id')
            ->where('firstname', $operator, "%{$pattern}%")
            ->orWhere('lastname', $operator, "%{$pattern}%")
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
     *       "firstname": "Joe",
     *       "lastname": "User",
     *       "role_id": 2
     *    },
     *    {
     *       "id": 2,
     *       "firstname": "Jane",
     *       "lastname": "User",
     *       "role_id": 2
     *    }
     * ]
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return User::select('id', 'firstname', 'lastname', 'role_id')->get();
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
     *    "firstname": "Joe",
     *    "lastname": "User",
     *    "role_id": 2
     * }
     *
     * @param int $id
     * @return User
     */
    public function show($id)
    {
        return User::select('id', 'firstname', 'lastname', 'role_id')->findOrFail($id);
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
     *    "firstname": "Joe",
     *    "lastname": "User",
     *    "email": "joe@user.com",
     *    "role_id": 2,
     *    "created_at": "2016-04-29 07:20:33",
     *    "updated_at": "2016-04-29 07:20:33",
     *    "role": {
     *       "id": 2,
     *       "name": "editor"
     *    }
     * }
     *
     * @return User
     */
    public function showOwn(Guard $auth)
    {
        return $auth->user();
    }

    /**
     * Updates the attributes of the specified user.
     *
     * @api {put} users/:id Update a user
     * @apiGroup Users
     * @apiName UpdateUsers
     * @apiPermission admin
     *
     * @apiParam {Number} id The user ID.
     *
     * @apiParam (Attributes that can be updated) {String} email The new email address of the user. Must be unique for all users.
     * @apiParam (Attributes that can be updated) {String} password The new password of the user. If this parameter is set, an additional `password_confirmation` parameter needs to be present, containing the same new password.
     * @apiParam (Attributes that can be updated) {String} firstname The new firstname of the user.
     * @apiParam (Attributes that can be updated) {String} lastname The new lastname of the user.
     * @apiParam (Attributes that can be updated) {Number} role_id Global role of the user. If the role should be changed, an additional `auth_password` field is required, containing the password of the global administrator that requests the change.
     *
     * @apiParamExample {String} Request example:
     * email: 'new@example.com'
     * password: 'TotallySecure'
     * password_confirmation: 'TotallySecure'
     * firstname: 'New'
     * lastname: 'Name'
     * role_id: 1
     * auth_password: 'password123'
     *
     * @param Request $request
     * @param Guard $auth
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, Guard $auth, $id)
    {
        if ($id == $auth->user()->id) {
            abort(400, 'The own user cannot be updated using this endpoint.');
        }

        $user = User::findOrFail($id);
        $this->validate($request, $user->updateRules());

        if ($request->has('role_id') || $request->has('email') || $request->has('password')) {
            if (!Hash::check($request->input('auth_password'), $auth->user()->password)) {
                $errors = ['auth_password' => [trans('validation.custom.password')]];

                return $this->buildFailedValidationResponse($request, $errors);
            }
        }

        if ($request->has('password')) {
            // global admins do not need to provide the old password to set a new one
            $user->password = bcrypt($request->input('password'));
        }

        $user->role_id = $request->input('role_id', $user->role_id);
        $user->firstname = $request->input('firstname', $user->firstname);
        $user->lastname = $request->input('lastname', $user->lastname);
        $user->email = $request->input('email', $user->email);
        $user->save();

        if (!static::isAutomatedRequest($request)) {
            if ($request->has('_redirect')) {
                return redirect($request->input('_redirect'))
                    ->with('saved', true);
            }

            return redirect()->back()
                ->with('saved', true);
        }
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
     * @apiParam (Attributes that can be updated) {String} email The new email address of the user. Must be unique for all users. If this parameter is set, an additional `auth_password` needs to be present, containing the user's current password.
     * @apiParam (Attributes that can be updated) {String} password The new password of the user. If this parameter is set, an additional `password_confirmation` parameter needs to be present, containing the same new password, as well as an `auth_password` parameter, containing the old password.
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
     * @param Request $request
     * @param Guard $auth
     * @return \Illuminate\Http\Response
     */
    public function updateOwn(Request $request, Guard $auth)
    {
        // save origin so the settings view can highlight the right form fields
        $request->session()->flash('origin', $request->input('_origin'));

        $user = $auth->user();
        $this->validate($request, $user->updateRules());

        // confirm change of credentials with old password
        if ($request->has('password') || $request->has('email')) {
            // the user has to provide their old password to set a new one
            if (!Hash::check($request->input('auth_password'), $user->password)) {
                $errors = ['auth_password' => [trans('validation.custom.password')]];

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
                ->with('saved', $wasDirty);
        }
    }

    /**
     * Creates a new user.
     *
     * @api {post} users Create a new user
     * @apiGroup Users
     * @apiName StoreUsers
     * @apiPermission admin
     * @apiDescription A new user gets the global role `editor` by default.
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
     *    "firstname": "Joe",
     *    "lastname": "User",
     *    "email": "joe@user.com",
     *    "role_id": 2,
     *    "created_at": "2016-04-29 07:38:51",
     *    "updated_at"; "2016-04-29 07:38:51"
     * }
     *
     * @param Request $request
     * @return User
     */
    public function store(Request $request)
    {
        /*
         * DON'T allow setting the role through this route. The role may only be changed
         * by the update route with admin password confirmation.
         * Else, an attacker might exploit an active session of an admin and create their
         * own admin account. Once they have an admin account and know the password, they
         * can wreak havoc.
         */

        $this->validate($request, User::$createRules);
        $user = new User;
        $user->firstname = $request->input('firstname');
        $user->lastname = $request->input('lastname');
        $user->email = $request->input('email');
        $user->password = bcrypt($request->input('password'));
        $user->save();

        if (static::isAutomatedRequest($request)) {
            return $user;
        }

        if ($request->has('_redirect')) {
            return redirect($request->input('_redirect'))
                ->with('newUser', $user);
        }

        return redirect()->back()
            ->with('newUser', $user);
    }

    /**
     * Removes the specified user.
     *
     * @api {delete} users/:id Delete a user
     * @apiGroup Users
     * @apiName DestroyUsers
     * @apiPermission admin
     * @apiParam (Required parameters) {String} password The password of the global administrator.
     * @apiDescription If the user is the last admin of a project, they cannot be deleted. The admin role needs to be passed on to another member of the project first.
     *
     * @apiParam {Number} id The user ID.
     *
     * @param Request $request
     * @param Guard $auth
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, Guard $auth, $id)
    {
        if ($id == $auth->user()->id) {
            abort(400, 'The own user cannot be deleted using this endpoint.');
        }

        $this->validate($request, User::$deleteRules);

        if (!Hash::check($request->input('password'), $auth->user()->password)) {
            $errors = ['password' => [trans('validation.custom.password')]];

            return $this->buildFailedValidationResponse($request, $errors);
        }

        $user = User::findOrFail($id);

        try {
            $user->checkCanBeDeleted();
        } catch (HttpException $e) {
            return $this->buildFailedValidationResponse(
                $request,
                ['password' => [$e->getMessage()]]
            );
        }

        $user->delete();

        if (static::isAutomatedRequest($request)) {
            return response('Deleted.', 200);
        }

        if ($request->has('_redirect')) {
            return redirect($request->input('_redirect'))
                ->with('deleted', true);
        }

        return redirect()->back()
            ->with('deleted', true);
    }

    /**
     * Removes the own user.
     *
     * @api {delete} users/my Delete the own user
     * @apiGroup Users
     * @apiName DestroyOwnUser
     * @apiPermission user
     * @apiParam (Required parameters) {String} password The password of the user.
     * @apiDescription This action is allowed only by session cookie authentication. If the user is the last admin of a project, they cannot be deleted. The admin role needs to be passed on to another member of the project first.
     *
     * @param Request $request
     * @param Guard $auth
     * @return \Illuminate\Http\Response
     */
    public function destroyOwn(Request $request, Guard $auth)
    {
        $user = $auth->user();

        $this->validate($request, User::$deleteRules);

        if (!Hash::check($request->input('password'), $user->password)) {
            $errors = ['password' => [trans('validation.custom.password')]];

            return $this->buildFailedValidationResponse($request, $errors);
        }

        try {
            $user->checkCanBeDeleted();
        } catch (HttpException $e) {
            return $this->buildFailedValidationResponse(
                $request,
                ['submit' => [$e->getMessage()]]
            );
        }

        auth()->logout();
        // delete the user AFTER logging them out, otherwise logout would save
        // them again
        $user->delete();

        if (static::isAutomatedRequest($request)) {
            return response('Deleted.', 200);
        }

        return redirect('auth/login');
    }
}
