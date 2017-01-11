<?php

namespace Biigle\Services;

/**
 * The module registry service.
 */
class Modules
{
    /**
     * The view mixins of every module for every view.
     * @var array
     */
    private static $mixins = [];

    /**
     * Registers a new view mixin of a module for a view.
     * @param string $module name of the module
     * @param string $view name of the view (may be nested in another mixin
     * using the dot notation: e.g. `dashboard.projects`)
     */
    public function addMixin($module, $view)
    {
        array_set(self::$mixins, $view.'.'.$module, []);
    }

    /**
     * Returns all mixins for a view, that were registered by modules.
     *
     * @param string $view name of the view
     * @return array
     */
    public function getMixins($view)
    {
        return array_get(self::$mixins, $view, []);
    }
}
