<?php

$router->group([
    'namespace' => 'Api',
    'prefix' => 'api/v1',
    'middleware' => ['auth:web,api', 'can:admin'],
], function ($router) {
    $router->get('export/users', 'Export\UserExportController@show');
    $router->get('export/label-trees', 'Export\LabelTreeExportController@show');
    $router->get('export/volumes', 'Export\VolumeExportController@show');

    $router->resource('import', 'Import\ImportController', [
        'only' => ['store', 'update', 'destroy'],
    ]);
});

$router->group([
    'namespace' => 'Views',
    'middleware' => ['auth', 'can:admin'],
], function ($router) {
    $router->get('admin/export', [
        'as' => 'admin-export',
        'uses' => 'ExportAdminController@index',
    ]);

    $router->get('admin/import', [
        'as' => 'admin-import',
        'uses' => 'ImportAdminController@index',
    ]);

    $router->get('admin/import/{token}', [
        'as' => 'admin-import-show',
        'uses' => 'ImportAdminController@show',
    ]);
});
