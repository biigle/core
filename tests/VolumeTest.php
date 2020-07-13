<?php

namespace Biigle\Tests\Modules\Reports;

use Biigle\Modules\Reports\Volume;
use Biigle\Tests\VolumeTest as BaseVolumeTest;
use Exception;
use TestCase;

class VolumeTest extends TestCase
{
    public static function create($params = [])
    {
        return Volume::convert(BaseVolumeTest::create($params));
    }

    public function testConvert()
    {
        $volume = BaseVolumeTest::create([
            'attrs' => [Volume::EXPORT_AREA_ATTRIBUTE => [1, 2, 3, 4]],
        ]);
        $reportsVolume = Volume::convert($volume);
        $this->assertEquals($volume->id, $reportsVolume->id);
        $this->assertTrue($reportsVolume instanceof Volume);
        $this->assertEquals(3, $reportsVolume->exportArea[2]);
    }

    public function testExportArea()
    {
        $volume = static::create();
        $volume->exportArea = [10, 20, 30, 40];
        $volume->save();

        $expect = [10, 20, 30, 40];
        $this->assertEquals($expect, $volume->fresh()->exportArea);

        $volume->exportArea = null;
        $volume->save();
        $this->assertNull($volume->fresh()->exportArea);
    }

    public function testExportAreaNotThere()
    {
        $volume = static::create(['attrs' => ['something' => 'else']]);
        // no error is thrown
        $this->assertNull($volume->exportArea);
    }

    public function testExportAreaTooShort()
    {
        $volume = static::create();
        $this->expectException(Exception::class);
        $volume->exportArea = [10];
    }

    public function testExportInvalidType()
    {
        $volume = static::create();
        $this->expectException(Exception::class);
        $volume->exportArea = 'abc';
    }

    public function testExportAreaNoInteger()
    {
        $volume = static::create();
        $this->expectException(Exception::class);
        $volume->exportArea = ['10', 20, 30, 40];
    }
}
