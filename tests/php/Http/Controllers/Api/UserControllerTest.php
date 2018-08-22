<?php

namespace Biigle\Tests\Http\Controllers\Api;

use Auth;
use Hash;
use Session;
use Biigle\User;
use Biigle\Role;
use ApiTestCase;
use Biigle\Tests\UserTest;
use Biigle\Tests\ApiTokenTest;

class UserControllerTest extends ApiTestCase
{
    private function callToken($verb, $route, $user)
    {
        $token = ApiTokenTest::create([
            // 'test_token'
            'hash' => '$2y$10$.rR7YrU9K2ZR4xgPbKs1x.AGUUKIA733CT72eC6I2piTiPY59V7.O',
            'owner_id' => $user->id,
        ]);

        return $this->json($verb, $route, [], [
            'PHP_AUTH_USER' => $user->email,
            'PHP_AUTH_PW' => 'test_token',
        ]);
    }

    public function testIndex()
    {
        $this->doTestApiRoute('GET', '/api/v1/users');

        // everybody can do this
        $user = UserTest::create();
        $this->be($user);
        $this->get('/api/v1/users')
            ->assertStatus(200)
            ->assertExactJson([[
                'id' => $user->id,
                'role_id' => $user->role_id,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname,
                'affiliation' => $user->affiliation,
            ]]);

        // Global admins also see the email address of the users.
        $user->role_id = Role::$admin->id;
        $user->save();
        $this->get('/api/v1/users')->assertJsonFragment(['email' => $user->email]);
    }

    public function testShow()
    {
        $this->doTestApiRoute('GET', '/api/v1/users/'.$this->guest()->id);

        $this->beGuest();
        $response = $this->get('/api/v1/users/'.$this->guest()->id);
        $response->assertStatus(200);

        $this->beGlobalAdmin();
        $user = $this->guest();
        $this->get('/api/v1/users/'.$user->id)
            ->assertStatus(200)
            ->assertExactJson([
                'id' => $user->id,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname,
                'role_id' => $user->role_id,
                'affiliation' => $user->affiliation,
            ]);
    }

    public function testShowOwn()
    {
        $this->doTestApiRoute('GET', '/api/v1/users/my');

        $this->beGuest();
        $response = $this->get('/api/v1/users/my');
        $response->assertStatus(200);

        $this->beGlobalAdmin();
        $response = $this->get('/api/v1/users/my');
        $content = $response->getContent();
        $response->assertStatus(200);
        $this->assertStringStartsWith('{', $content);
        $this->assertStringEndsWith('}', $content);
    }

    public function testUpdateWithToken()
    {
        // api key authentication **is** allowed for this route
        $response = $this->callToken('PUT', '/api/v1/users/'.$this->guest()->id, $this->globalAdmin());
        $response->assertStatus(200);
    }

