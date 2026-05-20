import { Clock, LogOut } from 'lucide-react';

export default function AccountStatus({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="pending-container">
      <div className="pending-mesh"></div>
      <div className="pending-card glass-effect">
        <div className="icon-wrapper pulse-animation">
          <Clock size={48} color="#F59E0B" />
        </div>
        <h2 className="pending-heading">Account in Review</h2>
        <p className="pending-subheading">
          Your access request is currently being reviewed by an administrator. You'll be able to access the dashboard once approved.
        </p>
        <button onClick={onSignOut} className="btn premium-btn-outline">
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
