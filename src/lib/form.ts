export type FormState = {
  status: "idle" | "error" | "success";
  message?: string;
  /** field name -> error messages */
  errors?: Record<string, string[] | undefined>;
};

export const initialFormState: FormState = { status: "idle" };

export function fieldError(state: FormState, field: string): string | undefined {
  return state.errors?.[field]?.[0];
}
