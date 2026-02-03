import { NextRequest, NextResponse } from 'next/server';
import { withAuth, prisma } from '@/lib';
import { createProductSchema } from '@/lib/validations/product';

// GET - Get all products (admin only)
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      // Verify admin role
      const adminUser = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!adminUser || adminUser.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Access denied. Admin privileges required.' },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const search = searchParams.get('search') || '';
      const category_id = searchParams.get('category_id');
      const vendor_id = searchParams.get('vendor_id');

      const skip = (page - 1) * limit;

      const whereClause: any = {};

      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { name_ka: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (category_id) {
        whereClause.category_id = category_id;
      }

      if (vendor_id) {
        whereClause.vendor_id = vendor_id;
      }

      const [products, total] = await Promise.all([
        prisma.products.findMany({
          where: whereClause,
          include: {
            category: {
              select: {
                id: true,
                name: true,
                name_ka: true,
              },
            },
            vendor: {
              select: {
                id: true,
                company_name: true,
              },
            },
            media: true,
          },
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
        }),
        prisma.products.count({ where: whereClause }),
      ]);

      return NextResponse.json({
        data: products,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }
  });
}

// POST - Create a new product (admin only)
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      // Verify admin role
      const adminUser = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!adminUser || adminUser.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Access denied. Admin privileges required.' },
          { status: 403 }
        );
      }

      const body = await req.json();
      const validationResult = createProductSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationResult.error },
          { status: 400 }
        );
      }

      const data = validationResult.data;

      // Check if SKU already exists
      const existingProduct = await prisma.products.findUnique({
        where: { sku: data.sku },
      });

      if (existingProduct) {
        return NextResponse.json(
          { error: 'Product with this SKU already exists' },
          { status: 400 }
        );
      }

      // Check if vendor exists and is active
      if (data.vendor_id) {
        const vendor = await prisma.vendors.findUnique({
          where: { id: data.vendor_id },
        });

        if (!vendor || !vendor.is_active) {
          return NextResponse.json(
            { error: 'Invalid or inactive vendor' },
            { status: 400 }
          );
        }
      }

      // Check if category exists
      const category = await prisma.categories.findUnique({
        where: { id: data.category_id },
      });

      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 400 }
        );
      }

      const product = await prisma.products.create({
        data: {
          name: data.name,
          name_ka: data.name_ka,
          description: data.description || null,
          description_ka: data.description_ka || null,
          manufacturer: data.manufacturer || null,
          price: data.price,
          sale_price: data.sale_price || null,
          discount_percent: data.discount_percent || null,
          sku: data.sku,
          stock: data.stock,
          category_id: data.category_id,
          vendor_id: data.vendor_id || null,
        },
        include: {
          category: true,
          vendor: true,
          media: true,
        },
      });

      return NextResponse.json(product, { status: 201 });
    } catch (error) {
      console.error('Error creating product:', error);
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }
  });
}