    public function testUpdate()
    {
        $this->doTestApiRoute('PUT', '/api/v1/users/'.$this->guest()->id);

        $this->beGuest();
        $response = $this->put('/api/v1/users/'.$this->guest()->id);
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->put('/api/v1/users/'.$this->guest()->id);
        $response->assertStatus(403);

        // 'adminpassword'
        $this->globalAdmin()->password = '$2y$10$O/OuPUHuswXD.6LRVUeHueY5hbiFkHVFaPLcdOd.sp3U9C8H9dcJS';
        $this->globalAdmin()->save();
        $this->beGlobalAdmin();

        $response = $this->put('/api/v1/users/'.$this->globalAdmin()->id);
        // the own user cannot be updated via this route
        $response->assertStatus(400);

        // ajax call to get the correct response status
        $response = $this->json('PUT', '/api/v1/users/'.$this->guest()->id, [
            'password' => 'hacked!!',
        ]);
        // no password confirmation
        $response->assertStatus(422);

        $response = $this->json('PUT', '/api/v1/users/'.$this->guest()->id, [
            'password' => 'newpassword',
            'password_confirmation' => 'newpassword',
        ]);
        // changing the email requires the admin password
        $response->assertStatus(422);

        $response = $this->put('/api/v1/users/'.$this->guest()->id, [
            'password' => 'newpassword',
            'password_confirmation' => 'newpassword',
            'auth_password' => 'wrongpassword',
        ])->assertStatus(302);
        // Check disabled flashing of passwords.
        $this->assertNull(old('password'));
        $this->assertNull(old('password_confirmation'));
        $this->assertNull(old('auth_password'));

        $response = $this->json('PUT', '/api/v1/users/'.$this->guest()->id, [
            'password' => 'newpassword',
            'password_confirmation' => 'newpassword',
            'auth_password' => 'wrongpassword',
        ]);
        // wrong password
        $response->assertStatus(422);

        $this->assertFalse(Hash::check('newpassword', $this->guest()->fresh()->password));

        $response = $this->json('PUT', '/api/v1/users/'.$this->guest()->id, [
            'password' => 'newpassword',
            'password_confirmation' => 'newpassword',
            'auth_password' => 'adminpassword',
        ]);
        $response->assertStatus(200);
        $this->assertTrue(Hash::check('newpassword', $this->guest()->fresh()->password));

        // ajax call to get the correct response status
        $response = $this->json('PUT', '/api/v1/users/'.$this->guest()->id, [
            'email' => 'no-mail',
        ]);
        // invalid email format
        $response->assertStatus(422);

        $response = $this->json('PUT', '/api/v1/users/'.$this->guest()->id, [
            'email' => '',
        ]);
        // email must not be empty if it is present
        $response->assertStatus(422);

        $response = $this->json('PUT', '/api/v1/users/'.$this->guest()->id, [
            'email' => 'new@email.me',
        ]);
        // changing the email requires the admin password
        $response->assertStatus(422);

        $response = $this->json('PUT', '/api/v1/users/'.$this->guest()->id, [
            'email' => 'new@email.me',
            'auth_password' => 'wrongpassword',
        ]);
        // wrong password
        $response->assertStatus(422);

        $response = $this->json('PUT', '/api/v1/users/'.$this->guest()->id, [
            'email' => 'new@email.me',
            'auth_password' => 'adminpassword',
        ]);
        $response->assertStatus(200);
        $this->assertEquals('new@email.me', $this->guest()->fresh()->email);

        $response = $this->json('PUT', '/api/v1/users/'.$this->guest()->id, [
            'role_id' => 999,
            'auth_password' => 'adminpassword',
        ]);
        // role does not exist
        $response->assertStatus(422);

        $response = $this->json('PUT', '/api/v1/users/'.$this->guest()->id, [
            'role_id' => Role::$admin->id,
        ]);
        // changing the role requires the admin password
        $response->assertStatus(422);

        $response = $this->json('PUT', '/api/v1/users/'.$this->guest()->id, [
            'role_id' => Role::$admin->id,
            'auth_password' => 'wrongpassword',
        ]);
        // wrong password
        $response->assertStatus(422);

        $this->assertEquals(Role::$editor->id, $this->guest()->fresh()->role_id);

        $response = $this->put('/api/v1/users/'.$this->guest()->id, [
            'role_id' => Role::$admin->id,
            'auth_password' => 'adminpassword',
            '_redirect' => 'settings/profile',
        ]);
        $response->assertRedirect('settings/profile');
        $this->assertEquals(Role::$admin->id, $this->guest()->fresh()->role_id);

        $this->get('/');
        $response = $this->put('/api/v1/users/'.$this->guest()->id, [
            'firstname' => 'jack',
            'lastname' => 'jackson',
            // Also check if password can be nullable.
            'password' => '',
        ]);
        $response->assertRedirect('/');

        $this->assertEquals('jack', $this->guest()->fresh()->firstname);
        $this->assertEquals('jackson', $this->guest()->fresh()->lastname);
        $this->assertNotEquals('', $this->guest()->fresh()->password);
    }

