<?php

namespace Biigle\Services\LabelSourceAdapters;

use App;
use Biigle\Services\LabelSourceAdapters\WormsAdapter;
use Biigle\Tests\LabelTest;
use Biigle\Tests\LabelTreeTest;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;
use Mockery;
use SoapClient;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;
use TestCase;

class WormsAdapterTest extends TestCase
{
    protected $wormsResponse;

    public function setUp(): void
    {
        parent::setUp();
        $this->wormsResponse = [
            (object) [
                'AphiaID' => 124731,
                'url' => 'http://www.marinespecies.org/aphia.php?p=taxdetails&id=124731',
                'scientificname' => 'Kolga hyalina',
                'rank' => 'Species',
                'status' => 'accepted',
                'kingdom' => 'Animalia',
                'phylum' => 'Echinodermata',
                'class' => 'Holothuroidea',
                'order' => 'Elasipodida',
                'family' => 'Elpidiidae',
                // is not raeally null but we want to test if this is omitted later
                'genus' => null,
            ],
            (object) [
                // should not be returned
                'AphiaID' => 124732,
                'url' => 'http://www.marinespecies.org/aphia.php?p=taxdetails&id=124731',
                'scientificname' => 'Kolga hyalina',
                'rank' => 'Species',
                'status' => 'unaccepted',
                'kingdom' => 'Animalia',
                'phylum' => 'Echinodermata',
                'class' => 'Holothuroidea',
                'order' => 'Elasipodida',
                'family' => 'Elpidiidae',
                'genus' => null,
            ],
        ];
    }

    public function testRegister()
    {
        $this->assertInstanceOf(WormsAdapter::class, App::make("Biigle\Services\LabelSourceAdapters\WormsAdapter"));
    }

    public function testFind()
    {
        $mock = Mockery::mock(SoapClient::class);
        $mock->shouldReceive('getAphiaRecords')
            ->once()
            ->with('%Kolga%', null, null, true, 1)
            ->andReturn($this->wormsResponse);

        $adapter = new WormsAdapter;
        $adapter->setSoapClient($mock);

        $request = new Request;
        $request->merge(['query' => 'Kolga']);

        $results = $adapter->find($request);

        $expect = [[
            'aphia_id' => 124731,
            'name' => 'Kolga hyalina',
            'url' => 'http://www.marinespecies.org/aphia.php?p=taxdetails&id=124731',
            'rank' => 'Species',
            'accepted' => true,
            'parents' => [
                'Animalia',
                'Echinodermata',
                'Holothuroidea',
                'Elasipodida',
                'Elpidiidae',
            ],
        ]];

        $this->assertEquals($expect, $results);
    }

    public function testFindAccepted()
    {
        $mock = Mockery::mock(SoapClient::class);
        $mock->shouldReceive('getAphiaRecords')
            ->once()
            ->with('%Kolga%', null, null, true, 1)
            ->andReturn($this->wormsResponse);

        $adapter = new WormsAdapter;
        $adapter->setSoapClient($mock);

        $request = new Request;
        $request->merge(['query' => 'Kolga', 'unaccepted' => true]);

        $results = $adapter->find($request);
        $this->assertCount(2, $results);
    }

    public function testFindEmpty()
    {
        $mock = Mockery::mock(SoapClient::class);
        $mock->shouldReceive('getAphiaRecords')->never();
        $adapter = new WormsAdapter;
        $adapter->setSoapClient($mock);
        $request = new Request;
        $results = $adapter->find($request);
        $this->assertEquals([], $results);
    }

    public function testFindThrowException()
    {

        $mock = Mockery::mock(SoapClient::class);
        $mock->shouldReceive('getAphiaRecords')
            ->once()
            ->andThrow(new \SoapFault);

        $adapter = new WormsAdapter;
        $adapter->setSoapClient($mock);

        $request = new Request;
        $request->merge(['query' => 'Kolga']);

        try {
            $adapter->find($request);
            $this->assertFalse(true);
        } catch (ServiceUnavailableHttpException $e) {
            $this->assertEquals('The WoRMS server is currently unavailable.', $e->getMessage());
        }
    }

