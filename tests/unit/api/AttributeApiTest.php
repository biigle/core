<?php

use Dias\Attribute;

class AttributeApiTest extends ApiTestCase {

	public function testIndex()
	{
		$this->doTestApiRoute('GET', '/api/v1/attributes');

		// api key authentication
		$this->callToken('GET', '/api/v1/attributes', $this->user);
		$this->assertResponseOk();

		// session cookie authentication
		$this->be($this->user);
		$r = $this->call('GET', '/api/v1/attributes');
		$this->assertStringStartsWith('[', $r->getContent());
		$this->assertStringEndsWith(']', $r->getContent());
	}

	public function testShow()
	{
		$this->doTestApiRoute('GET', '/api/v1/attributes/1');

		// api key authentication
		$this->callToken('GET', '/api/v1/attributes/1', $this->user);
		$this->assertResponseOk();

		$r = $this->callToken('GET', '/api/v1/attributes/-1', $this->user);
		$this->assertResponseStatus(404);

		// session cookie authentication
		$this->be($this->user);
		$r = $this->call('GET', '/api/v1/attributes/1');
		$this->assertStringStartsWith('{', $r->getContent());
		$this->assertStringEndsWith('}', $r->getContent());
	}

	public function testStore()
	{
		$this->doTestApiRoute('POST', '/api/v1/attributes');

		// only global admins can create new attributes
		$this->callToken('POST', '/api/v1/attributes', $this->admin);
		$this->assertResponseStatus(401);

		// missing arguments
		$this->callToken('POST', '/api/v1/attributes', $this->globalAdmin);
		$this->assertResponseStatus(422);

		// enum data type is not supported in SQLite
		$this->callToken('POST', '/api/v1/attributes', $this->globalAdmin, array(
			'name' => 'expert',
			'type' => 'own'
		));
		// unsupported type
		$this->assertResponseStatus(422);

		// session cookie authentication
		$this->be($this->globalAdmin);
		$count = Attribute::all()->count();
		$r = $this->call('POST', '/api/v1/attributes', array(
			'_token' => Session::token(),
			'name' => 'expert',
			'type' => 'boolean'
		));
		$this->assertEquals($count + 1, Attribute::all()->count());
		$this->assertStringStartsWith('{', $r->getContent());
		$this->assertStringEndsWith('}', $r->getContent());
	}

	public function testDestroy()
	{
		$attribute = AttributeTest::create();
		$attribute->save();
		$id = $attribute->id;

		$this->doTestApiRoute('DELETE', '/api/v1/attributes/'.$id);

		// only global admins can delete attributes
		$this->callToken('DELETE', '/api/v1/attributes/'.$id, $this->admin);
		$this->assertResponseStatus(401);

		$this->assertNotNull($attribute->fresh());
		$this->callToken('DELETE', '/api/v1/attributes/'.$id, $this->globalAdmin);
		$this->assertResponseOk();
		$this->assertNull($attribute->fresh());

		// session cookie authentication
		$this->be($this->globalAdmin);
		$this->call('DELETE', '/api/v1/attributes/'.$id, array(
			'_token' => Session::token()
		));
		// the attribute doesn't exist any more
		$this->assertResponseStatus(404);

		$attribute = AttributeTest::create();
		$attribute->save();
		$project = ProjectTest::create();
		$project->save();
		$project->attributes()->attach($attribute->id);

		$this->call('DELETE', '/api/v1/attributes/'.$attribute->id, array(
			'_token' => Session::token()
		));
		// attributes in use may not be deleted
		$this->assertResponseStatus(400);
	}
}