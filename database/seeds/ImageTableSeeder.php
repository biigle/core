<?php

use Illuminate\Database\Seeder;
use Dias\Image;

class ImageTableSeeder extends Seeder
{
    public function run()
    {
        DB::table('images')->delete();

        Image::create([
            'filename' => 'IMG_3275.JPG',
            'transect_id' => 1,
        ]);

        Image::create([
            'filename' => 'IMG_3295.JPG',
            'transect_id' => 1,
        ]);

        Image::create([
            'filename' => 'IMG_3353.JPG',
            'transect_id' => 1,
        ]);

        Image::create([
            'filename' => 'IMG_3384.JPG',
            'transect_id' => 1,
        ]);

        Image::create([
            'filename' => 'IMG_3425.JPG',
            'transect_id' => 1,
        ]);

        Image::create([
            'filename' => 'IMG_3523.JPG',
            'transect_id' => 1,
        ]);

        Image::create([
            'filename' => 'IMG_3550.JPG',
            'transect_id' => 1,
        ]);

        Image::create([
            'filename' => 'IMG_3741.JPG',
            'transect_id' => 1,
        ]);

        Image::create([
            'filename' => 'IMG_3850.JPG',
            'transect_id' => 1,
        ]);

        Image::create([
            'filename' => 'IMG_4005.JPG',
            'transect_id' => 1,
        ]);

        Image::create([
            'filename' => 'IMG_4104.JPG',
            'transect_id' => 1,
        ]);

        Image::create([
            'filename' => 'IMG_4256.JPG',
            'transect_id' => 1,
        ]);
    }
}
