# BIIGLE Label Trees Module

Install the module:

Add the following to the repositories array of your `composer.json`:
```
{
  "type": "vcs",
  "url": "git@github.com:BiodataMiningGroup/biigle-label-trees.git"
}
```

1. Run `php composer.phar require biigle/label-trees`.
2. Run `php artisan vendor:publish --tag=public` to refresh the public assets of this package. Do this for every update of the package.
