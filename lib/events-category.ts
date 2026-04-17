type SupabaseClientLike = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: { id: string; slug?: string | null; name?: string | null } | null; error: { message: string } | null }>;
      };
      ilike: (column: string, value: string) => {
        limit: (count: number) => {
          maybeSingle: () => Promise<{ data: { id: string; slug?: string | null; name?: string | null } | null; error: { message: string } | null }>;
        };
      };
    };
  };
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CategoryRow = {
  id: string;
  slug?: string | null;
  name?: string | null;
};

export type ResolvedCategory = {
  id: string;
  slug: string | null;
};

const loadBy = async (
  supabase: SupabaseClientLike,
  column: 'id' | 'slug',
  value: string
): Promise<CategoryRow | null> => {
  const { data, error } = await supabase
    .from('categories')
    .select('id,slug,name')
    .eq(column, value)
    .maybeSingle();

  if (error) return null;
  return data;
};

const loadByName = async (supabase: SupabaseClientLike, value: string): Promise<CategoryRow | null> => {
  const { data, error } = await supabase
    .from('categories')
    .select('id,slug,name')
    .ilike('name', value)
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data;
};

export const resolveCategory = async (
  supabase: SupabaseClientLike,
  rawCategory: unknown
): Promise<ResolvedCategory | null> => {
  if (rawCategory === null || rawCategory === undefined) return null;

  const input = String(rawCategory).trim();
  if (!input) return null;

  let row: CategoryRow | null = null;

  if (UUID_REGEX.test(input)) {
    row = await loadBy(supabase, 'id', input);
  }

  if (!row) {
    row = await loadBy(supabase, 'slug', input.toLowerCase());
  }

  if (!row) {
    row = await loadByName(supabase, input);
  }

  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug ?? null,
  };
};

export const isFkCategoryError = (message: string | undefined | null) => {
  if (!message) return false;
  return message.includes('events_category_fkey');
};
