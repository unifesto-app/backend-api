import { UserRepository } from '@/src/repositories/user.repository';
import { CreateUserDto, UpdateUserDto, UserFilterDto } from '@/src/types/dto';
import { Profile } from '@/src/types/entities';
import { PaginationParams } from '@/src/types';
import { validateRequired, validateEmail, ValidationError } from '@/src/utils/validation';

export class UserService {
  constructor(private repository: UserRepository) {}

  async listUsers(pagination: PaginationParams, filters: UserFilterDto) {
    return this.repository.findUsers(pagination, filters);
  }

  async getUserById(id: string): Promise<Profile> {
    const user = await this.repository.findUserById(id);
    if (!user) throw new ValidationError('User not found');
    return user;
  }

  async createUser(dto: CreateUserDto): Promise<Profile> {
    validateRequired(dto.email, 'email');
    validateEmail(dto.email);

    return this.repository.createUser({
      email: dto.email,
      full_name: dto.full_name,
      role: dto.role ?? 'attendee',
    });
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<Profile> {
    await this.getUserById(id);
    return this.repository.updateUser(id, dto);
  }

  async deleteUser(id: string): Promise<void> {
    await this.getUserById(id);
    return this.repository.deleteUser(id);
  }
}
