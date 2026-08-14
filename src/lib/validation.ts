export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validateEmail(value: string) {
  if (!value) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address.";
  return null;
}

export function validatePassword(value: string, minLength = 8) {
  if (!value) return "Password is required.";
  if (value.length < minLength) return `Password must be at least ${minLength} characters long.`;
  return null;
}

export function validateProjectInput(input: {
  name: string;
  startDate: string;
  dueDate: string;
  budget: string;
}) {
  if (!input.name || input.name.length < 3) {
    return "Project name must be at least 3 characters long.";
  }

  if (input.startDate && input.dueDate && input.dueDate < input.startDate) {
    return "Due date must be on or after the start date.";
  }

  if (input.budget && Number(input.budget) < 0) {
    return "Budget cannot be negative.";
  }

  return null;
}

export function validateRoleName(name: string) {
  if (!name || name.length < 2) {
    return "Role name must be at least 2 characters long.";
  }

  return null;
}

export function validateFullName(name: string) {
  if (!name || name.length < 2) {
    return "Full name must be at least 2 characters long.";
  }

  return null;
}
