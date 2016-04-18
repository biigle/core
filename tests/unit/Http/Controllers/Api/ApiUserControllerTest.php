<?php

use Dias\User;

class ApiUserControllerTest extends ModelWithAttributesApiTest
{
    protected function getEndpoint()
    {
        return '/api/v1/users';
    }

    protected function getModel()
    {
        $model = UserTest::create();

        return $model;
    }

    public function testIndex()
    {
        $this->doTestApiRoute('GET', '/api/v1/users');

        // everybody can do this
        $this->callToken('GET', '/api/v1/users', $this->guest);
        $this->assertResponseOk();

        // session cookie authentication
        $this->be($this->guest);
        $r = $this->call('GET', '/api/v1/users');
        $this->assertResponseOk();
        $this->assertStringStartsWith('[', $r->getContent());
        $this->assertStringEndsWith(']', $r->getContent());
    }

    public function testShow()
    {
        $this->doTestApiRoute('GET', '/api/v1/users/'.$this->guest->id);

        $this->callToken('GET', '/api/v1/users/'.$this->guest->id, $this->guest);
        $this->assertResponseOk();

        $this->be($this->globalAdmin);
        $r = $this->call('GET', '/api/v1/users/'.$this->guest->id);
        $this->assertResponseOk();
        $this->assertStringStartsWith('{', $r->getContent());
        $this->assertStringEndsWith('}', $r->getContent());
    }

    public function testShowOwn()
    {
        $this->doTestApiRoute('GET', '/api/v1/users/my');

        $this->callToken('GET', '/api/v1/users/my', $this->guest);
        $this->assertResponseOk();

        $this->be($this->globalAdmin);
        $r = $this->call('GET', '/api/v1/users/my');
        $this->assertResponseOk();
        $this->assertStringStartsWith('{', $r->getContent());
        $this->assertStringEndsWith('}', $r->getContent());
    }

    public function testUpdate()
    {
        $this->doTestApiRoute('PUT', '/api/v1/users/'.$this->guest->id);
        // api key authentication is not allowed for this route
        $this->callToken('PUT', '/api/v1/users/'.$this->guest->id, $this->guest);
        $this->assertResponseStatus(401);

        $this->callToken('PUT', '/api/v1/users/'.$this->guest->id, $this->globalAdmin);
        $this->assertResponseStatus(401);

        $this->be($this->guest);
        $this->call('PUT', '/api/v1/users/'.$this->guest->id, [
            '_token' => Session::token(),
        ]);
        $this->assertResponseStatus(401);

        $this->be($this->editor);
        $this->call('PUT', '/api/v1/users/'.$this->guest->id, [
            '_token' => Session::token(),
        ]);
        $this->assertResponseStatus(401);

        $this->be($this->globalAdmin);

        $this->call('PUT', '/api/v1/users/'.$this->globalAdmin->id, [
            '_token' => Session::token(),
        ]);
        // the own user cannot be updated via this route
        $this->assertResponseStatus(400);

        // ajax call to get the correct response status
        $this->callAjax('PUT', '/api/v1/users/'.$this->guest->id, [
            '_token' => Session::token(),
            'password' => 'hacked!!',
        ]);
        // no password confirmation
        $this->assertResponseStatus(422);

        // ajax call to get the correct response status
        $this->callAjax('PUT', '/api/v1/users/'.$this->guest->id, [
            '_token' => Session::token(),
            'email' => 'no-mail',
        ]);
        // invalid email format
        $this->assertResponseStatus(422);

        $this->call('PUT', '/api/v1/users/'.$this->guest->id, [
            '_token' => Session::token(),
            'password' => 'newpassword',
            'password_confirmation' => 'newpassword',
            'firstname' => 'jack',
            'lastname' => 'jackson',
            'email' => 'new@email.me',
        ]);
        $this->assertResponseOk();

        $user = $this->guest->fresh();
        $this->assertTrue(Hash::check('newpassword', $user->password));
        $this->assertEquals('jack', $user->firstname);
        $this->assertEquals('jackson', $user->lastname);
        $this->assertEquals('new@email.me', $user->email);
    }

