<?php

namespace Biigle\Services;

use App;
use Arr;
use File;

/**
 * The module registry service.
 */
class Modules
{
    /**
     * The view mixins of every module for every view.
     *
     * @var array
     */
    protected $viewMixins;

    /**
     * The controller mixins of every module.
     *
     * @var array
     */
    protected $controllerMixins;

    /**
     * Additional source paths to generate the API documentation from.
     *
     * @var array
     */
    protected $apidocPaths;

    /**
     * Create a new instance.
     */
    public function __construct()
    {
        $this->viewMixins = [];
        $this->controllerMixins = [];
        $this->apidocPaths = [];
    }

    /**
     * Register module assets in one step.
     *
     * @param string $module Module name
     * @param array $assets
     */
    public function register($module, array $assets)
    {
        if (array_key_exists('controllerMixins', $assets)) {
            foreach ($assets['controllerMixins'] as $controller => $asset) {
                $this->registerControllerMixin($module, $controller, $asset);
            }
        }

        if (array_key_exists('viewMixins', $assets)) {
            foreach ($assets['viewMixins'] as $asset) {
                $this->registerViewMixin($module, $asset);
            }
        }

        if (array_key_exists('apidoc', $assets)) {
            $this->apidocPaths[$module] = $assets['apidoc'];
        }
    }

    /**
     * Registers a new view mixin of a module for a view.
     *
     * @param string $module name of the module
     * @param string $view name of the view (may be nested in another mixin
     * using the dot notation: e.g. `dashboard.projects`)
     */
    public function registerViewMixin($module, $view)
    {
        if (!Arr::has($this->viewMixins, "{$view}.{$module}")) {
            Arr::set($this->viewMixins, "{$view}.{$module}", []);
        }
    }

    /**
     * @deprecated In favor of the more descriptive registerViewMixin.
     */
    public function addMixin($module, $view)
    {
        return $this->registerViewMixin($module, $view);
    }

    /**
     * Returns all mixins for a view that were registered by modules.
     *
     * @param string $view name of the view
     * @return array
     */
    public function getViewMixins($view)
    {
        return Arr::get($this->viewMixins, $view, []);
    }

    /**
     * @deprecated In favor of the more descriptive getViewMixins.
     */
    public function getMixins($view)
    {
        return $this->getViewMixins($view);
    }

    /**
     * Registers a new controller mixin of a module.
     *
     * @param string $module name of the module
     * @param string $controller Name of the controller
     * @param callable $mixin Callback for the controller mixin
     */
    public function registerControllerMixin($module, $controller, $mixin)
    {
        Arr::set($this->controllerMixins, "{$controller}.{$module}", $mixin);
    }

    /**
     * Returns all mixins for a controller that were registered by modules.
     *
     * @param string $controller name of the controller
     * @return array
     */
    public function getControllerMixins($controller)
    {
        return Arr::get($this->controllerMixins, $controller, []);
    }

    /**
     * Call all controller mixins registered for a certain controller.
     *
     * @param string $controller
     * @param array $args
     * @return array
     */
    public function callControllerMixins($controller, $args)
    {
        $mixins = $this->getControllerMixins($controller);
        $returnValues = [];

        foreach ($mixins as $mixin) {
            $values = App::call($mixin, $args) ?: [];
            $returnValues = array_merge($returnValues, $values);
        }

        return $returnValues;
    }

    /**
     * Returns information about all installed BIIGLE modules
     *
     * @return array
     */
    public function getInstalledModules()
    {
        $installed = json_decode(File::get(base_path('vendor/composer/installed.json')), true);

        return array_filter($installed['packages'], fn ($item) => strpos($item['name'], 'biigle/') === 0);
    }

    /**
     * Get the registered apidoc paths of the modules.
     *
     * @return array
     */
    public function getApidocPaths()
    {
        $paths = [];
        foreach ($this->apidocPaths as $module => $p) {
            $paths = array_merge($paths, $p);
        }

        return $paths;
    }
}
