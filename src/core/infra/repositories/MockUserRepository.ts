import type { User } from '../../domain/User';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'mock_users';
const OWNER_EMAIL = 'bruno.t.santos1997@hotmail.com';

export class MockUserRepository implements IUserRepository {
  private static instance: MockUserRepository;
  private users: User[] = [];

  private constructor() {
    this.loadUsersFromStorage();
    this.seedOwner();
  }

  public static getInstance(): MockUserRepository {
    if (!MockUserRepository.instance) {
      MockUserRepository.instance = new MockUserRepository();
    }
    return MockUserRepository.instance;
  }

  private async seedOwner() {
    const ownerExists = this.users.some(user => user.email === OWNER_EMAIL);
    if (!ownerExists) {
      const ownerPasswordHash = await bcrypt.hash('Bruno@06252422', 10);
      const owner: User = {
        id: uuidv4(),
        name: 'Bruno',
        email: OWNER_EMAIL,
        passwordHash: ownerPasswordHash,
        role: 'OWNER',
        status: 'APPROVED',
        commissionPercentage: 0,
      };

      const adminPasswordHash = await bcrypt.hash('admin', 10);
      const adminUser: User = {
        id: uuidv4(),
        name: 'Admin User',
        email: 'admin@test.com',
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        status: 'APPROVED',
        commissionPercentage: 10,
      };

      this.users.push(owner, adminUser);
      this.commit();
    }
  }

  private loadUsersFromStorage() {
    const storedUsers = localStorage.getItem(STORAGE_KEY);
    if (storedUsers) {
      const parsedUsers: User[] = JSON.parse(storedUsers);
      this.users = parsedUsers.map(user => ({
        ...user,
        commissionPercentage: user.commissionPercentage ?? 0,
      }));
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