    public function testUpdateEmailCaseInsensitive()
    {
        // 'adminpassword'
        $this->globalAdmin()->password = '$2y$10$O/OuPUHuswXD.6LRVUeHueY5hbiFkHVFaPLcdOd.sp3U9C8H9dcJS';
        $this->globalAdmin()->save();
        $this->beGlobalAdmin();

        $this->editor()->email = 'test@test.com';
        $this->editor()->save();

        $response = $this->json('PUT', '/api/v1/users/'.$this->guest()->id, [
            'email' => 'Test@Test.com',
            'auth_password' => 'adminpassword',
        ]);
        $response->assertStatus(422);

        $response = $this->json('PUT', '/api/v1/users/'.$this->guest()->id, [
            'email' => 'Test2@Test.com',
            'auth_password' => 'adminpassword',
        ]);
        $response->assertStatus(200);
        $this->assertEquals('test2@test.com', $this->guest()->fresh()->email);
    }

    public function testUpdateAffiliation()
    {
        $user = $this->guest();
        $this->beGlobalAdmin();
        $this->putJson("api/v1/users/{$user->id}", ['affiliation' => 'My Company'])
            ->assertStatus(200);

        $this->assertEquals('My Company', $user->fresh()->affiliation);

        $this->putJson("api/v1/users/{$user->id}", ['affiliation' => ''])
            ->assertStatus(200);

        $this->assertNull($user->fresh()->affiliation);
    }

    public function testUpdateRole()
    {
        $user = $this->guest();
        // 'adminpassword'
        $this->globalAdmin()->password = '$2y$10$O/OuPUHuswXD.6LRVUeHueY5hbiFkHVFaPLcdOd.sp3U9C8H9dcJS';
        $this->globalAdmin()->save();
        $this->beGlobalAdmin();
        $this->putJson("api/v1/users/{$user->id}", [
                'role_id' => Role::$guest->id,
                'auth_password' => 'adminpassword',
            ])
            ->assertStatus(422);
        $this->putJson("api/v1/users/{$user->id}", [
                'role_id' => Role::$editor->id,
                'auth_password' => 'adminpassword',
            ])
            ->assertStatus(200);
        $this->assertEquals(Role::$editor->id, $user->fresh()->role_id);
        $this->putJson("api/v1/users/{$user->id}", [
                'role_id' => Role::$expert->id,
                'auth_password' => 'adminpassword',
            ])
            ->assertStatus(422);
        $this->putJson("api/v1/users/{$user->id}", [
                'role_id' => Role::$admin->id,
                'auth_password' => 'adminpassword',
            ])
            ->assertStatus(200);
        $this->assertEquals(Role::$admin->id, $user->fresh()->role_id);
    }

    public function testUpdateOwnWithToken()
    {
        // api key authentication is not allowed for this route
        $response = $this->callToken('PUT', '/api/v1/users/my', $this->guest());
        $response->assertStatus(401);
    }

    public function testUpdateOwn()
    {
        // 'guest-password'
        $this->guest()->password = '$2y$10$X/s/ecsLboxkL7T/WQzI.emOeMDXIFjj2jVXEMAK1im.7IHwT0VWi';
        $this->guest()->save();

        $this->doTestApiRoute('PUT', '/api/v1/users/my');

        $this->beGuest();
        $response = $this->json('PUT', '/api/v1/users/my', [
            'password' => 'hacked!!',
            '_origin' => 'password',
        ]);
        // no password confirmation
        $response->assertStatus(422);
        $response->assertSessionHas('origin', 'password');

        // ajax call to get the correct response status
        $response = $this->json('PUT', '/api/v1/users/my', [
            'email' => 'no-mail',
        ]);
        // invalid email format
        $response->assertStatus(422);

        $response = $this->json('PUT', '/api/v1/users/my', [
            'password' => 'newpassword',
            'password_confirmation' => 'newpassword',
        ]);
        // no auth password provided
        $response->assertStatus(422);

        $response = $this->json('PUT', '/api/v1/users/my', [
            'email' => 'new@email.me',
        ]);
        // no auth password provided either
        $response->assertStatus(422);

        // ajax call to get the correct response status
        $response = $this->json('PUT', '/api/v1/users/my', [
            'password' => 'newpassword',
            'password_confirmation' => 'newpassword',
            'auth_password' => 'guest-password',
            'firstname' => 'jack',
            'lastname' => 'jackson',
            'email' => 'new@email.me',
            '_origin' => 'email',
        ]);
        $response->assertStatus(200);
        $response->assertSessionHas('origin', 'email');

        $user = $this->guest()->fresh();
        $this->assertTrue(Hash::check('newpassword', $user->password));
        $this->assertEquals('jack', $user->firstname);
        $this->assertEquals('jackson', $user->lastname);
        $this->assertEquals('new@email.me', $user->email);
    }

