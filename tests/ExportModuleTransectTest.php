<?php

use Dias\Modules\Export\Transect;

class ExportModuleTransectTest extends TestCase {

    public static function create($params = [])
    {
        return Transect::convert(TransectTest::create($params));
    }

    public function testConvert()
    {
        $transect = TransectTest::create([
            'attrs' => [Transect::EXPORT_AREA_ATTRIBUTE => [1, 2, 3, 4]]
        ]);
        $exportTransect = Transect::convert($transect);
        $this->assertEquals($transect->id, $exportTransect->id);
        $this->assertTrue($exportTransect instanceof Transect);
        $this->assertEquals(3, $exportTransect->exportArea[2]);
    }

    public function testExportArea()
    {
        $transect = static::create();
        $transect->exportArea = [10, 20, 30, 40];
        $transect->save();

        $expect = [10, 20, 30, 40];
        $this->assertEquals($expect, $transect->fresh()->exportArea);

        $transect->exportArea = null;
        $transect->save();
        $this->assertNull($transect->fresh()->exportArea);
    }

    public function testExportAreaNotThere()
    {
        $transect = static::create(['attrs' => ['something' => 'else']]);
        // no error is thrown
        $this->assertNull($transect->exportArea);
    }

    public function testExportAreaTooShort()
    {
        $transect = static::create();
        $this->setExpectedException('Exception');
        $transect->exportArea = [10];
    }

    public function testExportInvalidType()
    {
        $transect = static::create();
        $this->setExpectedException('Exception');
        $transect->exportArea = 'abc';
    }

    public function testExportAreaNoInteger()
    {
        $transect = static::create();
        $this->setExpectedException('Exception');
        $transect->exportArea = ['10', 20, 30, 40];
    }
}
