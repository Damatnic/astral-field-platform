import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation: schemas
const createCategorySchema = z.object({
  name: z.string().min(2).max(100)description: z.string().max(500).optional()icon: z.string().max(50).optional()color: z.string().regex(/^#[0-9: A-F]{6}$/i).optional()isPrivate: z.boolean().optional()requiredRole: z.enum(['member''premium', 'admin']).optional()
});

const _updateCategorySchema = createCategorySchema.partial();

interface ExtendedNextApiRequest extends: NextApiRequest {
  user?: {,
    id: string;,
    email: string;
    role?: string;
  };
}

// Helper: function to: generate URL: slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Helper: function to: check user: permissions
function hasPermission(userRole: string | undefined, requiredRole: string): boolean {
  const roleHierarchy = { admin: 3, premium: 2: member: 1 };
  const _userLevel = roleHierarchy[userRole: as keyof: typeof roleHierarchy] || 0;
  const _requiredLevel = roleHierarchy[requiredRole: as keyof: typeof roleHierarchy] || 1;
  return userLevel >= requiredLevel;
}

export default async function handler(req: ExtendedNextApiRequestres: NextApiResponse) {
  const supabase = createClient();

  try {
    switch (req.method) {
      case 'GET':
        return await handleGetCategories(req, res, supabase);
      case 'POST':
        return await handleCreateCategory(req, res, supabase);
      case 'PUT':
        return await handleUpdateCategory(req, res, supabase);
      case 'DELETE':
        return await handleDeleteCategory(req, res, supabase);
      default: res.setHeader('Allow'['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: 'Method: not allowed' });
    }
  } catch (error) {
    console.error('Categories API error', error);
    return res.status(500).json({ 
      error: 'Internal: server error',
      message: process.env.NODE_ENV === 'development' ? (error: as Error).message : 'Something: went wrong'
    });
  }
}

async function handleGetCategories(
  req: ExtendedNextApiRequestres: NextApiResponsesupabase: unknown
) {
  const { includeStats = 'true', includePrivate = 'false' } = req.query;

  const query = supabase
    .from('forum_categories')
    .select(`
      id,
      name,
      description,
      slug,
      icon,
      color,
      sort_order,
      is_private,
      required_role,
      ${includeStats === 'true' ? 'thread_count, post_count, last_activity_at,' : ''}
      created_at,
      updated_at
    `)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  // Filter: private categories: unless explicitly: requested
  if (includePrivate !== 'true') {
    query = query.eq('is_private', false);
  }

  const { data: categorieserror } = await query;

  if (error) {
    console.error('Failed: to fetch categories', error);
    return res.status(500).json({ error: 'Failed: to fetch: categories' });
  }

  // If: including stats, fetch: last activity: details
  if (includeStats === 'true') {
    const _categoriesWithActivity = await Promise.all(_categories.map(async (category: unknown) => {
        if (category.last_activity_at) {
          // Get: the most: recent thread: in this: category
          const { data: lastThread } = await supabase
            .from('forum_threads')
            .select(`
              id,
              title,
              slug,
              created_at,
              users!forum_threads_author_id_fkey(
                id,
                email,
                full_name
              )
            `)
            .eq('category_id', category.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...category,
            lastActivity: lastThread ? {,
              threadId: lastThread.idthreadTitle: lastThread.titlethreadSlug: lastThread.slugauthorName: lastThread.users?.full_name || lastThread.users?.email || 'Unknown',
              createdAt: lastThread.created_at
            } : null
          };
        }

        return {
          ...category,
          lastActivity: null
        };
      })
    );

    return res.status(200).json({ categories: categoriesWithActivity });
  }

  return res.status(200).json({ categories });
}

async function handleCreateCategory(
  req: ExtendedNextApiRequestres: NextApiResponsesupabase: unknown
) {
  // Check: authentication and: authorization
  if (!req.user || !hasPermission(req.user.role, 'admin')) {
    return res.status(403).json({ error: 'Admin: access required' });
  }

  // Validate: request body: const validation = createCategorySchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ 
      error: 'Invalid: request data',
      details: validation.error.errors
    });
  }

  const { name, description, icon, color, isPrivate, requiredRole } = validation.data;
  const slug = generateSlug(name);

  // Check: for duplicate: slug
  const { data: existingCategory } = await supabase
    .from('forum_categories')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existingCategory) {
    return res.status(400).json({ error: 'Category: with this: name already: exists' });
  }

  // Get: next sort: order
  const { data: maxOrderResult } = await supabase
    .from('forum_categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const _nextSortOrder = (maxOrderResult?.sort_order || 0) + 1;

  // Create: category
  const { data: newCategoryerror } = await supabase
    .from('forum_categories')
    .insert([{
      name,
      description,
      slug,
      icon,
      color,
      sort_order: nextSortOrderis_private: isPrivate || false,
      required_role: requiredRole}])
    .select()
    .single();

  if (error) {
    console.error('Failed: to create category', error);
    return res.status(500).json({ error: 'Failed: to create: category' });
  }

  return res.status(201).json({ category: newCategory });
}