    public function testUpdateOwnEmailCaseInsensitive()
    {
        // 'guest-password'
        $this->guest()->password = '$2y$10$X/s/ecsLboxkL7T/WQzI.emOeMDXIFjj2jVXEMAK1im.7IHwT0VWi';
        $this->guest()->save();
        $this->beGuest();

        $this->editor()->email = 'test@test.com';
        $this->editor()->save();

        $response = $this->json('PUT', '/api/v1/users/my', [
            'email' => 'Test@Test.com',
            'auth_password' => 'guest-password',
        ]);
        $response->assertStatus(422);

        $response = $this->json('PUT', '/api/v1/users/my', [
            'email' => 'Test2@Test.com',
            'auth_password' => 'guest-password',
        ]);
        $response->assertStatus(200);
        $this->assertEquals('test2@test.com', $this->guest()->fresh()->email);
    }

    public function testUpdateOwnAffiliation()
    {
        $this->beGuest();
        $this->putJson("api/v1/users/my", ['affiliation' => 'My Company'])
            ->assertStatus(200);

        $this->assertEquals('My Company', $this->guest()->fresh()->affiliation);

        $this->putJson("api/v1/users/my", ['affiliation' => ''])
            ->assertStatus(200);

        $this->assertNull($this->guest()->fresh()->affiliation);
    }

    public function testUpdateOwnSuperUserMode()
    {
        $this->beAdmin();
        $this->putJson("api/v1/users/my", ['super_user_mode' => true])
            ->assertStatus(403);

        $this->assertTrue($this->globalAdmin()->can('sudo'));
        $this->beGlobalAdmin();
        $this->putJson("api/v1/users/my", ['super_user_mode' => false])
            ->assertStatus(200);
        $this->assertFalse($this->globalAdmin()->can('sudo'));
    }

    public function testStoreWithToken()
    {
        // api key authentication **is** allowed for this route
        $this->callToken('POST', '/api/v1/users', $this->globalAdmin())
            ->assertStatus(422);
    }

    public function testStore()
    {
        $this->doTestApiRoute('POST', '/api/v1/users');

        $this->beAdmin();
        $response = $this->post('/api/v1/users', [
            '_token' => Session::token(),
        ]);
        $response->assertStatus(403);

        $this->beGlobalAdmin();
        // ajax call to get the correct response status
        $response = $this->json('POST', '/api/v1/users', [
            'password' => 'newpassword',
            'firstname' => 'jack',
            'lastname' => 'jackson',
            'email' => 'new@email.me',
        ]);
        // no password confirmation
        $response->assertStatus(422);

        $response = $this->json('POST', '/api/v1/users', [
            'password' => 'newpassword',
            'password_confirmation' => 'newpassword',
            'firstname' => 'jack',
            'lastname' => 'jackson',
            'email' => 'new@email.me',
            'affiliation' => 'My Company',
        ]);
        $response->assertStatus(200);

        $newUser = User::find(User::max('id'));
        $this->assertEquals('jack', $newUser->firstname);
        $this->assertEquals('jackson', $newUser->lastname);
        $this->assertEquals('new@email.me', $newUser->email);
        $this->assertEquals('My Company', $newUser->affiliation);
        $this->assertEquals(Role::$editor->id, $newUser->role_id);

        $response = $this->json('POST', '/api/v1/users', [
            'password' => 'newpassword',
            'password_confirmation' => 'newpassword',
            'firstname' => 'jack',
            'lastname' => 'jackson',
            'email' => 'new@email.me',
        ]);
        // email has already been taken
        $response->assertStatus(422);

        $response = $this->post('/api/v1/users', [
            'password' => 'newpassword',
            'password_confirmation' => 'newpassword',
            'firstname' => 'jack',
            'lastname' => 'jackson',
            'email' => 'new2@email.me',
            '_redirect' => 'settings/profile',
        ]);
        $response->assertRedirect('settings/profile');
        $newUser = User::find(User::max('id'));
        $this->assertNull($newUser->affiliation);

        $this->get('/');
        $response = $this->post('/api/v1/users', [
            'password' => 'newpassword',
            'password_confirmation' => 'newpassword',
            'firstname' => 'jack',
            'lastname' => 'jackson',
            'email' => 'new3@email.me',
        ]);
        $response->assertRedirect('/');
    }

