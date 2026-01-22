
import type { ILoginAttemptRepository, LoginAttempt } from '../../domain/repositories/ILoginAttemptRepository';

const LOGIN_ATTEMPT_KEY = 'login_attempts';

export class MockLoginAttemptRepository implements ILoginAttemptRepository {
  private static instance: MockLoginAttemptRepository;
  private attempts: Map<string, LoginAttempt>;

  private constructor() {
    this.attempts = new Map();
    this.loadFromLocalStorage();
  }

  public static getInstance(): MockLoginAttemptRepository {
    if (!MockLoginAttemptRepository.instance) {
      MockLoginAttemptRepository.instance = new MockLoginAttemptRepository();
    }
    return MockLoginAttemptRepository.instance;
  }

  private loadFromLocalStorage(): void {
    if (typeof window === 'undefined') {
        return;
    }
    const storedAttempts = localStorage.getItem(LOGIN_ATTEMPT_KEY);
    this.attempts = storedAttempts ? new Map(JSON.parse(storedAttempts)) : new Map();
  }

  private saveToLocalStorage(): void {
    if (typeof window === 'undefined') {
        return;
    }
    localStorage.setItem(LOGIN_ATTEMPT_KEY, JSON.stringify(Array.from(this.attempts.entries())));
  }

  async findByEmail(email: string): Promise<LoginAttempt | null> {
    return this.attempts.get(email) || null;
  }

  async save(attempt: LoginAttempt): Promise<void> {
    this.attempts.set(attempt.email, attempt);
    this.saveToLocalStorage();
  }

  async delete(email: string): Promise<void> {
    this.attempts.delete(email);
    this.saveToLocalStorage();
  }
}
