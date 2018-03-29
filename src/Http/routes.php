<?php

$router->group([
    'namespace' => 'Api',
    'prefix' => 'api/v1',
    'middleware' => ['auth:web,api', 'can:admin'],
], function ($router) {
    $router->get('export/users', 'Export\UserExportController@show');
    $router->get('export/label-trees', 'Export\LabelTreeExportController@show');
    $router->get('export/volumes', 'Export\VolumeExportController@show');
});

$router->group([
    'namespace' => 'Views',
    'middleware' => ['auth', 'can:admin'],
], function ($router) {
    $router->get('admin/export', [
        'as' => 'admin-export',
        'uses' => 'ExportAdminController@index',
    ]);
});
