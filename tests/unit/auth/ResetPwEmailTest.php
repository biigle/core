<?php

class ResetPwEmailTest extends TestCase
{
    public function setUp()
    {
        parent::setUp();
        // enable XSRF tokens
        Session::start();
    }

    public function testResetRoute()
    {
        $this->call('GET', '/password/email');
        $this->assertResponseOk();
        $this->call('POST', '/password/email');
        $this->assertResponseStatus(403);
    }

    public function testFieldsRequired()
    {
        $this->call('GET', '/password/email');
        $this->call('POST', '/password/email', [
            '_token'   => Session::getToken(),
        ]);

        $this->assertRedirectedTo('/password/email');
    }

    public function testUserDoesNotExist()
    {
        $this->call('GET', '/password/email');
        $this->call('POST', '/password/email', [
            '_token'  => Session::getToken(),
            'email'   => 'test@test.com',
        ]);
        $this->assertRedirectedTo('/password/email');

        // get response after redirect
        $response = $this->call('GET', '/password/email');
        $this->assertContains('We can&#039;t find a user with that e-mail address.', $response->getContent());
    }

    public function testSubmitSuccess()
    {
        UserTest::create('joe', 'user', 'pw', 'test@test.com')->save();

        $this->call('GET', '/password/email');
        $this->call('POST', '/password/email', [
            '_token'  => Session::getToken(),
            'email'   => 'test@test.com',
        ]);

        $this->assertRedirectedTo('/password/email');
        // get response after redirect
        $response = $this->call('GET', '/password/email');
        $this->assertContains('We have e-mailed your password reset link!', $response->getContent());
    }
}
