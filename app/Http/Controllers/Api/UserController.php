<?php namespace Dias\Http\Controllers\Api;

use Illuminate\Contracts\Auth\Guard;
use Illuminate\Contracts\Auth\Registrar;
use Illuminate\Http\Request;
use Hash;

use Dias\User;

class UserController extends Controller {

	/**
	 * Creates a new UserController instance.
	 * 
	 * @param Guard $auth
	 * @param Request $request
	 */
	public function __construct(Guard $auth, Request $request)
	{
		parent::__construct($auth, $request);

		$this->middleware('admin', ['except' => [
			'find',
			'index',
			'show',
			'showOwn',
			'updateOwn',
			'destroyOwn',
		]]);

		$this->middleware('session', ['except' => [
			'find',
			'index',
			'show',
			'showOwn'
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
		if (\DB::connection() instanceof \Illuminate\Database\PostgresConnection)
		{
			$operator = 'ilike';
		}
		else
		{
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
		return $this->requireNotNull(User::find($id));
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
		if ($id == $this->user->id)
		{
			abort(400, 'The own user cannot be updated using this endpoint.');
		}

		$request = $this->request;

		$user = $this->requireNotNull(User::find($id));
		$this->validate($request, $user->updateRules());

		if ($request->has('password'))
		{
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
	 * @apiParam (Attributes that can be updated) {String} email The new email address of the user. Must be unique for all users.
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

		if ($request->has('password'))
		{
			// the user has to provide their old password to set a new one
			if (!Hash::check($request->input('old_password'), $user->password))
			{
				$errors = array(
					'old_password' => array(
						trans('validation.custom.old_password')
					)
				);
				return $this->buildFailedValidationResponse($request, $errors);
			}

			$user->password = bcrypt($request->input('password'));
		}

		$user->firstname = $request->input('firstname', $user->firstname);
		$user->lastname = $request->input('lastname', $user->lastname);
		$user->email = $request->input('email', $user->email);
		$user->save();

		if (!static::isAutomatedRequest($request))
		{
			return redirect()->back()
				->with('message', 'Saved.')
				->with('messageType', 'success');
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
	 * @param Registrar $registrar
	 * @return User
	 */
	public function store(Registrar $registrar)
	{
		$validator = $registrar->validator($this->request->all());

		if ($validator->fails())
		{
			$this->throwValidationException(
				$this->request, $validator
			);
		}

		return $registrar->create($this->request->all());
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
		if ($id == $this->user->id)
		{
			abort(400, 'The own user cannot be deleted using this endpoint.');
		}

		$user = $this->requireNotNull(User::find($id));
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
	public function destroyOwn(Guard $auth)
	{
		$user = $this->user;
		$auth->logout();
		// delete the user AFTER logging them out, otherwise logout would save
		// them again
		$user->delete();

		if ($this->request->ajax())
		{
			return response('Deleted.', 200);
		}

		return redirect()->route('home');
	}
}
