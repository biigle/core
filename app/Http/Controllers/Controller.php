<?php namespace Dias\Http\Controllers;

use Illuminate\Foundation\Bus\DispatchesCommands;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Http\Request;

abstract class Controller extends BaseController {

	use DispatchesCommands, ValidatesRequests;

	/**
	 * Create the response for when a request fails validation.
	 * Overwrites the default behavior to except passwords.
	 *
	 * @param  \Illuminate\Http\Request  $request
	 * @param  array  $errors
	 * @return \Illuminate\Http\Response
	 */
	protected function buildFailedValidationResponse(Request $request, array $errors)
	{
		if ($request->ajax())
		{
			return new JsonResponse($errors, 422);
		}

		return redirect()
			->to($this->getRedirectUrl())
         ->withInput($request->except('password', 'password_confirmation'))
			->withErrors($errors);
	}

}
