import type { User } from '../../domain/User';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';

const STORAGE_KEY = 'mock_users';

export class MockUserRepository implements IUserRepository {
  private users: User[] = [];

  constructor() {
    this.loadUsersFromStorage();
  }

  private loadUsersFromStorage() {
    const storedUsers = localStorage.getItem(STORAGE_KEY);
    if (storedUsers) {
      this.users = JSON.parse(storedUsers);
    }
  }

  private commit() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.users));
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = this.users.find((u) => u.email === email);
    return Promise.resolve(user || null);
  }

  async findById(id: string): Promise<User | null> {
    const user = this.users.find((u) => u.id === id);
    return Promise.resolve(user || null);
  }

  async findAll(): Promise<User[]> {
    return Promise.resolve(this.users);
  }

  async save(user: User): Promise<void> {
    const existingUser = await this.findByEmail(user.email);
    if (existingUser) {
      throw new Error('User with this email already exists.');
    }

    this.users.push(user);
    this.commit();
    return Promise.resolve();
  }

  async update(user: User): Promise<void> {
    const index = this.users.findIndex((u) => u.id === user.id);
    if (index === -1) {
      throw new Error('User not found.');
    }
    this.users[index] = user;
    this.commit();
    return Promise.resolve();
  }
}
