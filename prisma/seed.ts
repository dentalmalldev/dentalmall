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

  // Create sample products for some categories
  const productsData = [
    // Sterilization products
    {
      name: 'Autoclave Sterilizer Class B',
      name_ka: 'ავტოკლავი სტერილიზატორი B კლასი',
      description: 'Class B autoclave for complete sterilization',
      description_ka: 'B კლასის ავტოკლავი სრული სტერილიზაციისთვის',
      price: 2500.00,
      sku: 'STER-001',
      stock: 10,
      images: ['/logos/products/autoclave.jpg'],
      category_id: createdCategories['sterilization-equipment'],
    },
    {
      name: 'Disinfectant Solution 5L',
      name_ka: 'სადეზინფექციო ხსნარი 5ლ',
      description: 'Professional disinfectant for surfaces',
      description_ka: 'პროფესიონალური დეზინფექტანტი ზედაპირებისთვის',
      price: 45.00,
      sku: 'STER-002',
      stock: 100,
      images: ['/logos/products/disinfectant.jpg'],
      category_id: createdCategories['sterilization-solutions'],
    },
    // Therapy products
    {
      name: 'Composite Resin Kit A2',
      name_ka: 'კომპოზიტური ფისის ნაკრები A2',
      description: 'Light-curing composite for aesthetic restorations',
      description_ka: 'სინათლით გამაგრებადი კომპოზიტი ესთეტიკური რესტავრაციისთვის',
      price: 150.00,
      sale_price: 129.99,
      sku: 'THER-001',
      stock: 40,
      images: ['/logos/products/composite.jpg'],
      category_id: createdCategories['composites'],
    },
    {
      name: 'Universal Bonding Agent',
      name_ka: 'უნივერსალური ბონდინგ აგენტი',
      description: 'Single-bottle bonding system',
      description_ka: 'ერთ-ბოთლიანი ბონდინგ სისტემა',
      price: 85.00,
      sku: 'THER-002',
      stock: 60,
      images: ['/logos/products/bonding.jpg'],
      category_id: createdCategories['bonding-agents'],
    },
    {
      name: 'Endodontic File Set',
      name_ka: 'ენდოდონტიური ფაილების ნაკრები',
      description: 'Rotary file system for root canal treatment',
      description_ka: 'ბრუნვითი ფაილების სისტემა ფესვის არხის მკურნალობისთვის',
      price: 120.00,
      sku: 'THER-003',
      stock: 30,
      images: ['/logos/products/endofiles.jpg'],
      category_id: createdCategories['endodontics'],
    },
    // Model Manufacturing products
    {
      name: 'Alginate Impression Material 500g',
      name_ka: 'ალგინატის ანაბეჭდის მასალა 500გ',
      description: 'Fast-setting alginate for dental impressions',
      description_ka: 'სწრაფად გამაგრებადი ალგინატი ანაბეჭდებისთვის',
      price: 28.00,
      sku: 'MOD-001',
      stock: 100,
      images: ['/logos/products/alginate.jpg'],
      category_id: createdCategories['impression-materials'],
    },
    {
      name: 'Dental Gypsum Type IV',
      name_ka: 'სტომატოლოგიური თაბაშირი IV ტიპი',
      description: 'High-strength dental stone',
      description_ka: 'მაღალი სიმტკიცის სტომატოლოგიური თაბაშირი',
      price: 35.00,
      sku: 'MOD-002',
      stock: 80,
      images: ['/logos/products/gypsum.jpg'],
      category_id: createdCategories['gypsum-products'],
    },
    // Surgery products
    {
      name: 'Surgical Instrument Kit',
      name_ka: 'ქირურგიული ინსტრუმენტების ნაკრები',
      description: 'Complete surgical extraction kit',
      description_ka: 'სრული ქირურგიული ექსტრაქციის ნაკრები',
      price: 450.00,
      sale_price: 399.00,
      sku: 'SURG-001',
      stock: 15,
      images: ['/logos/products/surgical-kit.jpg'],
      category_id: createdCategories['surgical-instruments'],
    },
    {
      name: 'Dental Implant System',
      name_ka: 'სტომატოლოგიური იმპლანტის სისტემა',
      description: 'Titanium implant with abutment',
      description_ka: 'ტიტანის იმპლანტი აბატმენტთან ერთად',
      price: 280.00,
      sku: 'SURG-002',
      stock: 50,
      images: ['/logos/products/implant.jpg'],
      category_id: createdCategories['implants'],
    },
    {
      name: 'Bone Graft Material 1g',
      name_ka: 'ძვლის გრაფტის მასალა 1გ',
      description: 'Synthetic bone graft for regeneration',
      description_ka: 'სინთეზური ძვლის გრაფტი რეგენერაციისთვის',
      price: 180.00,
      sku: 'SURG-003',
      stock: 25,
      images: ['/logos/products/bone-graft.jpg'],
      category_id: createdCategories['bone-grafts'],
    },
    // Orthodontics products
    {
      name: 'Metal Brackets Set',
      name_ka: 'მეტალის ბრეკეტების ნაკრები',
      description: 'Stainless steel orthodontic brackets',
      description_ka: 'უჟანგავი ფოლადის ორთოდონტიული ბრეკეტები',
      price: 95.00,
      sku: 'ORTH-001',
      stock: 40,
      images: ['/logos/products/brackets.jpg'],
      category_id: createdCategories['brackets'],
    },
    {
      name: 'NiTi Archwire Set',
      name_ka: 'NiTi რკალის მავთულის ნაკრები',
      description: 'Nickel-titanium archwires assortment',
      description_ka: 'ნიკელ-ტიტანის რკალის მავთულების ასორტიმენტი',
      price: 55.00,
      sku: 'ORTH-002',
      stock: 60,
      images: ['/logos/products/wires.jpg'],
      category_id: createdCategories['wires'],
    },
    // Prosthetics products
    {
      name: 'Zirconia Crown Block',
      name_ka: 'ცირკონიუმის გვირგვინის ბლოკი',
      description: 'Pre-shaded zirconia for CAD/CAM',
      description_ka: 'წინასწარ შეფერილი ცირკონიუმი CAD/CAM-ისთვის',
      price: 120.00,
      sku: 'PROS-001',
      stock: 30,
      images: ['/logos/products/zirconia.jpg'],
      category_id: createdCategories['fixed-prosthetics'],
    },
    {
      name: 'Denture Base Resin',
      name_ka: 'პროთეზის ბაზის ფისი',
      description: 'Heat-curing acrylic for dentures',
      description_ka: 'თერმოგამაგრებადი აკრილი პროთეზებისთვის',
      price: 65.00,
      sku: 'PROS-002',
      stock: 45,
      images: ['/logos/products/denture-resin.jpg'],
      category_id: createdCategories['removable-prosthetics'],
    },
    // Fixation products
    {
      name: 'Temporary Cement',
      name_ka: 'დროებითი ცემენტი',
      description: 'Eugenol-free temporary cement',
      description_ka: 'ევგენოლის გარეშე დროებითი ცემენტი',
      price: 25.00,
      sku: 'FIX-001',
      stock: 80,
      images: ['/logos/products/temp-cement.jpg'],
      category_id: createdCategories['temporary-cements'],
    },
    {
      name: 'Resin Cement Dual-Cure',
      name_ka: 'ფისის ცემენტი ორმაგი გამაგრების',
      description: 'Dual-cure resin cement for permanent cementation',
      description_ka: 'ორმაგი გამაგრების ფისის ცემენტი მუდმივი ფიქსაციისთვის',
      price: 95.00,
      sku: 'FIX-002',
      stock: 50,
      images: ['/logos/products/resin-cement.jpg'],
      category_id: createdCategories['permanent-cements'],
    },
  ];

  for (const product of productsData) {
    if (product.category_id) {
      await prisma.products.create({
        data: product,
      });
    }
  }

  // Create a test admin user
  await prisma.users.create({
    data: {
      email: 'admin@dentalmall.ge',
      name: 'Admin',
      password: '$2b$10$placeholder_hash',
      role: 'ADMIN',
    },
  });

  const parentCount = categoriesData.length;
  const subcategoryCount = categoriesData.reduce((acc, cat) => acc + cat.subcategories.length, 0);

  console.log('Seed completed successfully!');
  console.log('Created:');
  console.log(`- ${parentCount} parent categories`);
  console.log(`- ${subcategoryCount} subcategories`);
  console.log(`- ${productsData.length} products`);
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
