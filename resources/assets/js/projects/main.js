import Dashboard from './dashboard.vue';
import LabelTreesContainer from './labelTreesContainer.vue';
import LabelTreesCount from './labelTreesCount.vue';
import MembersContainer from './membersContainer.vue';
import MembersCount from './membersCount.vue';
import StatisticsContainer from './statisticsContainer.vue';
import Title from './title.vue';
import VolumesContainer from './volumesContainer.vue';
import VolumesCount from './volumesCount.vue';

biigle.$mount('project-label-trees-count', LabelTreesCount);
biigle.$mount('project-members-count', MembersCount);
biigle.$mount('project-volumes-count', VolumesCount);
biigle.$mount('projects-dashboard-main', Dashboard);
biigle.$mount('projects-show-label-trees', LabelTreesContainer);
biigle.$mount('projects-show-members', MembersContainer);
biigle.$mount('projects-show-statistics', StatisticsContainer);
biigle.$mount('projects-show-volumes', VolumesContainer);
biigle.$mount('projects-title', Title);
