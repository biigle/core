<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\DestroyOwnUser;
use Biigle\Http\Requests\DestroyUser;
use Biigle\Http\Requests\StoreUser;
use Biigle\Http\Requests\UpdateOwnUser;
use Biigle\Http\Requests\UpdateUser;
use Biigle\Role;
use Biigle\User;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Ramsey\Uuid\Uuid;

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
    }

    /**
     * Finds all users with firstnames or lastnames like `$pattern`.
     * Returns the first 10 results.
     *
     * @api {get} users/find/:pattern Find a user
     * @apiGroup Users
     * @apiName FindUsers
     * @apiPermission editor
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
     *       "role_id": 2,
     *       "affiliation": "Ocean Research Centre",
     *    },
     *    {
     *       "id": 2,
     *       "firstname": "Jane",
     *       "lastname": "User",
     *       "role_id": 2,
     *       "affiliation": "Biodtata Mining Group",
     *    }
     * ]
     *
     * @param string $pattern
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function find($pattern)
    {
        $this->authorize('index', User::class);

        return User::select('id', 'firstname', 'lastname', 'role_id', 'affiliation')
            ->where('firstname', 'ilike', "%{$pattern}%")
            ->orWhere('lastname', 'ilike', "%{$pattern}%")
            ->take(10)
            ->get();
    }

    /**
     * Shows a list of all users.
     *
     * @api {get} users Get all users
     * @apiGroup Users
     * @apiName IndexUsers
     * @apiPermission editor
     * @apiDescription Global admins also see the email addresses of the users.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "firstname": "Joe",
     *       "lastname": "User",
     *       "role_id": 2,
     *       "affiliation": "Ocean Research Centre",
     *    },
     *    {
     *       "id": 2,
     *       "firstname": "Jane",
     *       "lastname": "User",
     *       "role_id": 2,
     *       "affiliation": "Biodtata Mining Group",
     *    }
     * ]
     *
     * @param Request $request
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function index(Request $request)
    {
        $this->authorize('index', User::class);

        return User::select('id', 'firstname', 'lastname', 'role_id', 'affiliation')
            ->when($request->user()->can('sudo'), function ($query) {
                $query->addSelect('email');
            })
            ->orderByDesc('id')
            ->get();
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
     *    "role_id": 2,
     *    "affiliation": "Ocean Research Centre",
     * }
     *
     * @param int $id
     * @return User
     */
    public function show($id)
    {
        $this->authorize('index', User::class);

        return User::select('id', 'firstname', 'lastname', 'role_id', 'affiliation')
            ->findOrFail($id);
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
     *    "affiliation": "Ocean Research Centre",
     *    "role_id": 2,
     *    "created_at": "2016-04-29 07:20:33",
     *    "updated_at": "2016-04-29 07:20:33",
     *    "role": {
     *       "id": 2,
     *       "name": "editor"
     *    }
     * }
     *
     * @param Request $request
     * @return User
     */
    public function showOwn(Request $request)
    {
        return $request->user();
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
     * @apiParam (Attributes that can be updated) {String} affiliation The affiliation of the user.
     * @apiParam (Attributes that can be updated) {Number} role_id Global role of the user. If the role should be changed, an additional `auth_password` field is required, containing the password of the global administrator that requests the change.
     * @apiParam (Attributes that can be updated) {Boolean} can_review Determine if the user can review e.g. new user registrations even if they are no global admin. This can only be set for users with the editor role.
     *
     * @apiParamExample {String} Request example:
     * email: 'new@example.com'
     * password: 'TotallySecure'
     * password_confirmation: 'TotallySecure'
     * firstname: 'New'
     * lastname: 'Name'
     * affiliation: 'Biodata Mining Group'
     * role_id: 1
     * auth_password: 'password123'
     *
     * @param UpdateUser $request
     * @return \Illuminate\Http\RedirectResponse|null
     */
    public function update(UpdateUser $request)
    {
        $user = $request->updateUser;

        if ($user->id === $request->user()->id) {
            throw ValidationException::withMessages([
                'id' => ['The own user cannot be updated using this endpoint.'],
            ]);
        }

        if ($request->filled('password')) {
            // global admins do not need to provide the old password to set a new one
            $user->password = bcrypt($request->input('password'));
        }

        $user->role_id = $request->input('role_id', $user->role_id);
        $user->firstname = $request->input('firstname', $user->firstname);
        $user->lastname = $request->input('lastname', $user->lastname);
        $user->email = $request->input('email', $user->email);
        $user->affiliation = $request->input('affiliation', $user->affiliation);
        if ($request->filled('can_review') && $user->role_id === Role::editorId()) {
            $user->canReview = (bool) $request->input('can_review');
        } else {
            $user->canReview = false;
        }

        $user->save();

        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect()->with('saved', true);
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
     * @apiParam (Attributes that can be updated) {String} affiliation The affiliation of the user.
     *
     * @apiParamExample {String} Request example:
     * email: 'new@example.com'
     * password: 'TotallySecure'
     * password_confirmation: 'TotallySecure'
     * firstname: 'New'
     * lastname: 'Name'
     * affiliation: 'Biodata Mining Group'
     * super_user_mode: 0
     *
     * @param UpdateOwnUser $request
     * @return \Illuminate\Http\RedirectResponse|null
     */
    public function updateOwn(UpdateOwnUser $request)
    {
        $user = $request->updateUser;

        if ($request->filled('password')) {
            $user->password = bcrypt($request->input('password'));
        }

        $user->firstname = $request->input('firstname', $user->firstname);
        $user->lastname = $request->input('lastname', $user->lastname);
        $user->email = $request->input('email', $user->email);
        $user->affiliation = $request->input('affiliation', $user->affiliation);
        $wasDirty = $user->isDirty();
        $user->save();

        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect()->with('saved', $wasDirty);
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
     * @apiParam (Optional parameters) {String} uuid The BIIGLE UUID of this user (if they already got one from another BIIGLE instance). If no UUID is given, a new one will be generated.
     * @apiParam (Optional parameters) {String} affiliation The affiliation of the user.
     *
     * @apiParamExample {String} Request example:
     * email: 'new@example.com'
     * password: 'TotallySecure'
     * password_confirmation: 'TotallySecure'
     * firstname: 'New'
     * lastname: 'User'
     * uuid: 'c796ccec-c746-408f-8009-9f1f68e2aa62'
     * affiliation: 'Biodata Mining Group'
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 2,
     *    "firstname": "Joe",
     *    "lastname": "User",
     *    "email": "joe@user.com",
     *    "role_id": 2,
     *    "created_at": "2016-04-29 07:38:51",
     *    "updated_at"; "2016-04-29 07:38:51",
     *    "uuid": "c796ccec-c746-408f-8009-9f1f68e2aa62",
     *    "affiliation": "Biodata Mining Group"
     * }
     *
     * @param StoreUser $request
     * @return User|\Illuminate\Http\RedirectResponse
     */
    public function store(StoreUser $request)
    {
        /*
         * DON'T allow setting the role through this route. The role may only be changed
         * by the update route with admin password confirmation.
         * Else, an attacker might exploit an active session of an admin and create their
         * own admin account. Once they have an admin account and know the password, they
         * can wreak havoc.
         */

        $user = new User;
        $user->firstname = $request->input('firstname');
        $user->lastname = $request->input('lastname');
        $user->email = $request->input('email');
        $user->affiliation = $request->input('affiliation');
        $user->password = bcrypt($request->input('password'));
        $user->role_id = Role::editorId();
        if ($request->filled('uuid')) {
            $user->uuid = $request->input('uuid');
        } else {
            $user->uuid = Uuid::uuid4();
        }

        $user->save();

        if ($this->isAutomatedRequest()) {
            return $user;
        }

        return $this->fuzzyRedirect()->with('newUser', $user);
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
     * @param DestroyUser $request
     * @return \Illuminate\Http\RedirectResponse|null
     */
    public function destroy(DestroyUser $request)
    {
        $user = $request->destroyUser;
        if ($user->id === $request->user()->id) {
            throw ValidationException::withMessages([
                'id' => ['The own user cannot be updated using this endpoint.'],
            ]);
        }

        $user->delete();

        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect()->with('deleted', true);
        }
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
     * @param DestroyOwnUser $request
     * @return \Illuminate\Http\RedirectResponse|null
     */
    public function destroyOwn(DestroyOwnUser $request)
    {
        auth()->logout();
        // delete the user AFTER logging them out, otherwise logout would save
        // them again
        $request->destroyUser->delete();

        if (!$this->isAutomatedRequest()) {
            return redirect('login');
        }
    }
}
