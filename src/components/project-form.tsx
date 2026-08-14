import { createProject } from "@/app/(dashboard)/actions";

export function ProjectForm() {
  return (
    <form action={createProject} className="card form-card">
      <div>
        <p className="eyebrow">Planning</p>
        <h2>Create project</h2>
        <p className="muted">Start a structured delivery workspace with ownership, priority, dates, and budget in place.</p>
      </div>

      <label>
        Project name
        <input name="name" placeholder="Website redesign" required />
      </label>

      <label>
        Description
        <textarea name="description" placeholder="Describe the project goals..." rows={3} />
      </label>

      <div className="form-grid">
        <label>
          Status
          <select name="status" defaultValue="Not Started">
            <option>Not Started</option>
            <option>In Progress</option>
            <option>On Hold</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
        </label>

        <label>
          Priority
          <select name="priority" defaultValue="Medium">
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>
        </label>
      </div>

      <div className="form-grid">
        <label>
          Start date
          <input name="start_date" type="date" />
        </label>

        <label>
          Due date
          <input name="due_date" type="date" />
        </label>
      </div>

      <label>
        Budget
        <input name="budget" type="number" min="0" step="0.01" placeholder="5000" />
      </label>

      <button className="button primary" type="submit">
        Create project
      </button>
    </form>
  );
}
