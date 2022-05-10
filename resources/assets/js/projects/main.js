import Dashboard from './dashboard';
import LabelTreesContainer from './labelTreesContainer';
import LabelTreesCount from './labelTreesCount';
import MembersContainer from './membersContainer';
import MembersCount from './membersCount';
import StatisticsContainer from './statisticsContainer';
import Title from './title';
import VolumesContainer from './volumesContainer';
import VolumesCount from './volumesCount';

biigle.$mount('project-label-trees-count', LabelTreesCount);
biigle.$mount('project-members-count', MembersCount);
biigle.$mount('project-volumes-count', VolumesCount);
biigle.$mount('projects-dashboard-main', Dashboard);
biigle.$mount('projects-show-label-trees', LabelTreesContainer);
biigle.$mount('projects-show-members', MembersContainer);
biigle.$mount('projects-show-statistics', StatisticsContainer);
biigle.$mount('projects-show-volumes', VolumesContainer);
biigle.$mount('projects-title', Title);