    public function testStoreUuid()
    {
        $this->beGlobalAdmin();
        $this->json('POST', '/api/v1/users', [
            'password' => 'password',
            'password_confirmation' => 'password',
            'firstname' => 'jack',
            'lastname' => 'jackson',
            'email' => 'new@email.me',
            'uuid' => '',
        ])->assertStatus(200);

        $user = User::where('email', 'new@email.me')->first();
        $this->assertNotNull($user->uuid);

        $this->json('POST', '/api/v1/users', [
            'password' => 'password',
            'password_confirmation' => 'password',
            'firstname' => 'jack',
            'lastname' => 'jackson',
            'email' => 'new2@email.me',
            'uuid' => 'c796ccec-c746-308f-8009-9f1f68e2aa62',
        ])->assertStatus(200);

        $user = User::where('email', 'new2@email.me')->first();
        $this->assertEquals('c796ccec-c746-308f-8009-9f1f68e2aa62', $user->uuid);

        $this->json('POST', '/api/v1/users', [
            'password' => 'password',
            'password_confirmation' => 'password',
            'firstname' => 'jack',
            'lastname' => 'jackson',
            'email' => 'new2@email.me',
            // Invalid UUID
            'uuid' => 'c796ccec-zzzz-308f-8009-9f1f68e2aa62',
        ])->assertStatus(422);
    }

    public function testStoreEmailCaseInsensitive()
    {
        $this->beGlobalAdmin();

        $this->editor()->email = 'test@test.com';
        $this->editor()->save();

        $response = $this->json('POST', '/api/v1/users', [
            'password' => 'newpassword',
            'password_confirmation' => 'newpassword',
            'firstname' => 'jack',
            'lastname' => 'jackson',
            'email' => 'Test@Test.com',
        ]);
        $response->assertStatus(422);

        $this->assertFalse(User::where('email', 'test2@test.com')->exists());

        $response = $this->json('POST', '/api/v1/users', [
            'password' => 'newpassword',
            'password_confirmation' => 'newpassword',
            'firstname' => 'jack',
            'lastname' => 'jackson',
            'email' => 'Test2@Test.com',
        ]);
        $response->assertStatus(200);
        $this->assertTrue(User::where('email', 'test2@test.com')->exists());
    }

    public function testDestroyWithToken()
    {
        // api key authentication **is** allowed for this route
        $response = $this->callToken('DELETE', '/api/v1/users/'.$this->guest()->id, $this->globalAdmin());
        $response->assertStatus(422);
    }

    public function testDestroy()
    {
        // 'globalAdmin-password'
        $this->globalAdmin()->password = '$2y$10$44FMBIkBS2hNhI09ep6UMen7fDT4/RuQKNtDTOPRCvhQxg2H0TXIm';
        $this->globalAdmin()->save();

        $id = $this->guest()->id;
        $this->doTestApiRoute('DELETE', '/api/v1/users/'.$id);

        $this->beAdmin();
        $response = $this->delete('/api/v1/users/'.$id, [
            '_token' => Session::token(),
        ]);
        $response->assertStatus(403);

        $this->beGlobalAdmin();

        $response = $this->delete('/api/v1/users/'.$this->globalAdmin()->id, [
            '_token' => Session::token(),
        ]);
        // the own user cannot be deleted via this route
        $response->assertStatus(400);

        $response = $this->json('DELETE', '/api/v1/users/'.$id);
        // admin password is required
        $response->assertStatus(422);

        $response = $this->json('DELETE', '/api/v1/users/'.$id, [
            'password' => 'wrong-password',
        ]);
        // admin password is wrong
        $response->assertStatus(422);

        $this->assertNotNull($this->guest()->fresh());
        $response = $this->json('DELETE', '/api/v1/users/'.$id, [
            'password' => 'globalAdmin-password',
        ]);
        $response->assertStatus(200);
        $this->assertNull($this->guest()->fresh());

        $response = $this->delete('/api/v1/users/'.$this->editor()->id, [
            'password' => 'globalAdmin-password',
            '_redirect' => 'settings/profile',
        ]);
        $response->assertRedirect('settings/profile');
        $response->assertSessionHas('deleted', true);
        $this->assertNull($this->editor()->fresh());

        // remove creator, so admin is the last remaining admin of the project
        $this->project()->removeUserId($this->project()->creator->id);
        $response = $this->json('DELETE', '/api/v1/users/'.$this->admin()->id, [
            'password' => 'globalAdmin-password',
        ]);
        // last remaining admin of a project mustn't be deleted
        $response->assertStatus(422);
    }

