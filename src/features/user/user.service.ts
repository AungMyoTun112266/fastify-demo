import { randomUUID } from "node:crypto";

import { appErrors } from "../../shared/errors/index.js";
import { userRepository } from "./user.repository.js";
import type { User } from "./user.types.js";

type CreateUserInput = {
  name: string;
  email: string;
};

export const userService = {
  getUserById(userId: string): User {
    const user = userRepository.findById(userId);

    if (!user) {
      throw appErrors.notFound();
    }
    return user;
  },

  getAllUsers(): User[] {
    return userRepository.findAll();
  },

  createUser(input: CreateUserInput): User {
    const existingUser = userRepository.findByEmail(input.email);

    if (existingUser) {
      throw appErrors.duplicateRequest();
    }

    const user: User = {
      user_id: randomUUID(),
      name: input.name,
      email: input.email,
      created_at: new Date().toISOString(),
    };

    return userRepository.create(user);
  },

  deleteUser(userId: string): void {
    const deleted = userRepository.delete(userId);

    if (!deleted) {
      throw appErrors.notFound();
    }
  },
};
