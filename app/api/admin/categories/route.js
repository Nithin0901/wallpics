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
import { uploadToCloudinary } from '@/lib/cloudinary';
import cloudinary from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const name = formData.get('name');
    const description = formData.get('description');
    const emoji = formData.get('emoji');
    const seed = formData.get('seed');
    const image = formData.get('image');

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    await connectDB();
    
    // Check if category exists
    const exists = await Category.exists({ name: name.trim() });
    if (exists) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 400 });
    }

    let cloudinaryResult = null;
    if (image && typeof image !== 'string') {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      cloudinaryResult = await uploadToCloudinary(buffer, 'categories');
    }

    const newCategory = await Category.create({
      name: name.trim(),
      description: description?.trim() || '',
      emoji: emoji?.trim() || '📁',
      seed: seed?.trim() || 'nature',
      image: cloudinaryResult ? cloudinaryResult.secure_url : '',
      cloudinaryId: cloudinaryResult ? cloudinaryResult.public_id : null,
    });

    return NextResponse.json({ message: 'Category created', category: newCategory }, { status: 201 });
  } catch (error) {
    console.error('POST category error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const formData = await request.formData();
    const id = formData.get('id');
    const name = formData.get('name');
    const description = formData.get('description');
    const emoji = formData.get('emoji');
    const seed = formData.get('seed');
    const image = formData.get('image');

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
      const exists = await Category.findOne({ name: name.trim(), _id: { $ne: id } });
      if (exists) {
        return NextResponse.json({ error: 'Category name already exists' }, { status: 400 });
      }

      // SYNC: Update all wallpapers using the old name
      await Wallpaper.updateMany(
        { subCategory: category.name },
        { subCategory: name.trim() }
      );
    }

    // Handle Image Upload
    if (image && typeof image !== 'string') {
      // Delete old image if exists
      if (category.cloudinaryId) {
        try {
          await cloudinary.uploader.destroy(category.cloudinaryId);
        } catch (err) {
          console.warn('Failed to delete old category image:', err);
        }
      }

      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const cloudinaryResult = await uploadToCloudinary(buffer, 'categories');
      category.image = cloudinaryResult.secure_url;
      category.cloudinaryId = cloudinaryResult.public_id;
    }

    category.name = name.trim();
    if (description !== null) category.description = description.trim();
    if (emoji !== null) category.emoji = emoji.trim();
    if (seed !== null) category.seed = seed.trim();

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
    const count = await Wallpaper.countDocuments({ subCategory: category.name });
    if (count > 0) {
      return NextResponse.json(
        { error: `Cannot delete category. ${count} wallpapers are currently assigned to it.` },
        { status: 400 }
      );
    }

    // Delete image from Cloudinary
    if (category.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(category.cloudinaryId);
      } catch (err) {
        console.warn('Failed to delete category image from Cloudinary:', err);
      }
    }

    await Category.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('DELETE category error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