    public function testUpdateOwn()
    {
        $this->guest->password = bcrypt('guest-password');
        $this->guest->save();

        $this->doTestApiRoute('PUT', '/api/v1/users/my');
        // api key authentication is not allowed for this route
        $this->callToken('PUT', '/api/v1/users/my', $this->guest);
        $this->assertResponseStatus(401);

        $this->be($this->guest);
        // ajax call to get the correct response status
        $this->callAjax('PUT', '/api/v1/users/my', [
            '_token' => Session::token(),
            'password' => 'hacked!!',
            '_origin' => 'password',
        ]);
        // no password confirmation
        $this->assertResponseStatus(422);
        $this->assertSessionHas('origin', 'password');

        // ajax call to get the correct response status
        $this->callAjax('PUT', '/api/v1/users/my', [
            '_token' => Session::token(),
            'email' => 'no-mail',
        ]);
        // invalid email format
        $this->assertResponseStatus(422);

        $this->callAjax('PUT', '/api/v1/users/my', [
            '_token' => Session::token(),
            'password' => 'newpassword',
            'password_confirmation' => 'newpassword',
        ]);
        // no old password provided
        $this->assertResponseStatus(422);

        $this->callAjax('PUT', '/api/v1/users/my', [
            '_token' => Session::token(),
            'email' => 'new@email.me',
        ]);
        // no old password provided either
        $this->assertResponseStatus(422);

        // ajax call to get the correct response status
        $this->callAjax('PUT', '/api/v1/users/my', [
            '_token' => Session::token(),
            'password' => 'newpassword',
            'password_confirmation' => 'newpassword',
            'old_password' => 'guest-password',
            'firstname' => 'jack',
            'lastname' => 'jackson',
            'email' => 'new@email.me',
            '_origin' => 'email'
        ]);
        $this->assertResponseOk();
        $this->assertSessionHas('origin', 'email');

        $user = $this->guest->fresh();
        $this->assertTrue(Hash::check('newpassword', $user->password));
        $this->assertEquals('jack', $user->firstname);
        $this->assertEquals('jackson', $user->lastname);
        $this->assertEquals('new@email.me', $user->email);
    }

    public function testStore()
    {
        $this->doTestApiRoute('POST', '/api/v1/users');

        // api key authentication is not allowed for this route
        $this->callToken('POST', '/api/v1/users', $this->globalAdmin);
        $this->assertResponseStatus(401);

        $this->be($this->admin);
        $this->call('POST', '/api/v1/users', [
            '_token' => Session::token(),
        ]);
        $this->assertResponseStatus(401);

        $this->be($this->globalAdmin);
        // ajax call to get the correct response status
        $this->callAjax('POST', '/api/v1/users', [
            '_token' => Session::token(),
            'password' => 'newpassword',
            'firstname' => 'jack',
            'lastname' => 'jackson',
            'email' => 'new@email.me',
        ]);
        // no password confirmation
        $this->assertResponseStatus(422);

        $r = $this->call('POST', '/api/v1/users', [
            '_token' => Session::token(),
            'password' => 'newpassword',
            'password_confirmation' => 'newpassword',
            'firstname' => 'jack',
            'lastname' => 'jackson',
            'email' => 'new@email.me',
        ]);
        $this->assertResponseOk();
        $this->assertStringStartsWith('{', $r->getContent());
        $this->assertStringEndsWith('}', $r->getContent());

        $newUser = User::find(User::max('id'));
        $this->assertEquals('jack', $newUser->firstname);
        $this->assertEquals('jackson', $newUser->lastname);
        $this->assertEquals('new@email.me', $newUser->email);
    }

    public function testDestroy()
    {
        $id = $this->guest->id;
        $this->doTestApiRoute('DELETE', '/api/v1/users/'.$id);

        // api key authentication is not allowed for this route
        $this->callToken('DELETE', '/api/v1/users/'.$id, $this->globalAdmin);
        $this->assertResponseStatus(401);

        $this->be($this->admin);
        $this->call('DELETE', '/api/v1/users/'.$id, [
            '_token' => Session::token(),
        ]);
        $this->assertResponseStatus(401);

        $this->be($this->globalAdmin);

        $this->call('DELETE', '/api/v1/users/'.$this->globalAdmin->id, [
            '_token' => Session::token(),
        ]);
        // the own user cannot be deleted via this route
        $this->assertResponseStatus(400);

        $this->assertNotNull($this->guest->fresh());
        $this->call('DELETE', '/api/v1/users/'.$id, [
            '_token' => Session::token(),
        ]);
        $this->assertResponseOk();
        $this->assertNull($this->guest->fresh());

        // remove creator, so admin is the last remaining admin of the project
        $this->project->removeUserId($this->project->creator->id);
        $this->call('DELETE', '/api/v1/users/'.$this->admin->id, [
            '_token' => Session::token(),
        ]);
        // last remaining admin of a project mustn't be deleted
        $this->assertResponseStatus(400);
    }

