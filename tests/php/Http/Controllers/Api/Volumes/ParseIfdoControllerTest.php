<?php

namespace Biigle\Tests\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\Tests\ImageTest;
use Illuminate\Http\UploadedFile;

class ParseIfdoControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $this->doTestApiRoute('POST', "/api/v1/volumes/parse-ifdo");

        $this->beUser();
        $this->postJson("/api/v1/volumes/parse-ifdo")
            ->assertStatus(422);

        $file = new UploadedFile(__DIR__."/../../../../../files/image-metadata.csv", 'metadata.csv', 'text/csv', null, true);

        $this->postJson("/api/v1/volumes/parse-ifdo", ['file' => $file])
            ->assertStatus(422);

        $file = new UploadedFile(__DIR__."/../../../../../files/image-ifdo.yaml", 'ifdo.yaml', 'application/yaml', null, true);
        $expect = [
            'name' => 'SO268 SO268-2_100-1_OFOS SO_CAM-1_Photo_OFOS',
            'url' => 'https://hdl.handle.net/20.500.12085/d7546c4b-307f-4d42-8554-33236c577450@data',
            'handle' => '20.500.12085/d7546c4b-307f-4d42-8554-33236c577450',
            'uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
            'media_type' => 'image',
            'files' => [
                ['filename', 'area', 'distance_to_ground', 'gps_altitude', 'lat', 'lng', 'taken_at', 'yaw'],
                ['SO268-2_100-1_OFOS_SO_CAM-1_20190406_042927.JPG', 5.0, 2, -2248.0, 11.8581802, -117.0214864, '2019-04-06 04:29:27.000000', 20],
                ['SO268-2_100-1_OFOS_SO_CAM-1_20190406_052726.JPG', 5.1, 2.1, -4129.6, 11.8582192, -117.0214286, '2019-04-06 05:27:26.000000', 21],
            ],
        ];

        $this->postJson("/api/v1/volumes/parse-ifdo", ['file' => $file])
            ->assertStatus(200)
            ->assertExactJson($expect);
    }
}
