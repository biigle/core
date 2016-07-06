<?php

use Dias\Modules\LabelTrees\Services\LabelSourceAdapters\WormsAdapter;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class LabelTreesModuleServicesLabelSourceAdaptersWormsAdapterTest extends TestCase
{
    public function testRegister()
    {
        $this->assertInstanceOf(
            Dias\Modules\LabelTrees\Services\LabelSourceAdapters\WormsAdapter::class,
            app()->make("Dias\Services\LabelSourceAdapters\WormsAdapter")
        );
    }

    public function testFind()
    {
        $mock = Mockery::mock();
        $mock->shouldReceive('getAphiaRecords')
            ->once()
            ->with('%Kolga%')
            ->andReturn([
                (object) [
                    "AphiaID" => 124731,
                    "url" => "http://www.marinespecies.org/aphia.php?p=taxdetails&id=124731",
                    "scientificname" => "Kolga hyalina",
                    "rank" => "Species",
                    "status" => "accepted",
                    "kingdom" => "Animalia",
                    "phylum" => "Echinodermata",
                    "class" => "Holothuroidea",
                    "order" => "Elasipodida",
                    "family" => "Elpidiidae",
                    // is not raeally null but we want to test if this is omitted later
                    "genus" => null,
                ],
                (object) [
                    // should not be returned
                    "AphiaID" => 124732,
                    "url" => "http://www.marinespecies.org/aphia.php?p=taxdetails&id=124731",
                    "scientificname" => "Kolga hyalina",
                    "rank" => "Species",
                    "status" => "unaccepted",
                    "kingdom" => "Animalia",
                    "phylum" => "Echinodermata",
                    "class" => "Holothuroidea",
                    "order" => "Elasipodida",
                    "family" => "Elpidiidae",
                    "genus" => null,
                ]
            ]);

        $mock->shouldReceive('getAphiaRecords')
            ->once()
            ->with('%%')
            ->andReturn(null);

        app()->singleton(SoapClient::class, function () use ($mock) {
            return $mock;
        });

        $results = with(new WormsAdapter)->find('Kolga');

        $expect = [[
            'aphia_id' => 124731,
            'name' => 'Kolga hyalina',
            'url' => 'http://www.marinespecies.org/aphia.php?p=taxdetails&id=124731',
            'rank' => 'Species',
            'parents' => [
                'Animalia',
                'Echinodermata',
                'Holothuroidea',
                'Elasipodida',
                'Elpidiidae',
            ]
        ]];

        $this->assertEquals($expect, $results);

        $results = with(new WormsAdapter)->find('');
        $this->assertEquals([], $results);
    }

    public function testCreateNormal()
    {
        $tree = LabelTreeTest::create();
        $label = LabelTest::create(['label_tree_id' => $tree->id]);

        // checks if the aphia id exists
        $mock = Mockery::mock();
        $mock->shouldReceive('getAphiaNameByID')
            ->once()
            ->with(124731000)
            ->andReturn(null);

        $mock->shouldReceive('getAphiaNameByID')
            ->once()
            ->with(124731)
            ->andReturn('Kolga hyalina');

        app()->singleton(SoapClient::class, function () use ($mock) {
            return $mock;
        });

        $request = new Request;
        $request->merge([
            'name' => 'My Kolga',
            'color' => 'bada55',
            'source_id' => 124731000,
            'label_source_id' => 1,
            'parent_id' => $label->id,
        ]);

        try {
            $labels = with(new WormsAdapter)->create($tree->id, $request);
            $this->assertTrue(false);
        } catch (ValidationException $e) {
            $this->assertEquals(['source_id' => ['The AphiaID does not exist.']], $e->response);
        }

        $request->merge([
            'source_id' => 124731,
        ]);

        $labels = with(new WormsAdapter)->create($tree->id, $request);
        $this->assertTrue($tree->labels()->where('id', $labels[0]->id)->exists());
        $this->assertEquals('My Kolga', $labels[0]->name);
        $this->assertEquals('bada55', $labels[0]->color);
        $this->assertEquals('124731', $labels[0]->source_id);
        $this->assertEquals(1, $labels[0]->label_source_id);
        $this->assertEquals($label->id, $labels[0]->parent_id);
        $this->assertEquals($tree->id, $labels[0]->label_tree_id);
    }

    public function testCreateParentRecursiveError()
    {
        $mock = Mockery::mock();
        $mock->shouldReceive('getAphiaNameByID')
            ->once()
            ->with(124731)
            ->andReturn('Kolga hyalina');

        app()->singleton(SoapClient::class, function () use ($mock) {
            return $mock;
        });

        $request = new Request;
        $request->merge([
            'source_id' => 124731,
            'parent_id' => 1,
            'recursive' => 'true',
        ]);

        try {
            $labels = with(new WormsAdapter)->create(1, $request);
            $this->assertTrue(false);
        } catch (ValidationException $e) {
            $this->assertEquals(['parent_id' => ['The label must not have a parent if it should be created recursively.']], $e->response);
        }
    }

    public function testCreateRecursive()
    {
        $tree = LabelTreeTest::create();
        $label = LabelTest::create([
            'label_tree_id' => $tree->id,
            'name' => 'Elpidiidae',
            'source_id' => '123191',
            'label_source_id' => 1,
        ]);

        $mock = Mockery::mock();
        $mock->shouldReceive('getAphiaNameByID')
            ->once()
            ->with(124731)
            ->andReturn('Kolga hyalina');

        // simulate a real response from WoRMS getAphiaClassificationByID
        $parents = (object) [
            // this label already exists
            'AphiaID' => 123191,
            'rank' => 'Family',
            'scientificname' => 'Elpidiidae',
            'child' => (object) [
                // this label should be recursively created
                'AphiaID' => 123514,
                'rank' => 'Genus',
                'scientificname' => 'Kolga',
                'child' => (object) [
                    // this label should be created with a custom name
                    'AphiaID' => 124731,
                    'rank' => 'Species',
                    'scientificname' => 'Kolga hyalina',
                    'child' => (object) [],
                ],
            ],
        ];

        $mock->shouldReceive('getAphiaClassificationByID')
            ->once()
            ->with(124731)
            ->andReturn($parents);

        app()->singleton(SoapClient::class, function () use ($mock) {
            return $mock;
        });

        $request = new Request;
        $request->merge([
            'name' => 'My Kolga',
            'color' => 'bada55',
            'source_id' => 124731,
            'label_source_id' => 1,
            'recursive' => 'true',
        ]);

        $labels = with(new WormsAdapter)->create($tree->id, $request);
        $this->assertCount(2, $labels);
        $this->assertEquals(3, $tree->labels()->count());

        $parent = $tree->labels()->where('source_id', 123514)->first();
        $expect = [
            'name' => 'Kolga',
            'label_tree_id' => $tree->id,
            'color' => 'bada55',
            'source_id' => '123514',
            'label_source_id' => 1,
            'parent_id' => $label->id,
            'id' => $label->id + 1,
        ];
        $this->assertEquals($expect, $parent->toArray());

        $child = $tree->labels()->where('source_id', 124731)->first();
        $expect = [
            'name' => 'My Kolga',
            'label_tree_id' => $tree->id,
            'color' => 'bada55',
            'source_id' => '124731',
            'label_source_id' => 1,
            'parent_id' => $parent->id,
            'id' => $parent->id + 1,
        ];
        $this->assertEquals($expect, $child->toArray());
    }
}
