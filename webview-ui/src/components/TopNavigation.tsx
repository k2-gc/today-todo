import type { ViewType } from '../../../core/domain/types';

interface TopNavigationProps {
  currentView: ViewType;
  onSwitchView: (view: ViewType) => void;
}

type NavItem = {
  key: ViewType;
  label: string;
  icon: string;
};

const NAVS: NavItem[] = [
  { key: 'briefing', label: 'Briefing', icon: '📝' },
  { key: 'focus', label: 'Focus', icon: '🎯' },
  { key: 'done_today', label: 'Done Today', icon: '✅' },
  { key: 'done_all', label: 'All Done', icon: '📚' },
];

export default function TopNavigation({ currentView, onSwitchView }: TopNavigationProps) {
  return (
    <nav className="top-nav">
      {NAVS.map((nav) => (
        <button
          key={nav.key}
          className={nav.key === currentView ? 'active' : ''}
          onClick={() => onSwitchView(nav.key)}
          title={nav.label}
        >
          <span className="icon">{nav.icon}</span>
          <span className="nav-label">{nav.label}</span>
        </button>
      ))}
    </nav>
  );
}
