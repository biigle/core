<?php

namespace Biigle\Support;

use Closure;
use Illuminate\Filesystem\FilesystemManager as BaseManager;

class FilesystemManager extends BaseManager
{
    /**
     * The registered config resolvers.
     *
     * @var array
     */
    protected $configResolvers = [];

    /**
     * Register a config resolver Closure.
     *
     * @param  \Closure  $callback
     * @return $this
     */
    public function addConfigResolver(Closure $callback)
    {
        $this->configResolvers[] = $callback;

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    protected function getConfig($name)
    {
        foreach ($this->configResolvers as $callback) {
            $config = $callback($name);

            if (is_array($config)) {
                return $config;
            }
        }

        return parent::getConfig($name);
    }
}
