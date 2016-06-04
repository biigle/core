<?php

$router->group(['namespace' => 'Views', 'middleware' => 'auth'], function ($router) {
    $router->get('/ate/', [
        'as'   => 'ate',
        'uses' => 'AteController@index',
    ]);
});

Route::get('ate/imgs/{transect}/{filename}', function ($transect, $filename)
{
    $path = storage_path() . '/ate/'.$transect. "/" . $filename;

    if(!File::exists($path)) abort(404);

    $file = File::get($path);
    $type = File::mimeType($path);

    $response = Response::make($file, 200);
    $response->header("Content-Type", $type);

    return $response;
});



$router->group([
    'namespace' => 'Api',
    'prefix' => 'api/v1',
    'middleware' => 'auth.api',
], function ($router) {
    $router->get('transect/{id}/ate/preprocess', [
        'uses' => 'AteController@preprocess',
    ]);
});