import { EventRepository } from '@/src/repositories/event.repository';
import { CreateEventDto, UpdateEventDto, EventFilterDto } from '@/src/types/dto';
import { Event } from '@/src/types/entities';
import { PaginationParams } from '@/src/types';
import { validateRequired, validateDate, ValidationError } from '@/src/utils/validation';
import { isFkCategoryError, resolveCategory } from '@/lib/events-category';

export class EventService {
  constructor(
    private repository: EventRepository,
    private userId: string
  ) {}

  async listEvents(pagination: PaginationParams, filters: EventFilterDto) {
    return this.repository.findEvents(pagination, filters);
  }

  async getEventById(id: string): Promise<Event> {
    const event = await this.repository.findEventById(id);
    if (!event) throw new ValidationError('Event not found');
    return event;
  }

  async createEvent(dto: CreateEventDto): Promise<Event> {
    validateRequired(dto.title, 'title');
    validateRequired(dto.start_date, 'start_date');
    validateDate(dto.start_date, 'start_date');
    if (dto.end_date) validateDate(dto.end_date, 'end_date');

    const resolvedCategory = dto.category
      ? await resolveCategory(this.repository['supabase'], dto.category)
      : null;

    const categoryValue = dto.category ? resolvedCategory?.id ?? null : null;

    if (dto.category && !resolvedCategory) {
      throw new ValidationError('Invalid category. Select an existing category.');
    }

    try {
      return await this.repository.createEvent({
        ...dto,
        category: categoryValue,
        created_by: this.userId,
      });
    } catch (error: any) {
      if (isFkCategoryError(error.message) && resolvedCategory?.slug) {
        return await this.repository.createEvent({
          ...dto,
          category: resolvedCategory.slug,
          created_by: this.userId,
        });
      }
      throw error;
    }
  }

  async updateEvent(id: string, dto: UpdateEventDto): Promise<Event> {
    if (dto.start_date) validateDate(dto.start_date, 'start_date');
    if (dto.end_date) validateDate(dto.end_date, 'end_date');

    await this.getEventById(id);
    return this.repository.updateEvent(id, dto);
  }

  async deleteEvent(id: string): Promise<void> {
    await this.getEventById(id);
    return this.repository.deleteEvent(id);
  }
}
