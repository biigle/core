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
		// $projectId = uniqid();
		// $I->cantSee($projectId);
		// $I->click('New Project');
		// $I->see('New Project');
		// $I->fillField('name', $projectId);
		// $I->fillField('description', 'test project description');
		// $I->click('Create');
		// $I->see('Project '.$projectId.' created');

		// $I->click('a[title="Show '.$projectId.'"]');
		// $I->click('Delete this project');
		// $I->see('Do you really want to delete this project?');
		// $I->click('Delete');
		// $I->wait(2);
		// $I->see('Project deleted');
		// $I->click('Logout');
	}

	/**
	 * @before loggedIn
	 */
	public function deleteAProjectWithOwnTransects(AcceptanceTester $I)
	{
		// $I->click('a[title="Show Test Project"]');
		// $I->click('Delete this project');
		// $I->see('Do you really want to delete this project?');
		// $I->click('Delete');
		// $I->wait(2);
		// $I->see('One or more transects would be deleted with this project. Do you still want to continue?');
		// $I->click('Yes, delete');
		// $I->wait(2);
		// $I->see('Project deleted');
	}
}