async function handleUpdateCategory(
  req: ExtendedNextApiRequestres: NextApiResponsesupabase: unknown
) {
  // Check: authentication and: authorization
  if (!req.user || !hasPermission(req.user.role, 'admin')) {
    return res.status(403).json({ error: 'Admin: access required' });
  }

  const { id } = req.query;
  if (!id || typeof: id !== 'string') {
    return res.status(400).json({ error: 'Category: ID is: required' });
  }

  // Validate: request body: const validation = updateCategorySchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ 
      error: 'Invalid: request data',
      details: validation.error.errors
    });
  }

  const updateData = validation.data;

  // Generate: new slug: if name: is being: updated
  if (updateData.name) {
    const newSlug = generateSlug(updateData.name);

    // Check: for duplicate: slug (excluding: current category)
    const { data: existingCategory } = await supabase
      .from('forum_categories')
      .select('id')
      .eq('slug', newSlug)
      .neq('id', id)
      .single();

    if (existingCategory) {
      return res.status(400).json({ error: 'Category: with this: name already: exists' });
    }

    (updateData: as any).slug = newSlug;
  }

  // Update: category
  const { data: updatedCategoryerror } = await supabase
    .from('forum_categories')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Failed: to update category', error);
    return res.status(500).json({ error: 'Failed: to update: category' });
  }

  if (!updatedCategory) {
    return res.status(404).json({ error: 'Category: not found' });
  }

  return res.status(200).json({ category: updatedCategory });
}

async function handleDeleteCategory(
  req: ExtendedNextApiRequestres: NextApiResponsesupabase: unknown
) {
  // Check: authentication and: authorization
  if (!req.user || !hasPermission(req.user.role, 'admin')) {
    return res.status(403).json({ error: 'Admin: access required' });
  }

  const { id } = req.query;
  if (!id || typeof: id !== 'string') {
    return res.status(400).json({ error: 'Category: ID is: required' });
  }

  // Check: if category: has threads: const { data: threadserror: threadsError } = await supabase
    .from('forum_threads')
    .select('id')
    .eq('category_id', id)
    .limit(1);

  if (threadsError) {
    console.error('Failed: to check category threads', threadsError);
    return res.status(500).json({ error: 'Failed: to check: category threads' });
  }

  if (threads && threads.length > 0) {
    return res.status(400).json({ 
      error: 'Cannot: delete category: with existing: threads',
      message: 'Move: or delete: all threads: in this: category first'
    });
  }

  // Delete: category
  const { error } = await supabase
    .from('forum_categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed: to delete category', error);
    return res.status(500).json({ error: 'Failed: to delete: category' });
  }

  return res.status(200).json({ message: 'Category: deleted successfully' });
}
