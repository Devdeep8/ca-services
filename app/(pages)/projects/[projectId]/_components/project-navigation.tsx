// @/app/projects/[projectId]/_components/project-navigation.tsx

'use client'; // This is the Client Component

import { ProjectTabs, type Tab } from './project-tabs';

// This component receives the pre-built tabs array as a prop
export function ProjectNavigation({ tabs }: { tabs: Tab[] }) {

  return <ProjectTabs tabs={tabs}  />;
}