<?php
use \AcceptanceTester;

class NewProjectCest
{

	protected function loggedIn(AcceptanceTester $I)
	{
		$I->amOnPage('/auth/login');
		$I->fillField('email','joe@user.com');
		$I->fillField('password','joespassword');
		$I->click('Login');
	}

	// tests
	/**
	 * @before loggedIn
	 */
	public function addAndDeleteProject(AcceptanceTester $I)
	{
		$projectId = uniqid();
		$I->cantSee($projectId);
		$I->click('New Project');
		$I->see('New Project');
		$I->fillField('name', $projectId);
		$I->fillField('description', 'test project description');
		$I->click('Create');
		$I->see('Project '.$projectId.' created');

		$I->click('a[title="Show '.$projectId.'"]');
		$I->click('Delete project');
		$I->see('Project '.$projectId.' deleted');
	}
}