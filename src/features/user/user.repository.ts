import type { User } from "./user.types.js";

const users = new Map<string, User>();

export const userRepository = {
  findById(userId: string): User | undefined {
    return users.get(userId);
  },

  findByEmail(email: string): User | undefined {
    return [...users.values()].find((user) => user.email === email);
  },

  findAll(): User[] {
    return [...users.values()];
  },

  create(user: User): User {
    users.set(user.user_id, user);
    return user;
  },

  update(
    userId: string,
    data: Partial<Omit<User, "user_id">>,
  ): User | undefined {
    const existingUser = users.get(userId);

    if (!existingUser) {
      return undefined;
    }

    const updatedUser: User = {
      ...existingUser,
      ...data,
    };
    users.set(userId, updatedUser);
    return updatedUser;
  },

  delete(userId: string): boolean {
    return users.delete(userId);
  },
};
