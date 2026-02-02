import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Categories data from translation files
const categoriesData = [
  {
    slug: 'sterilization',
    name: 'Sterilization',
    name_ka: 'სტერილიზაცია',
    subcategories: [
      { slug: 'sterilization-equipment', name: 'Sterilization Equipment', name_ka: 'სტერილიზაციის აპარატურა' },
      { slug: 'sterilization-solutions', name: 'Disinfectant Solutions', name_ka: 'სადეზინფექციო ხსნარები' },
      { slug: 'sterilization-pouches', name: 'Sterilization Pouches', name_ka: 'სტერილიზაციის პაკეტები' },
    ],
  },
  {
    slug: 'prosthetics',
    name: 'Prosthetics',
    name_ka: 'პროთეზირება',
    subcategories: [
      { slug: 'fixed-prosthetics', name: 'Fixed Prosthetics', name_ka: 'ფიქსირებული პროთეზები' },
      { slug: 'removable-prosthetics', name: 'Removable Prosthetics', name_ka: 'მოსახსნელი პროთეზები' },
      { slug: 'implant-prosthetics', name: 'Implant Prosthetics', name_ka: 'იმპლანტის პროთეზირება' },
    ],
  },
  {
    slug: 'model_manufacturing',
    name: 'Model Manufacturing',
    name_ka: 'მოდელის დამზადება',
    subcategories: [
      { slug: 'impression-materials', name: 'Impression Materials', name_ka: 'ანაბეჭდის მასალები' },
      { slug: 'gypsum-products', name: 'Gypsum Products', name_ka: 'თაბაშირის პროდუქტები' },
    ],
  },
  {
    slug: 'fixation_materials',
    name: 'Fixation Materials',
    name_ka: 'საფიქსაციო საშუალებები',
    subcategories: [
      { slug: 'temporary-cements', name: 'Temporary Cements', name_ka: 'დროებითი ცემენტები' },
      { slug: 'permanent-cements', name: 'Permanent Cements', name_ka: 'მუდმივი ცემენტები' },
    ],
  },
  {
    slug: 'waste_disposal',
    name: 'Waste Disposal',
    name_ka: 'უტილიზაცია',
    subcategories: [],
  },
  {
    slug: 'therapy',
    name: 'Therapy',
    name_ka: 'თერაპია',
    subcategories: [
      { slug: 'composites', name: 'Composites', name_ka: 'კომპოზიტები' },
      { slug: 'bonding-agents', name: 'Bonding Agents', name_ka: 'ბონდინგ აგენტები' },
      { slug: 'endodontics', name: 'Endodontics', name_ka: 'ენდოდონტია' },
    ],
  },
  {
    slug: 'periodontology',
    name: 'Periodontology',
    name_ka: 'პაროდონტოლოგია',
    subcategories: [
      { slug: 'scaling-instruments', name: 'Scaling Instruments', name_ka: 'სკეილინგის ინსტრუმენტები' },
      { slug: 'periodontal-materials', name: 'Periodontal Materials', name_ka: 'პაროდონტული მასალები' },
    ],
  },
  {
    slug: 'modeling',
    name: 'Modeling',
    name_ka: 'მოდელირება',
    subcategories: [],
  },
  {
    slug: 'laboratory_inventory',
    name: 'General Laboratory Inventory',
    name_ka: 'ლაბორატორიის ზოგადი ინვენტარი',
    subcategories: [],
  },
  {
    slug: 'cad_cam_manufacturing',
    name: 'Computer-Aided Manufacturing (CAD/CAM)',
    name_ka: 'კომპიუტერული წარმოება (CAD - CAM)',
    subcategories: [
      { slug: 'milling-blocks', name: 'Milling Blocks', name_ka: 'ფრეზირების ბლოკები' },
      { slug: 'scanning-equipment', name: 'Scanning Equipment', name_ka: 'სკანირების აპარატურა' },
    ],
  },
  {
    slug: 'final_processing',
    name: 'Final Processing',
    name_ka: 'საბოლოო დამუშავება',
    subcategories: [],
  },
  {
    slug: 'surgery',
    name: 'Surgery',
    name_ka: 'ქირურგია',
    subcategories: [
      { slug: 'surgical-instruments', name: 'Surgical Instruments', name_ka: 'ქირურგიული ინსტრუმენტები' },
      { slug: 'implants', name: 'Implants', name_ka: 'იმპლანტები' },
      { slug: 'bone-grafts', name: 'Bone Grafts', name_ka: 'ძვლის გრაფტები' },
    ],
  },
  {
    slug: 'disposable_systems_accessories',
    name: 'Disposable Systems and Accessories',
    name_ka: 'ერთჯერადი სისტემა და აქსესუარები',
    subcategories: [],
  },
  {
    slug: 'ceramics_veneers',
    name: 'Ceramics / Veneers',
    name_ka: 'ფაიფური/ვინირება',
    subcategories: [],
  },
  {
    slug: 'casting_investing_welding',
    name: 'Casting, Investing, and Welding',
    name_ka: 'ჩამოსხმა.ინვესტირება.შედუღება',
    subcategories: [],
  },
  {
    slug: 'orthodontics',
    name: 'Orthodontics',
    name_ka: 'ორთოდონტია',
    subcategories: [
      { slug: 'brackets', name: 'Brackets', name_ka: 'ბრეკეტები' },
      { slug: 'wires', name: 'Wires', name_ka: 'მავთულები' },
      { slug: 'aligners', name: 'Aligners', name_ka: 'ალაინერები' },
    ],
  },
];

async function main() {
  // Clear existing data
  await prisma.order_items.deleteMany();
  await prisma.orders.deleteMany();
  await prisma.products.deleteMany();
  await prisma.categories.deleteMany();
  await prisma.users.deleteMany();

  // Store created categories for product assignment
  const createdCategories: Record<string, string> = {};

  // Create parent categories and their subcategories
  for (const category of categoriesData) {
    const parentCategory = await prisma.categories.create({
      data: {
        name: category.name,
        name_ka: category.name_ka,
        slug: category.slug,
        image: `/logos/categories/${category.slug}.jpg`,
      },
    });

    createdCategories[category.slug] = parentCategory.id;

    // Create subcategories
    for (const subcategory of category.subcategories) {
      const createdSubcategory = await prisma.categories.create({
        data: {
          name: subcategory.name,
          name_ka: subcategory.name_ka,
          slug: subcategory.slug,
          parent_id: parentCategory.id,
        },
      });

      createdCategories[subcategory.slug] = createdSubcategory.id;
    }
  }

  // Create a test admin user
  await prisma.users.create({
    data: {
      email: 'admin@dentalmall.ge',
      first_name: 'Admin',
      last_name: 'Dentall',
      role: 'ADMIN',
      firebase_uid: 'nQLdzBrzmWOSUvbN4UuFZfAajR03'
    },
  });

  const parentCount = categoriesData.length;
  const subcategoryCount = categoriesData.reduce((acc, cat) => acc + cat.subcategories.length, 0);

  console.log('Seed completed successfully!');
  console.log('Created:');
  console.log(`- ${parentCount} parent categories`);
  console.log(`- ${subcategoryCount} subcategories`);
  console.log('- 1 admin user');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
