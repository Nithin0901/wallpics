/**
 * app/api/admin/categories/route.js
 * POST   /api/admin/categories — Create a new category
 * PUT    /api/admin/categories — Update a category
 * DELETE /api/admin/categories — Delete a category 
 */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Category from '@/models/Category';
import Wallpaper from '@/models/Wallpaper';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { name, description, emoji, seed } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    await connectDB();
    
    // Check if category exists
    const exists = await Category.exists({ name: name.trim() });
    if (exists) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 400 });
    }

    const newCategory = await Category.create({
      name: name.trim(),
      description: description?.trim() || '',
      emoji: emoji?.trim() || '📁',
      seed: seed?.trim() || 'nature',
    });

    return NextResponse.json({ message: 'Category created', category: newCategory }, { status: 201 });
  } catch (error) {
    console.error('POST category error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id, name, description, emoji, seed } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    await connectDB();

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check if name is taken by another category
    if (name.trim() !== category.name) {
      const exists = await Category.findOne({ name: name.trim() });
      if (exists) {
        return NextResponse.json({ error: 'Category name already exists' }, { status: 400 });
      }

      // SYNC: Update all wallpapers using the old name
      await Wallpaper.updateMany(
        { category: category.name },
        { category: name.trim() }
      );
    }

    category.name = name.trim();
    if (description !== undefined) category.description = description.trim();
    if (emoji !== undefined) category.emoji = emoji.trim();
    if (seed !== undefined) category.seed = seed.trim();

    await category.save();

    return NextResponse.json({ message: 'Category updated successfully', category });
  } catch (error) {
    console.error('PUT category error:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    await connectDB();

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Optionally check if wallpapers use this category
    const count = await Wallpaper.countDocuments({ category: category.name });
    if (count > 0) {
      return NextResponse.json(
        { error: `Cannot delete category. ${count} wallpapers are currently assigned to it.` },
        { status: 400 }
      );
    }

    await Category.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('DELETE category error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
