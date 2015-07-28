<?php

class RegisterTest extends TestCase
{
    public function setUp()
    {
        parent::setUp();
        // enable XSRF tokens
        Session::start();
    }

    public function testRegisterRoute()
    {
        $this->call('GET', '/auth/register');
        $this->assertResponseOk();
        $this->call('POST', '/auth/register');
        $this->assertResponseStatus(403);
    }

    public function testFieldsRequired()
    {
        $this->call('GET', '/auth/register');
        $this->call('POST', '/auth/register', [
            '_token'   => Session::getToken(),
        ]);
        // fields are missing
        $this->assertRedirectedTo('/auth/register');
    }

    public function testPasswordConfirmation()
    {
        $this->call('GET', '/auth/register');
        $this->call('POST', '/auth/register', [
            '_token'    => Session::getToken(),
            'email'     => 'e@ma.il',
            'password'  => 'password',
            'password_confirmation'  => 'drowssap',
            'firstname' => 'a',
            'lastname'  => 'b',
        ]);

$this->assertRedirectedTo('/auth/register');
    }

    public function testRegisterSuccess()
    {
        $this->assertNull(\Dias\User::find(1));

        $this->call('GET', '/auth/register');
        $this->call('POST', '/auth/register', [
            '_token'    => Session::getToken(),
            'email'     => 'e@ma.il',
            'password'  => 'password',
            'password_confirmation'  => 'password',
            'firstname' => 'a',
            'lastname'  => 'b',
        ]);

$this->assertRedirectedTo('/');
        $user = \Dias\User::find(1);
        $this->assertEquals('e@ma.il', $user->email);
    }

    public function testRegisterEmailTaken()
    {
        UserTest::create('joe', 'user', 'pw', 'test@test.com')->save();
        $this->assertEquals(1, \Dias\User::all()->count());

        $this->call('GET', '/auth/register');
        $this->call('POST', '/auth/register', [
            '_token'    => Session::getToken(),
            'email'     => 'test@test.com',
            'password'  => 'password',
            'password_confirmation'  => 'password',
            'firstname' => 'a',
            'lastname'  => 'b',
        ]);

$this->assertRedirectedTo('/auth/register');
        $this->assertEquals(1, \Dias\User::all()->count());
    }

    public function testRegisterWhenLoggedIn()
    {
        $user = UserTest::create();
        $user->save();
        $this->assertEquals(1, \Dias\User::all()->count());
        $this->be($user);

        $this->call('GET', '/auth/register');
        $this->assertRedirectedTo('/');

        $this->call('POST', '/auth/register', [
            '_token'    => Session::getToken(),
            'email'     => 'e@ma.il',
            'password'  => 'password',
            'password_confirmation'  => 'password',
            'firstname' => 'a',
            'lastname'  => 'b',
        ]);

$this->assertRedirectedTo('/');
        $this->assertEquals(1, \Dias\User::all()->count());
    }
}
