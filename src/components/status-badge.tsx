export function StatusBadge({ value }: { value: string }) {
  return <span className={`badge ${value.toLowerCase().replaceAll(" ", "-")}`}>{value}</span>;
}

export function PriorityBadge({ value }: { value: string }) {
  return <span className={`badge priority-${value.toLowerCase()}`}>{value}</span>;
}
