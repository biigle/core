<?php namespace Dias\Http\Controllers\Views;

use Dias\Http\Controllers\AdvancedController;
use Dias\Services\Modules;

use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;

abstract class Controller extends AdvancedController {

	/**
	 * Te modules registry object.
	 * @var Modules
	 */
	protected $modules;

	/**
	 * Creates a new ApiController instance.
	 * 
	 * @param Guard $auth
	 * @param Request $request
	 * @param Modules $modules
	 */
	public function __construct(Guard $auth, Request $request, Modules $modules)
	{
		parent::__construct($auth, $request);
		$this->modules = $modules;
	}

}
