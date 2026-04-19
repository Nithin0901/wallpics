/**
 * app/api/wallpapers/route.js
 * GET  /api/wallpapers — Fetch approved wallpapers (paginated)
 * POST /api/wallpapers — Upload a new wallpaper (authenticated users, status=pending)
 */
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import connectDB from '@/lib/db';
import Wallpaper from '@/models/Wallpaper';
import Category from '@/models/Category';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

// ─── GET: Fetch approved wallpapers with pagination ─────────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const sort = searchParams.get('sort') || 'latest'; // latest | trending | popular
    const featured = searchParams.get('featured') === 'true';

    await connectDB();

    const skip = (page - 1) * limit;
    let query = { status: 'approved' };
    if (featured) {
      query.isFeatured = true;
    }

    let sortOption = { createdAt: -1 }; // latest
    if (featured) {
      sortOption = { featuredAt: -1 };
    } else if (sort === 'trending') {
      // Trending: weighted score (handled via aggregation below)
      sortOption = { trendingScore: -1 };
    } else if (sort === 'popular') {
      sortOption = { likes: -1, downloads: -1 };
    }

    // Use aggregation for trending score
    let wallpapers;
    if (sort === 'trending') {
      wallpapers = await Wallpaper.aggregate([
        { $match: query },
        {
          $addFields: {
            trendingScore: {
              $add: [
                { $multiply: ['$likes', 3] },
                { $multiply: ['$downloads', 2] },
                '$views',
              ],
            },
          },
        },
        { $sort: { trendingScore: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'uploadedBy',
            foreignField: '_id',
            as: 'uploader',
          },
        },
        {
          $addFields: {
            uploadedBy: { $arrayElemAt: ['$uploader', 0] },
          },
        },
        {
          $project: {
            'uploadedBy.password': 0,
            'uploadedBy.likedWallpapers': 0,
            uploader: 0,
          },
        },
      ]);
    } else {
      wallpapers = await Wallpaper.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'username email profileImage role');
    }

    const total = await Wallpaper.countDocuments(query);

    return NextResponse.json({
      wallpapers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + wallpapers.length < total,
      },
    });
  } catch (error) {
    console.error('GET wallpapers error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallpapers' }, { status: 500 });
  }
}

// ─── POST: Upload new wallpaper ──────────────────────────────────────────────
export async function POST(request) {
  try {
    // Authenticate user
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('image');
    const title = formData.get('title');
    const mainCategory = formData.get('mainCategory');
    const subCategory = formData.get('subCategory');

    // Validate required fields
    if (!file || !title || !mainCategory || !subCategory) {
      return NextResponse.json({ error: 'Title, categories and image are required' }, { status: 400 });
    }

    // Validate categories
    const mainExists = await Category.exists({ name: mainCategory, type: 'main' });
    const subExists = await Category.exists({ name: subCategory, type: 'sub' });
    if (!mainExists || !subExists) {
      return NextResponse.json({ error: 'Invalid category selection' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPG, PNG, and WebP images are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be under 10MB' }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop().toLowerCase();
    const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;

    // Write file to public/uploads
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    // Save wallpaper to DB (status defaults to 'pending')
    await connectDB();
    
    // Handle tags (safely parse JSON array)
    const tagsRaw = formData.get('tags');
    let tags = [];
    try {
      if (tagsRaw) {
        tags = JSON.parse(tagsRaw);
        if (Array.isArray(tags)) {
          // Clean tags: trim, lower, remove empty, limit to 10
          tags = tags
            .map(t => String(t).trim().toLowerCase())
            .filter(t => t.length > 0)
            .slice(0, 10);
        }
      }
    } catch (e) {
      console.warn('Failed to parse tags:', e);
    }

    const wallpaper = await Wallpaper.create({
      title: title.trim(),
      image: `/uploads/${filename}`,
      mainCategory,
      subCategory,
      uploadedBy: authUser.id,
      tags,
    });

    await wallpaper.populate('uploadedBy', 'username email profileImage');

    // Send email notification to all admins
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const admins = await User.find({ role: 'admin' });
        const adminEmails = admins.map(a => a.email);
        
        if (adminEmails.length > 0) {
          const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT) || 587,
            secure: false, // STARTTLS
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });
          
          await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: adminEmails,
            subject: 'New Wallpaper Upload Pending Approval',
            html: `
              <div style="font-family:Inter,sans-serif;background:#0f0f13;color:#e2e2e8;padding:40px;border-radius:16px;max-width:480px;margin:auto;">
                <h2 style="font-size:18px;font-weight:700;margin-bottom:8px;">New Upload Request</h2>
                <p style="color:#9090a8;margin-bottom:24px;font-size:14px;">User <strong>${wallpaper.uploadedBy.username}</strong> (${wallpaper.uploadedBy.email}) has uploaded a new wallpaper.</p>
                <div style="background:#1a1a24;border:1px solid #2d2d3d;border-radius:12px;padding:24px;margin-bottom:24px;">
                  <p style="margin:0 0 8px 0;"><strong>Title:</strong> ${wallpaper.title}</p>
                  <p style="margin:0;"><strong>Category:</strong> ${wallpaper.mainCategory} / ${wallpaper.subCategory}</p>
                </div>
                <p style="color:#6060788;font-size:12px;">Please log in to the admin dashboard to review and approve/reject it.</p>
                <div style="text-align: center; margin-top: 32px;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin" style="background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:12px;font-weight:bold;font-size:14px;display:inline-block;letter-spacing:0.05em;">View Dashboard</a>
                </div>
              </div>
            `
          });
        }
      }
    } catch (emailErr) {
      console.error('Failed to notify admins:', emailErr);
    }

    return NextResponse.json(
      { message: 'Wallpaper submitted for review', wallpaper },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST wallpaper error:', error);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}
