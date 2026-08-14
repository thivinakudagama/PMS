import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
};

export function StatCard({ title, value, description, icon: Icon }: StatCardProps) {
  return (
    <article className="stat-card">
      <div className="stat-card-head">
        <p className="muted">{title}</p>
        <div className="stat-icon">
          <Icon size={20} />
        </div>
      </div>
      <div className="stat-card-body">
        <h2>{value}</h2>
        <small className="stat-note">{description}</small>
      </div>
    </article>
  );
}
