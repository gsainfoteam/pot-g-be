export class PaginationDto<T> {
  total: number;
  offset: number;
  limit: number;
  list: T[];
}
