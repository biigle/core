@extends('manual.base')
@section('manual-title', 'About Label Trees')

@section('manual-content')
    <div class="row">
        <p class="lead">
            Learn what label trees are and how you can manage them.
        </p>

        <p>
            A label tree is a collection of labels that may be flat or in a tree-like structure. This can be a taxonomy, a custom classification scheme or something entirely different. Label trees can be attached to multiple <a href="{{route('manual-tutorials', ['projects', 'about'])}}">projects</a>. If a label tree is attached to a project, all labels of the label tree are available to be attached to annotations, images or videos in this project.
        </p>
        <div class="panel panel-info">
            <div class="panel-body text-info">
                A label is some kind of semantic category like a habitat classification, a morphotype or taxon for an organism.
            </div>
        </div>
        <p>
            Every user is allowed to create label trees. To create a label tree, click on the <button class="btn btn-default btn-xs"><i class="fa fa-tags"></i> Create Label Tree</button> button on the <a href="{{route('home')}}">dashboard</a> (or <a href="{{route('label-trees-create')}}">here</a>). When you successfully created a label tree you will be redirected to the label tree overview. The overview shows you lists of all labels, projects and users in several tabs that are associated with the label tree, as well as controls to modify the label tree.
        </p>

        <p>
            Label trees can be sorted locally by using the button <button class="btn btn-default"><i class="fas fa-grip-vertical"></i></button> to drag the label tree above and below.
        </p>

        <h3><a name="visibility"></a>Visibility</h3>

        <p>
            A label tree can be either public or private. Public label trees are available to be attached to any project and can be viewed by any user. Private label trees, however, can only be attached to specifically "authorized" projects. If a label tree is private, it is only visible for members of the label tree or for members of any project to which the label tree is attached.
        </p>
        <p>
            The visibility of a label tree can be set when it is created. It can also be changed later by label tree admins. To do this, open the <button class="btn btn-default btn-xs"><i class="fa fa-cog"></i> <span class="caret"></span></button> dropdown menu at the top of the label tree overview and click <button class="btn btn-default btn-xs">Edit</button>. This will activate a select element where you can choose a new visibility. Finally, click <button class="btn btn-success btn-xs">Save</button> to apply the change.
        </p>

        <h3><a name="members"></a>Members</h3>

        <p>
            The labels of a label tree can only be modified by label tree members. Label tree members are listed in the <button class="btn btn-default btn-xs"><i class="fa fa-users"></i> Members</button> tab of the label tree overview. The tab is only visible for label tree admins. Each member has one of two roles: admin or editor. In the <button class="btn btn-default btn-xs"><i class="fa fa-users"></i> Members</button> tab, enter a username and choose a role in the input fields on the right to add a new member. To modify an existing member, hover the mouse over the name. Choose a new user role for existing members to modify them or click the <button class="btn btn-default btn-xs"><i class="fa fa-trash"></i></button> button to remove a member.
        </p>
        <p>
            A label tree <strong>editor</strong> can view the label tree even if it is private. Also, they can create and modify labels of the tree.
        </p>
        <p>
            In addition to everything that an editor can do, <strong>admins</strong> can add or modify label tree members, add or remove authorized projects, edit the label tree name, description and visibility or delete the entire label tree.
        </p>
        <p>
            BIIGLE administrators can create label trees without members. These are special "global" label trees. Global label trees are attached to all new projects by default.
        </p>

        <h3><a name="projects"></a>Projects</h3>

        <p>
            A label tree can be attached to one or more projects. Projects to which the label tree is attached <em>and</em> where you are a member of are listed in the <button class="btn btn-default btn-xs"><i class="fa fa-folder"></i> Projects</button> tab of the label tree overview.  Note that this list might not show you all projects that use the label tree, even if you are admin of the label tree.
        </p>
        <p>
            If a label tree is private, only authorized projects may attach it. Label tree admins can control which projects are authorized and which are not. To add an authorized project, enter the project name in the input field on the right of the <button class="btn btn-default btn-xs"><i class="fa fa-folder"></i> Projects</button> tab and hit enter. You can only authorize a project where you are a member of. Hover the mouse over a project name and click the <button class="btn btn-default btn-xs"><i class="fa fa-trash"></i></button> button to remove authorization for the project. If a label tree is attached to a project of which the authorization is removed, the label tree will be automatically detached as well.
        </p>

        <h3><a name="modify-a-label-tree"></a>Modify a label tree</h3>

        <p>
            Label trees have a name and short description text so users can identify them. You already learned how to change the label tree visibility. The name and description are modified in the same way. Open the <button class="btn btn-default btn-xs"><i class="fa fa-cog"></i> <span class="caret"></span></button> dropdown menu at the top of the label tree overview and click <button class="btn btn-default btn-xs">Edit</button> to make the name and description editable. Click <button class="btn btn-success btn-xs">Save</button> once you are finished or <button class="btn btn-default btn-xs">Cancel</button> to reset your changes.
        </p>
        <p>
            As a label tree admin you cannot modify yourself as a label tree member in the <button class="btn btn-default btn-xs"><i class="fa fa-users"></i> Members</button> tab. If you want to have another role in the label tree, ask another admin to change it. If you want to leave the label tree, open the <button class="btn btn-default btn-xs"><i class="fa fa-cog"></i> <span class="caret"></span></button> dropdown menu and click <button class="btn btn-default btn-xs">Leave</button>. Note that you can only leave a label tree if it has at least one other admin to manage it.
        </p>
        <p>
            Finally, label tree admins can delete a label tree with a click on <button class="btn btn-default btn-xs">Delete</button> in the <button class="btn btn-default btn-xs"><i class="fa fa-cog"></i> <span class="caret"></span></button> dropdown menu. This will detach all projects from the label tree and attempt to delete all labels. If a label that belongs to the label tree (or any of its <a href="{{route('manual-tutorials', ['label-trees', 'label-tree-versions'])}}">versions</a>) is still attached to an annotation or an image, the label (and therefore the label tree) cannot be deleted.
        </p>
        <p>
            To learn more on how to create, modify or delete labels of a label tree, continue <a href="{{route('manual-tutorials', ['label-trees', 'manage-labels'])}}">here</a>.
        </p>

        <h3><a name="fork-a-label-tree"></a>Fork a label tree</h3>

        <p>
            If you have access to a (public) label tree and want to modify it but are not a member of the label tree, you can fork it. A fork is a full copy of a label tree with all of its labels that belongs to you, the creator of the fork. Since you are now a member of the forked label tree, you can freely edit it and update its labels. To fork a label tree, visit the overview page of the label tree and click <button class="btn btn-default btn-xs">Fork</button> in the <button class="btn btn-default btn-xs"><i class="fa fa-cog"></i> <span class="caret"></span></button> dropdown menu at the top. You can now choose a new name, description or visibility for the fork. Finally, click <button class="btn btn-success btn-xs">Create fork</button> to create the fork.
        </p>

        <p>
            If you want to apply the changes that you have done to a forked label tree to the original label tree, you can ask the owner of the original label tree to perform a <a href="{{route('manual-tutorials', ['label-trees', 'merge-label-trees'])}}">merge</a>.
        </p>

    </div>
@endsection
