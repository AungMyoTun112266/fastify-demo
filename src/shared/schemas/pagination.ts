export type PaginatedData<T, C = string> = {
  items: T[];
  pagination: {
    limit: number;
    nextCursor: C | null;
    hasMore: boolean;
  };
};
