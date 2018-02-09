<?php

namespace Biigle\Services;

use App;

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
    private static $viewMixins = [];

    /**
     * The controller mixins of every module.
     *
     * @var array
     */
    private static $controllerMixins = [];

    /**
     * Register view and controller mixins in one step.
     *
     * @param string $module Module name
     * @param array $mixins
     */
    public function register($module, array $mixins)
    {
        if (array_key_exists('controllerMixins', $mixins)) {
            foreach ($mixins['controllerMixins'] as $controller => $mixin) {
                $this->registerControllerMixin($module, $controller, $mixin);
            }
        }

        if (array_key_exists('viewMixins', $mixins)) {
            foreach ($mixins['viewMixins'] as $mixin) {
                $this->registerViewMixin($module, $mixin);
            }
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
        array_set(self::$viewMixins, $view.'.'.$module, []);
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
        return array_get(self::$viewMixins, $view, []);
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
        array_set(self::$controllerMixins, $controller.'.'.$module, $mixin);
    }

    /**
     * Returns all mixins for a controller that were registered by modules.
     *
     * @param string $controller name of the controller
     * @return array
     */
    public function getControllerMixins($controller)
    {
        return array_get(self::$controllerMixins, $controller, []);
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
}
