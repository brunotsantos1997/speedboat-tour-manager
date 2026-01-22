
export interface LoginAttempt {
  email: string;
  count: number;
  timestamp: number;
}

export interface ILoginAttemptRepository {
  findByEmail(email: string): Promise<LoginAttempt | null>;
  save(attempt: LoginAttempt): Promise<void>;
  delete(email: string): Promise<void>;
}