    public function testDestroyOwnWithToken()
    {
        // api key authentication is not allowed for this route
        $response = $this->callToken('DELETE', '/api/v1/users/my', $this->guest());
        $response->assertStatus(401);
    }

    public function testDestroyOwn()
    {
        // 'guest-password'
        $this->guest()->password = '$2y$10$X/s/ecsLboxkL7T/WQzI.emOeMDXIFjj2jVXEMAK1im.7IHwT0VWi';
        $this->guest()->save();
        // 'editor-password'
        $this->editor()->password = '$2y$10$2BwVwEw1AOzWx01twMmHg.FHp5N/TrK1X0KtHxRH0MN5CRrpc6k46';
        $this->guest()->save();

        $this->doTestApiRoute('DELETE', '/api/v1/users/my');

        $this->beGuest();
        // ajax call to get the correct response status
        $response = $this->json('DELETE', '/api/v1/users/my');
        // no password provided
        $response->assertStatus(422);

        // ajax call to get the correct response status
        $response = $this->json('DELETE', '/api/v1/users/my', [
            'password' => 'wrong-password',
        ]);
        // wrong password provided
        $response->assertStatus(422);

        $this->assertNotNull($this->guest()->fresh());
        // ajax call to get the correct response status
        $response = $this->json('DELETE', '/api/v1/users/my', [
            'password' => 'guest-password',
        ]);
        $response->assertStatus(200);
        $this->assertNull($this->guest()->fresh());

        $this->beEditor();
        $response = $this->delete('/api/v1/users/my', [
            'password' => 'editor-password',
        ]);
        $response->assertRedirect('login');
        $this->assertNull(Auth::user());

        $response = $this->json('DELETE', '/api/v1/users/my');
        // deleted user doesn't have permission any more
        $response->assertStatus(401);

        $this->beAdmin();
        // make admin the only admin
        $this->project()->creator->delete();
        $this->get('settings/profile');
        $response = $this->delete('/api/v1/users/my', [
            '_token' => Session::token(),
        ]);
        // couldn't be deleted, returns with error message
        $response->assertRedirect('settings/profile');
        $this->assertNotNull(Auth::user());
        $response->assertSessionHas('errors');
    }

    public function testFind()
    {
        $user = UserTest::create([
            'firstname' => 'abc',
            'lastname' => 'def',
            'affiliation' => 'Company',
        ]);
        UserTest::create(['firstname' => 'abc', 'lastname' => 'ghi']);

        $this->doTestApiRoute('GET', '/api/v1/users/find/a');

        $this->beGuest();
        $this->get('/api/v1/users/find/a')
            ->assertStatus(200)
            ->assertJsonFragment(['firstname' => 'abc'])
            ->assertJsonFragment(['affiliation' => 'Company'])
            ->assertJsonFragment(['lastname' => 'def'])
            ->assertJsonFragment(['lastname' => 'ghi']);

        $response = $this->get('/api/v1/users/find/d')
            ->assertStatus(200)
            ->assertJsonFragment(['firstname' => 'abc'])
            ->assertJsonFragment(['lastname' => 'def'])
            ->assertJsonMissing(['lastname' => 'ghi']);;
    }
}
