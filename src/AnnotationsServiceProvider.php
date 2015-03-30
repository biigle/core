<?php namespace Dias\Modules\Annotations;

use Illuminate\Support\ServiceProvider;
use Dias\Services\Modules;

class AnnotationsServiceProvider extends ServiceProvider {

	/**
	* Bootstrap the application events.
	*
	* @return void
	*/
	public function boot(Modules $modules)
	{
		$this->loadViewsFrom(__DIR__.'/resources/views', 'annotations');

		$this->publishes([
			__DIR__.'/public/assets' => public_path('vendor/annotations'),
		], 'public');

		include __DIR__.'/Http/routes.php';

		$modules->addMixin('annotations', 'images.index.buttons');
		// $modules->addMixin('transects', 'projects');
	}

	/**
	* Register the service provider.
	*
	* @return void
	*/
	public function register()
	{
		//
	}
}