    public function testCreateNormal()
    {
        $tree = LabelTreeTest::create();
        $label = LabelTest::create(['label_tree_id' => $tree->id]);

        // checks if the aphia id exists
        $mock = Mockery::mock(SoapClient::class);
        $mock->shouldReceive('getAphiaNameByID')
            ->once()
            ->with(124731000)
            ->andReturn(null);

        $mock->shouldReceive('getAphiaNameByID')
            ->once()
            ->with(124731)
            ->andReturn('Kolga hyalina');

        $adapter = new WormsAdapter;
        $adapter->setSoapClient($mock);

        $request = new Request;
        $request->merge([
            'name' => 'My Kolga',
            'color' => 'bada55',
            'source_id' => 124731000,
            'label_source_id' => 1,
            'parent_id' => $label->id,
        ]);

        try {
            $labels = $adapter->create($tree->id, $request);
            $this->assertTrue(false);
        } catch (ValidationException $e) {
            $this->assertEquals(['source_id' => ['The AphiaID does not exist.']], $e->errors());
        }

        $request->merge([
            'source_id' => 124731,
        ]);

        $labels = $adapter->create($tree->id, $request);
        $this->assertTrue($tree->labels()->where('id', $labels[0]->id)->exists());
        $this->assertEquals('My Kolga', $labels[0]->name);
        $this->assertEquals('bada55', $labels[0]->color);
        $this->assertEquals('124731', $labels[0]->source_id);
        $this->assertEquals(1, $labels[0]->label_source_id);
        $this->assertEquals($label->id, $labels[0]->parent_id);
        $this->assertEquals($tree->id, $labels[0]->label_tree_id);
        $this->assertNotNull($labels[0]->uuid);
    }

    public function testCreateThrowException()
    {
        $tree = LabelTreeTest::create();

        $mock = Mockery::mock(SoapClient::class);
        $mock->shouldReceive('getAphiaNameByID')
            ->once()
            ->andThrow(new \SoapFault);

        $adapter = new WormsAdapter;
        $adapter->setSoapClient($mock);

        $request = new Request;
        $request->merge(['query' => 'Kolga',
            'source_id' => 124731000]);

        try {
            $adapter->create($tree->id, $request);
            $this->assertFalse(true);
        } catch (ServiceUnavailableHttpException $e) {
            $this->assertEquals('The WoRMS server is currently unavailable.', $e->getMessage());
        }
    }

    public function testCreateRoot()
    {
        $tree = LabelTreeTest::create();
        $label = LabelTest::create(['label_tree_id' => $tree->id]);

        // checks if the aphia id exists
        $mock = Mockery::mock(SoapClient::class);
        $mock->shouldReceive('getAphiaNameByID')
            ->once()
            ->with(124731)
            ->andReturn('Kolga hyalina');

        $adapter = new WormsAdapter;
        $adapter->setSoapClient($mock);

        $request = new Request;
        $request->merge([
            'name' => 'My Kolga',
            'color' => 'bada55',
            'source_id' => 124731,
            'label_source_id' => 1,
        ]);

        $labels = $adapter->create($tree->id, $request);
        $this->assertTrue($tree->labels()->where('id', $labels[0]->id)->exists());
    }

    public function testCreateParentRecursiveError()
    {
        $mock = Mockery::mock(SoapClient::class);
        $mock->shouldReceive('getAphiaNameByID')
            ->once()
            ->with(124731)
            ->andReturn('Kolga hyalina');

        $adapter = new WormsAdapter;
        $adapter->setSoapClient($mock);

        $request = new Request;
        $request->merge([
            'source_id' => 124731,
            'parent_id' => 1,
            'recursive' => 'true',
        ]);

        try {
            $labels = $adapter->create(1, $request);
            $this->assertTrue(false);
        } catch (ValidationException $e) {
            $this->assertEquals(['parent_id' => ['The label must not have a parent if it should be created recursively.']], $e->errors());
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

        $mock = Mockery::mock(SoapClient::class);
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

        $adapter = new WormsAdapter;
        $adapter->setSoapClient($mock);

        $request = new Request;
        $request->merge([
            'name' => 'My Kolga',
            'color' => 'bada55',
            'source_id' => 124731,
            'label_source_id' => 1,
            'recursive' => 'true',
        ]);

        $labels = $adapter->create($tree->id, $request);
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
        $this->assertNotNull($parent->uuid);

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
        $this->assertNotNull($child->uuid);
    }
}
