<?php namespace Dias\Http\Controllers\Views;

use Dias\Http\Controllers\Controller as BaseController;
use Illuminate\Contracts\Auth\Guard;

abstract class Controller extends BaseController {

	/**
	 * The currently logged in user.
	 * @var \Dias\User
	 */
	protected $user;

	/**
	 * Creates a new ApiController instance.
	 * 
	 * @param Guard $auth
	 */
	public function __construct(Guard $auth)
	{
		$this->user = $auth->user();
	}

}
