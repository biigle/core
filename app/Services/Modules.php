<?php namespace Dias\Services;

/**
 * The Dias module registry service.
 */
class Modules {

	/**
	 * The view mixins of every module for every view.
	 * @var array
	 */
	private static $mixins = array();

	/**
	 * Registers a new view mixin of a module for a view.
	 * @param string $module name of the module
	 * @param string $view name of the view
	 */
	public function addMixin($module, $view)
	{
		if (!array_key_exists($view, self::$mixins))
		{
			self::$mixins[$view] = array();
		}

		array_unshift(self::$mixins[$view], $module);
	}

	/**
	 * Returns all mixins for a view, that were registered by modules.
	 * The mixins are already formatted, so they can be called with
	 * `view()` or `@include()`.
	 * @param string $view name of the view
	 * @return array
	 */
	public function getMixins($view)
	{
		if (!array_key_exists($view, self::$mixins))
		{
			return array();
		}

		$mixins = array();

		foreach (self::$mixins[$view] as $module)
		{
			array_push($mixins, $module.'::'.$view);
		}

		return $mixins;
	}
}
