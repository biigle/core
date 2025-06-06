import './export';
import AuthorizedProjectsContainer from './authorizedProjectsContainer.vue';
import LabelsContainer from './labelsContainer.vue';
import LabelsCount from './labelsCount.vue';
import MembersContainer from './membersContainer.vue';
import MembersCount from './membersCount.vue';
import MergeContainer from './mergeContainer.vue';
import MergeIndexContainer from './mergeIndexContainer.vue';
import Title from './title.vue';
import VersionDoi from './versionDoi.vue';
import VersionTitle from './versionTitle.vue';

biigle.$mount('label-tree-version-doi', VersionDoi);
biigle.$mount('label-tree-version-title', VersionTitle);
biigle.$mount('label-trees-authorized-projects', AuthorizedProjectsContainer);
biigle.$mount('label-trees-labels', LabelsContainer);
biigle.$mount('label-trees-labels-count', LabelsCount);
biigle.$mount('label-trees-members', MembersContainer);
biigle.$mount('label-trees-members-count', MembersCount);
biigle.$mount('label-trees-title', Title);
biigle.$mount('merge-label-trees-container', MergeContainer);
biigle.$mount('merge-label-trees-index-container', MergeIndexContainer);
