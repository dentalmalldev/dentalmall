export interface Product {
  id: string;
  name: string;
  manufacturer: string;
  image: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  categoryId: string;
  subcategoryId: string;
  description?: string;
  inStock?: boolean;
}

// Sample images (using placeholder URLs)
const IMAGES = {
  mask: "https://media.istockphoto.com/id/1206385911/photo/medical-mask.jpg?s=612x612&w=0&k=20&c=9YTEb6CENsGk5TIhK1S9EXXyXvqDSrPCixD3jOuIKnM=",
  gloves: "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=400",
  syringe: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400",
  dental: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=400",
  tools: "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=400",
  sterilizer: "https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=400",
  implant: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400",
  composite: "https://images.unsplash.com/photo-1612776572997-76cc42e058c3?w=400",
};

export const mockProducts: Product[] = [
  // Sterilization - Equipment
  {
    id: "prod-001",
    name: "ავტოკლავი კლასი B",
    manufacturer: "Melag",
    image: IMAGES.sterilizer,
    price: 4500,
    originalPrice: 5200,
    discount: 13,
    categoryId: "sterilization",
    subcategoryId: "sterilization-equipment",
    inStock: true,
  },
  {
    id: "prod-002",
    name: "UV სტერილიზატორი",
    manufacturer: "Dental Pro",
    image: IMAGES.sterilizer,
    price: 890,
    categoryId: "sterilization",
    subcategoryId: "sterilization-equipment",
    inStock: true,
  },
  {
    id: "prod-003",
    name: "სტერილიზაციის კონტეინერი",
    manufacturer: "Hu-Friedy",
    image: IMAGES.tools,
    price: 320,
    originalPrice: 380,
    discount: 16,
    categoryId: "sterilization",
    subcategoryId: "sterilization-equipment",
    inStock: true,
  },

  // Sterilization - Solutions
  {
    id: "prod-004",
    name: "სადეზინფექციო ხსნარი 5L",
    manufacturer: "Zeta",
    image: IMAGES.dental,
    price: 85,
    categoryId: "sterilization",
    subcategoryId: "sterilization-solutions",
    inStock: true,
  },
  {
    id: "prod-005",
    name: "ინსტრუმენტების საწმენდი",
    manufacturer: "Durr Dental",
    image: IMAGES.dental,
    price: 120,
    originalPrice: 150,
    discount: 20,
    categoryId: "sterilization",
    subcategoryId: "sterilization-solutions",
    inStock: true,
  },

  // Sterilization - Pouches
  {
    id: "prod-006",
    name: "სტერილიზაციის პაკეტები 200 ცალი",
    manufacturer: "Medicom",
    image: IMAGES.mask,
    price: 45,
    categoryId: "sterilization",
    subcategoryId: "sterilization-pouches",
    inStock: true,
  },
  {
    id: "prod-007",
    name: "თვითბლოკავი პაკეტები",
    manufacturer: "3M",
    image: IMAGES.mask,
    price: 65,
    originalPrice: 75,
    discount: 13,
    categoryId: "sterilization",
    subcategoryId: "sterilization-pouches",
    inStock: true,
  },

  // Surgery - Instruments
  {
    id: "prod-008",
    name: "ქირურგიული პინცეტი",
    manufacturer: "Hu-Friedy",
    image: IMAGES.tools,
    price: 180,
    categoryId: "surgery",
    subcategoryId: "surgical-instruments",
    inStock: true,
  },
  {
    id: "prod-009",
    name: "ამომზიდველების ნაკრები",
    manufacturer: "Meisinger",
    image: IMAGES.tools,
    price: 450,
    originalPrice: 520,
    discount: 13,
    categoryId: "surgery",
    subcategoryId: "surgical-instruments",
    inStock: true,
  },
  {
    id: "prod-010",
    name: "პერიოსტალური ელევატორი",
    manufacturer: "Carl Martin",
    image: IMAGES.tools,
    price: 95,
    categoryId: "surgery",
    subcategoryId: "surgical-instruments",
    inStock: true,
  },

  // Surgery - Implants
  {
    id: "prod-011",
    name: "დენტალური იმპლანტი 4.0x10mm",
    manufacturer: "Straumann",
    image: IMAGES.implant,
    price: 850,
    categoryId: "surgery",
    subcategoryId: "implants",
    inStock: true,
  },
  {
    id: "prod-012",
    name: "იმპლანტის აბატმენტი",
    manufacturer: "Nobel Biocare",
    image: IMAGES.implant,
    price: 420,
    originalPrice: 480,
    discount: 12,
    categoryId: "surgery",
    subcategoryId: "implants",
    inStock: true,
  },
  {
    id: "prod-013",
    name: "იმპლანტის ჰილინგ აბატმენტი",
    manufacturer: "Osstem",
    image: IMAGES.implant,
    price: 120,
    categoryId: "surgery",
    subcategoryId: "implants",
    inStock: true,
  },

  // Surgery - Bone Grafts
  {
    id: "prod-014",
    name: "ძვლის გრაფტი 0.5გ",
    manufacturer: "Geistlich",
    image: IMAGES.dental,
    price: 380,
    categoryId: "surgery",
    subcategoryId: "bone-grafts",
    inStock: true,
  },
  {
    id: "prod-015",
    name: "კოლაგენის მემბრანა",
    manufacturer: "BioGide",
    image: IMAGES.dental,
    price: 290,
    originalPrice: 340,
    discount: 15,
    categoryId: "surgery",
    subcategoryId: "bone-grafts",
    inStock: true,
  },

  // Therapy - Composites
  {
    id: "prod-016",
    name: "ნანო კომპოზიტი A2",
    manufacturer: "3M ESPE",
    image: IMAGES.composite,
    price: 145,
    categoryId: "therapy",
    subcategoryId: "composites",
    inStock: true,
  },
  {
    id: "prod-017",
    name: "ფლოუ კომპოზიტი",
    manufacturer: "Kerr",
    image: IMAGES.composite,
    price: 95,
    originalPrice: 110,
    discount: 14,
    categoryId: "therapy",
    subcategoryId: "composites",
    inStock: true,
  },
  {
    id: "prod-018",
    name: "კომპოზიტების ნაკრები 7 ფერი",
    manufacturer: "GC",
    image: IMAGES.composite,
    price: 680,
    categoryId: "therapy",
    subcategoryId: "composites",
    inStock: true,
  },

  // Therapy - Bonding Agents
  {
    id: "prod-019",
    name: "უნივერსალური ბონდინგი",
    manufacturer: "3M",
    image: IMAGES.dental,
    price: 220,
    categoryId: "therapy",
    subcategoryId: "bonding-agents",
    inStock: true,
  },
  {
    id: "prod-020",
    name: "ტოტალ ეჩ ბონდინგ სისტემა",
    manufacturer: "Ivoclar",
    image: IMAGES.dental,
    price: 185,
    originalPrice: 210,
    discount: 12,
    categoryId: "therapy",
    subcategoryId: "bonding-agents",
    inStock: true,
  },

  // Therapy - Endodontics
  {
    id: "prod-021",
    name: "ენდო ფაილები 25mm",
    manufacturer: "Dentsply",
    image: IMAGES.tools,
    price: 75,
    categoryId: "therapy",
    subcategoryId: "endodontics",
    inStock: true,
  },
  {
    id: "prod-022",
    name: "გუტაპერჩის წვერები",
    manufacturer: "Meta",
    image: IMAGES.dental,
    price: 35,
    categoryId: "therapy",
    subcategoryId: "endodontics",
    inStock: true,
  },
  {
    id: "prod-023",
    name: "ენდო სილერი",
    manufacturer: "Sealapex",
    image: IMAGES.dental,
    price: 120,
    originalPrice: 140,
    discount: 14,
    categoryId: "therapy",
    subcategoryId: "endodontics",
    inStock: true,
  },

  // Orthodontics - Brackets
  {
    id: "prod-024",
    name: "მეტალის ბრეკეტები Roth",
    manufacturer: "Ormco",
    image: IMAGES.dental,
    price: 320,
    categoryId: "orthodontics",
    subcategoryId: "brackets",
    inStock: true,
  },
  {
    id: "prod-025",
    name: "კერამიკული ბრეკეტები",
    manufacturer: "3M Clarity",
    image: IMAGES.dental,
    price: 580,
    originalPrice: 650,
    discount: 11,
    categoryId: "orthodontics",
    subcategoryId: "brackets",
    inStock: true,
  },

  // Orthodontics - Wires
  {
    id: "prod-026",
    name: "NiTi რკალი .016",
    manufacturer: "Ormco",
    image: IMAGES.tools,
    price: 45,
    categoryId: "orthodontics",
    subcategoryId: "wires",
    inStock: true,
  },
  {
    id: "prod-027",
    name: "სტეინლეს სტილ რკალი",
    manufacturer: "American Ortho",
    image: IMAGES.tools,
    price: 35,
    categoryId: "orthodontics",
    subcategoryId: "wires",
    inStock: true,
  },

  // Orthodontics - Aligners
  {
    id: "prod-028",
    name: "ალაინერის მასალა",
    manufacturer: "Essix",
    image: IMAGES.dental,
    price: 180,
    categoryId: "orthodontics",
    subcategoryId: "aligners",
    inStock: true,
  },

  // Prosthetics - Fixed
  {
    id: "prod-029",
    name: "ცირკონის ბლოკი",
    manufacturer: "Ivoclar",
    image: IMAGES.dental,
    price: 420,
    categoryId: "prosthetics",
    subcategoryId: "fixed-prosthetics",
    inStock: true,
  },
  {
    id: "prod-030",
    name: "E.max პრესი LT",
    manufacturer: "Ivoclar",
    image: IMAGES.dental,
    price: 185,
    originalPrice: 210,
    discount: 12,
    categoryId: "prosthetics",
    subcategoryId: "fixed-prosthetics",
    inStock: true,
  },

  // Prosthetics - Removable
  {
    id: "prod-031",
    name: "აკრილის ფუძე ვარდისფერი",
    manufacturer: "Vertex",
    image: IMAGES.dental,
    price: 95,
    categoryId: "prosthetics",
    subcategoryId: "removable-prosthetics",
    inStock: true,
  },
  {
    id: "prod-032",
    name: "პროთეზის კბილები ნაკრები",
    manufacturer: "Ivoclar",
    image: IMAGES.dental,
    price: 145,
    categoryId: "prosthetics",
    subcategoryId: "removable-prosthetics",
    inStock: true,
  },

  // Disposable Systems
  {
    id: "prod-033",
    name: "ერთჯერადი პირბადე 50 ცალი",
    manufacturer: "Medicom",
    image: IMAGES.mask,
    price: 25,
    categoryId: "disposable_systems_accessories",
    subcategoryId: "disposable_systems_accessories",
    inStock: true,
  },
  {
    id: "prod-034",
    name: "ნიტრილის ხელთათმანი M",
    manufacturer: "Aurelia",
    image: IMAGES.gloves,
    price: 45,
    originalPrice: 55,
    discount: 18,
    categoryId: "disposable_systems_accessories",
    subcategoryId: "disposable_systems_accessories",
    inStock: true,
  },
  {
    id: "prod-035",
    name: "სანერწყვე 500 ცალი",
    manufacturer: "Dental Pro",
    image: IMAGES.dental,
    price: 35,
    categoryId: "disposable_systems_accessories",
    subcategoryId: "disposable_systems_accessories",
    inStock: true,
  },

  // Periodontology - Scaling
  {
    id: "prod-036",
    name: "ულტრაბგერითი სკეილერი",
    manufacturer: "EMS",
    image: IMAGES.tools,
    price: 1200,
    originalPrice: 1400,
    discount: 14,
    categoryId: "periodontology",
    subcategoryId: "scaling-instruments",
    inStock: true,
  },
  {
    id: "prod-037",
    name: "გრეისის კიურეტები ნაკრები",
    manufacturer: "Hu-Friedy",
    image: IMAGES.tools,
    price: 380,
    categoryId: "periodontology",
    subcategoryId: "scaling-instruments",
    inStock: true,
  },

  // Fixation Materials
  {
    id: "prod-038",
    name: "დროებითი ცემენტი",
    manufacturer: "3M RelyX",
    image: IMAGES.dental,
    price: 85,
    categoryId: "fixation_materials",
    subcategoryId: "temporary-cements",
    inStock: true,
  },
  {
    id: "prod-039",
    name: "მუდმივი ცემენტი",
    manufacturer: "GC Fuji",
    image: IMAGES.dental,
    price: 165,
    originalPrice: 190,
    discount: 13,
    categoryId: "fixation_materials",
    subcategoryId: "permanent-cements",
    inStock: true,
  },

  // Model Manufacturing
  {
    id: "prod-040",
    name: "ანაბეჭდის მასალა",
    manufacturer: "Zhermack",
    image: IMAGES.dental,
    price: 120,
    categoryId: "model_manufacturing",
    subcategoryId: "impression-materials",
    inStock: true,
  },
  {
    id: "prod-041",
    name: "თაბაშირი IV ტიპი",
    manufacturer: "GC Fujirock",
    image: IMAGES.dental,
    price: 95,
    categoryId: "model_manufacturing",
    subcategoryId: "gypsum-products",
    inStock: true,
  },

  // CAD/CAM
  {
    id: "prod-042",
    name: "ფრეზირების ბლოკი PMMA",
    manufacturer: "Ivoclar",
    image: IMAGES.dental,
    price: 85,
    categoryId: "cad_cam_manufacturing",
    subcategoryId: "milling-blocks",
    inStock: true,
  },
  {
    id: "prod-043",
    name: "ვაქსის ბლოკი CAD",
    manufacturer: "Amann Girrbach",
    image: IMAGES.dental,
    price: 45,
    categoryId: "cad_cam_manufacturing",
    subcategoryId: "milling-blocks",
    inStock: true,
  },
];

// Helper functions
export function getProductsByCategory(categoryId: string): Product[] {
  return mockProducts.filter((product) => product.categoryId === categoryId);
}

export function getProductsBySubcategory(subcategoryId: string): Product[] {
  return mockProducts.filter((product) => product.subcategoryId === subcategoryId);
}

export function getProductById(id: string): Product | undefined {
  return mockProducts.find((product) => product.id === id);
}

export function getFeaturedProducts(limit: number = 8): Product[] {
  return mockProducts.filter((product) => product.discount).slice(0, limit);
}

export function searchProducts(query: string): Product[] {
  const lowerQuery = query.toLowerCase();
  return mockProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(lowerQuery) ||
      product.manufacturer.toLowerCase().includes(lowerQuery)
  );
}
