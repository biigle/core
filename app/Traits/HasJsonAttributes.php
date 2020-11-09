<?php

namespace Biigle\Traits;

use Arr;

trait HasJsonAttributes
{
    /**
     * Set a dynamic JSON attribute.
     *
     * @param string $key Key of the attribute in the JSON.
     * @param mixed $value Value of the attribute in the JSON.
     * @param string $attrs Name of the JSON column of the model.
     */
    protected function setJsonAttr($key, $value, $attrs = 'attrs')
    {
        $a = $this->{$attrs} ?: [];

        if ($value === null) {
            Arr::forget($a, $key);
        } else {
            Arr::set($a, $key, $value);
        }

        $this->{$attrs} = $a ?: null;
    }

    /**
     * Get a dynamic JSON attribute.
     *
     * @param string $key Key of the attribute in the JSON.
     * @param mixed $default Default value.
     * @param string $attrs Name of the JSON column of the model.
     *
     * @return mixed
     */
    protected function getJsonAttr($key, $default = null, $attrs = 'attrs')
    {
        return Arr::get($this->{$attrs}, $key, $default);
    }
}
