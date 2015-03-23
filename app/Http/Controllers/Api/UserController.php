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
			'index',
			'show',
			'showOwn',
			'updateOwn',
			'destroyOwn',
		]]);

		$this->middleware('session', ['except' => [
			'index',
			'show',
			'showOwn'
		]]);
	}

	/**
	 * Shows a list of all users.
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
	 * @return User
	 */
	public function showOwn()
	{
		return $this->user;
	}

	/**
	 * Updates the attributes of the specified user.
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