    public function testDestroyOwn()
    {
        $this->guest->password = bcrypt('guest-password');
        $this->guest->save();
        $this->editor->password = bcrypt('editor-password');
        $this->guest->save();

        $this->doTestApiRoute('DELETE', '/api/v1/users/my');

        // api key authentication is not allowed for this route
        $this->callToken('DELETE', '/api/v1/users/my', $this->guest);
        $this->assertResponseStatus(401);

        $this->be($this->guest);
        // ajax call to get the correct response status
        $this->callAjax('DELETE', '/api/v1/users/my', [
            '_token' => Session::token(),
        ]);
        // no password provided
        $this->assertResponseStatus(422);

        // ajax call to get the correct response status
        $this->callAjax('DELETE', '/api/v1/users/my', [
            '_token' => Session::token(),
            'password' => 'wrong-password'
        ]);
        // wrong password provided
        $this->assertResponseStatus(422);

        $this->assertNotNull($this->guest->fresh());
        // ajax call to get the correct response status
        $this->callAjax('DELETE', '/api/v1/users/my', [
            '_token' => Session::token(),
            'password' => 'guest-password'
        ]);
        $this->assertResponseOk();
        $this->assertNull($this->guest->fresh());

        $this->be($this->editor);
        $this->call('DELETE', '/api/v1/users/my', [
            '_token' => Session::token(),
            'password' => 'editor-password'
        ]);
        $this->assertRedirectedTo('auth/login');
        $this->assertNull(Auth::user());

        $this->call('DELETE', '/api/v1/users/my', [
            '_token' => Session::token(),
        ]);
        // deleted user doesn't have permission any more
        $this->assertResponseStatus(401);

        $this->be($this->admin);
        // make admin the only admin
        $this->project->creator->delete();
        $this->visit('settings/profile');
        $this->call('DELETE', '/api/v1/users/my', [
            '_token' => Session::token(),
        ]);
        // couldn't be deleted, returns with error message
        $this->assertRedirectedTo('settings/profile');
        $this->assertNotNull(Auth::user());
        $this->assertSessionHas('errors');
    }

    public function testFind()
    {
        $user = UserTest::create(['firstname' => 'abc', 'lastname' => 'def']);
        UserTest::create(['firstname' => 'abc', 'lastname' => 'ghi']);

        $this->doTestApiRoute('GET', '/api/v1/users/find/a');

        $r = $this->callToken('GET', '/api/v1/users/find/a', $this->guest);
        $this->assertResponseOk();

        $this->assertContains('"name":"abc def"', $r->getContent());
        $this->assertContains('"name":"abc ghi"', $r->getContent());

        $this->be($this->guest);
        $r = $this->call('GET', '/api/v1/users/find/d', [
            '_token' => Session::token(),
        ]);
        $this->assertResponseOk();

        $this->assertContains('"name":"abc def"', $r->getContent());
        $this->assertNotContains('"name":"abc ghi"', $r->getContent());
    }

    public function testStoreOwnToken()
    {
        $this->doTestApiRoute('POST', '/api/v1/users/my/token');

        $this->callToken('POST', '/api/v1/users/my/token', $this->user);
        // api key authentication is not allowed for this route
        $this->assertResponseStatus(401);

        $this->be($this->user);
        $this->user->api_key = null;

        $this->callAjax('POST', '/api/v1/users/my/token', [
            '_token' => Session::token(),
        ]);
        $this->assertResponseOk();
        $this->assertNotNull($this->user->api_key);
        $key = $this->user->api_key;

        $r = $this->call('POST', '/api/v1/users/my/token', [
            '_token' => Session::token(),
        ]);
        $this->assertResponseStatus(302);
        // redirect to settings tokens page for form requests
        $this->assertContains('settings/tokens', $r->getContent());
        $this->assertNotEquals($key, $this->user->api_key);
    }

    public function testDestroyOwnToken()
    {
        $this->doTestApiRoute('DELETE', '/api/v1/users/my/token');

        $this->callToken('DELETE', '/api/v1/users/my/token', $this->user);
        // api key authentication is not allowed for this route
        $this->assertResponseStatus(401);

        $this->be($this->user);
        $this->user->generateApiKey();
        $this->callAjax('DELETE', '/api/v1/users/my/token', [
            '_token' => Session::token(),
        ]);
        $this->assertResponseOk();
        $this->assertNull($this->user->api_key);

        $this->user->generateApiKey();
        $r = $this->call('DELETE', '/api/v1/users/my/token', [
            '_token' => Session::token(),
        ]);
        $this->assertResponseStatus(302);
        // redirect to settings tokens page for form requests
        $this->assertContains('settings/tokens', $r->getContent());
        $this->assertNull($this->user->api_key);
    }
}
