<?php namespace Dias\Modules\Projects;

use Illuminate\Support\ServiceProvider;

class ProjectsServiceProvider extends ServiceProvider {
	/**
	* Bootstrap the application events.
	*
	* @return void
	*/
	public function boot()
	{
		$this->loadViewsFrom(__DIR__.'/resources/views', 'projects');
	}

	/**
	* Register the service provider.
	*
	* @return void
	*/
	public function register()
	{
		$app = $this->app;
		dd($app);
	}
}