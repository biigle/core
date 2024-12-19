<?php

$router->group([
    'namespace' => 'Api',
    'prefix' => 'api/v1',
    'middleware' => ['api', 'auth:web,api', 'can:sudo'],
], function ($router) {
    $router->get('export/users', 'Export\UserExportController@show');
    $router->get('export/label-trees', 'Export\LabelTreeExportController@show');
    $router->get('export/volumes', 'Export\VolumeExportController@show');

    $router->resource('import', 'Import\ImportController', [
        'only' => ['store', 'update', 'destroy'],
    ]);
});

$router->group([
    'namespace' => 'Api',
    'prefix' => 'api/v1',
    'middleware' => ['api', 'auth:web,api'],
], function ($router) {
    $router->get('public-export/label-trees/{id}', [
        'as' => 'get-public-label-tree-export',
        'uses' => 'Export\PublicLabelTreeExportController@show',
    ]);

    $router->post('label-trees/import', [
        'uses' => 'Import\PublicLabelTreeImportController@store',
    ]);
});

$router->group([
    'namespace' => 'Views',
    'middleware' => ['auth', 'can:sudo'],
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

$router->group([
    'namespace' => 'Views',
    'middleware' => ['auth'],
], function ($router) {
    $router->get('label-trees/import', [
        'as' => 'label-tree-import-index',
        'uses' => 'PublicLabelTreeImportController@index',
    ]);
});
