<div id="label-trees-authorized-projects">
    <p v-if="isPrivate" class="text-muted">
        Projects authorized to use this label tree:
    </p>
    <p v-else class="text-muted" v-cloak>
        All projects are authorized to use this public label tree.
    </p>
    <div v-if="isPrivate" v-cloak class="panel panel-default">
        <div class="panel-body">
            <typeahead class="typeahead--block" :items="authorizableProjects" placeholder="Add authorized project" title="Authorize one of your projects to use this tree" v-on:select="addAuthorizedProject" :clear-on-select="true" more-info="description"></typeahead>
        </div>
        <ul class="list-group list-group-restricted">
            <li v-for="project in authorizedProjects" class="list-group-item authorized-project-item">
                <button type="button" class="pull-right btn btn-default btn-sm" title="Remove authorization for this project" v-on:click="removeAuthorizedProject(project)"><i class="fa fa-trash"></i></button>
                <h4 class="list-group-item-heading">
                    <a v-if="isOwnProject(project)" :href="'{{route('project', '/')}}/' + project.id" v-text="project.name"></a>
                    <span v-else v-text="project.name"></span>
                </h4>
                <p v-if="project.description" class="list-group-item-text" v-text="project.description"></p>
            </li>
            <li class="list-group-item text-muted" v-if="!hasAuthorizedProjects">
                There are no projects authorized to use this label tree.
            </li>
        </ul>
    </div>
</div>
