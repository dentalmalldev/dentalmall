import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Categories data from translation files
const categoriesData = [
  {
    slug: "sterilization",
    name: "Sterilization",
    name_ka: "სტერილიზაცია",
    subcategories: [
      {
        slug: "disinfectant-solutions",
        name: "Disinfectant Solutions",
        name_ka: "სადეზინფექციო ხსნარები",
      },
      {
        slug: "packaging-materials",
        name: "Packaging Materials",
        name_ka: "შესაფუთი მასალები",
      },
      {
        slug: "sterilization-equipment",
        name: "Sterilization Equipment",
        name_ka: "სასტერილიზაციო ტექნიკა",
      },
      {
        slug: "indicators",
        name: "Indicators",
        name_ka: "ინდიკატორები",
      },
      {
        slug: "containers",
        name: "Containers",
        name_ka: "კონტეინერები",
      },
    ],
  },
  {
    slug: "prosthetics",
    name: "Prosthetics",
    name_ka: "პროთეზირება",
    subcategories: [
      {
        slug: "bite-registration",
        name: "Bite Registration/Bite Registration Waxes",
        name_ka: "თანკბილვის რეგისტრაცია",
      },
      {
        slug: "composite-materials",
        name: "Composite Materials",
        name_ka: "კომპოზიტური მასალები",
      },
      { slug: "bonding-agent", name: "Bonding Agent", name_ka: "ბონდი" },
      {
        slug: "brushes-and-application-aids",
        name: "Brushes and Application Aids",
        name_ka: "ფუნჯები და აპლიკატორები",
      },
      {
        slug: "orthodontic-pliers",
        name: "Orthodontic Pliers",
        name_ka: "მოსახრავი და მავთულის საჭრელი ტანგები",
      },
      {
        slug: "cold-curing-resins",
        name: "Cold-Curing Resins",
        name_ka: "ცივად გამყარებადი პოლიმერი",
      },
      {
        slug: "duplicating-materials",
        name: "Duplicating Materials",
        name_ka: "საანაბეჭდო მასალები",
      },
      {
        slug: "gingival-masks",
        name: "Gingival Masks",
        name_ka: "ხელოვნური ღრძილი (სატექნიკო მასალა)",
      },
      {
        slug: "heat-curing-resins",
        name: "Heat-Curing Resins",
        name_ka: "თბოგამყარებადი პოლიმერები",
      },
      {
        slug: "light-curing-units",
        name: "Light-Curing Units",
        name_ka: "ულტრაიისფერი სხივის აპარატები",
      },
      {
        slug: "measuring-devices",
        name: "Measuring Devices",
        name_ka: "საზომი მოწყობილობები",
      },
      {
        slug: "metal-foils",
        name: "Metal Foils",
        name_ka: "ლითონის ფოლგები (სატექნიკო მასალა)",
      },
      {
        slug: "mixing-beaker",
        name: "Mixing Beaker",
        name_ka: "შესარევი ჭიქები",
      },
      {
        slug: "needles-and-dosing-aids",
        name: "Needles and Dosing Aids",
        name_ka: "(სილიკონის) შემრევი თავები და თოფები",
      },
      {
        slug: "polishing-agents",
        name: "Polishing Agents",
        name_ka: "საპრიალებელი მასალები",
      },
      {
        slug: "prostheses-cleaning-agent",
        name: "Prostheses Cleaning Agent",
        name_ka: "პროთეზის გასაწმენდი საშუალებები",
      },
      { slug: "prosthetic-waxes", name: "Prosthetic Waxes", name_ka: "ცვილი" },
      {
        slug: "reinforcing-materials",
        name: "Reinforcing Materials",
        name_ka: "გასამყარებელი მასალები (სატექნიკო)",
      },
      {
        slug: "relining-materials",
        name: "Relining Materials",
        name_ka: "პერებაზირების მასალები",
      },
      {
        slug: "relining-units",
        name: "Relining Units",
        name_ka: "პერებაზირების აპარატები",
      },
      {
        slug: "separating-agents",
        name: "Separating Agents",
        name_ka: "გამყოფი საშუალებები",
      },
      {
        slug: "shade-guide",
        name: "Shade Guide",
        name_ka: "ფერთა გამები (შკალა)",
      },
      {
        slug: "spare-parts-and-accessories-prosthetics",
        name: "Spare Parts and Accessories",
        name_ka: "სათადარიგო ნაწილები და აქსესუარები",
      },
      {
        slug: "special-resins",
        name: "Special Resins",
        name_ka: "სპეციალური რეზინები (ფისი)",
      },
      {
        slug: "sticky-waxes",
        name: "Sticky Waxes",
        name_ka: "სამოდელირო ცვილი (სატექნიკო)",
      },
      { slug: "teeth", name: "Teeth", name_ka: "გარნიტურის კბილები" },
      {
        slug: "telescopic-pliers",
        name: "Telescopic Pliers",
        name_ka: "გვირგვინის მოსახსნელი ინსტრუმენტი",
      },
      {
        slug: "tray-materials",
        name: "Tray Materials",
        name_ka: "ინდივიდუალური კოვზის მასალა",
      },
      {
        slug: "bite-registration-2",
        name: "Bite Registration",
        name_ka: "თანკბილვის რეგისტრაცია",
      },
      {
        slug: "impression-materials",
        name: "Impression Materials",
        name_ka: "საანაბეჭდო მასალები",
      },
      {
        slug: "impression-trays",
        name: "Impression Trays",
        name_ka: "საანაბეჭდო კოვზები",
      },
      { slug: "mixing-aids", name: "Mixing Aids", name_ka: "შესარევი თავები" },
      {
        slug: "silicone-putties",
        name: "Silicone Putties",
        name_ka: "სილიკონის მასები (ცომები)",
      },
      {
        slug: "spare-parts-and-accessories-impression",
        name: "Spare Parts and Accessories",
        name_ka: "სათადარიგო ნაწილები და აქსესუარები",
      },
      {
        slug: "tray-adhesives",
        name: "Tray Adhesives",
        name_ka: "კოვზის წებოები",
      },
      { slug: "vaseline", name: "Vaseline", name_ka: "ვაზელინი" },
    ],
  },
  {
    slug: "model_manufacturing",
    name: "Model Manufacturing",
    name_ka: "მოდელის დამზადება",
    subcategories: [
      {
        slug: "accessories-for-workplace",
        name: "Accessories for the Workplace",
        name_ka: "სამუშაო ადგილის აქსესუარები",
      },
      {
        slug: "alabaster-plaster",
        name: "Alabaster Plaster",
        name_ka: "თაბაშირი",
      },
      {
        slug: "articulators-and-accessories",
        name: "Articulators and Accessories for Articulators",
        name_ka: "არტიკულატორები და მათი აქსესუარები",
      },
      {
        slug: "base-moulds",
        name: "Base Moulds",
        name_ka: "ბაზისის(ფუნდამენტის) ფორმები",
      },
      {
        slug: "bite-registration",
        name: "Bite Registration",
        name_ka: "თანკბილვის რეგისტრაცია",
      },
      {
        slug: "brushes-and-application-aids",
        name: "Brushes and Application Aids",
        name_ka: "ფუნჯები და აპლიკატორები",
      },
      {
        slug: "die-arch-and-belt-grinders",
        name: "Die Arch and Belt Grinders",
        name_ka: "მოდელის თაღისა და ლენტის სახეხები",
      },
      {
        slug: "die-material",
        name: "Die Material",
        name_ka: "მოდელის მასალა",
      },
      {
        slug: "die-spacers",
        name: "Die Spacers",
        name_ka: "სპეისერები მოდელისთვის",
      },
      {
        slug: "duplicating-materials",
        name: "Duplicating Materials",
        name_ka: "დუბლირების მასალები",
      },
      {
        slug: "duplicating-units-and-flasks",
        name: "Duplicating Units and Duplicating Flasks",
        name_ka: "დუბლირების აპარატები და ფლასკები",
      },
      {
        slug: "flocculant",
        name: "Flocculant",
        name_ka: "ფლოკულანტი",
      },
      {
        slug: "hard-plasters",
        name: "Hard Plasters",
        name_ka: "მყარი თაბაშირები",
      },
      {
        slug: "impression-plasters",
        name: "Impression Plasters",
        name_ka: "საანაბეჭდო თაბაშირები",
      },
      {
        slug: "instant-glue",
        name: "Instant Glue",
        name_ka: "სწრაფმაგრი წებო",
      },
      {
        slug: "marking-aids",
        name: "Marking Aids",
        name_ka: "მარკირების საშუალებები",
      },
      {
        slug: "mixing-beaker",
        name: "Mixing Beaker",
        name_ka: "შესარევი ჭიქა",
      },
      {
        slug: "mixing-devices",
        name: "Mixing Devices",
        name_ka: "შესარევი მოწყობილობები",
      },
      {
        slug: "model-hardeners",
        name: "Model Hardeners",
        name_ka: "მოდელის გამამყარებლები",
      },
      {
        slug: "model-saws-and-saw-blades",
        name: "Model Saws and Saw Blades",
        name_ka: "მოდელის ხერხები და პირები",
      },
      {
        slug: "model-systems",
        name: "Model Systems",
        name_ka: "მოდელის სისტემები",
      },
      {
        slug: "orthodontic-plasters",
        name: "Orthodontic Plasters",
        name_ka: "ორთოდონტიული თაბაშირები",
      },
      {
        slug: "orthodontics",
        name: "Orthodontics",
        name_ka: "ორთოდონტია",
      },
      {
        slug: "pin-drilling-units",
        name: "Pin Drilling Units",
        name_ka: "პინების ბურღვის აპარატები",
      },
      {
        slug: "pins",
        name: "Pins",
        name_ka: "პინები",
      },
      {
        slug: "plaster-dissolver-and-alginate-remover",
        name: "Plaster Dissolver and Alginate Remover",
        name_ka: "თაბაშირის გამხსნელი და ალგინატის დამშლელი",
      },
      {
        slug: "plaster-hardener",
        name: "Plaster Hardener",
        name_ka: "თაბაშირის გამამყარებელი",
      },
      {
        slug: "plaster-separator",
        name: "Plaster Separator",
        name_ka: "თაბაშირის გამყოფი",
      },
      {
        slug: "separating-agents",
        name: "Separating Agents",
        name_ka: "გამყოფი საშუალებები",
      },
      {
        slug: "silicone-putties",
        name: "Silicone Putties",
        name_ka: "სილიკონის მასალები",
      },
      {
        slug: "spare-parts-and-accessories",
        name: "Spare Parts and Accessories",
        name_ka: "სათადარიგო ნაწილები და აქსესუარები",
      },
      {
        slug: "splitcast-systems",
        name: "Splitcast Systems",
        name_ka: "სპლიტკასტის სისტემები",
      },
      {
        slug: "super-hard-plasters",
        name: "Super Hard Plasters",
        name_ka: "სუპერ მყარი თაბაშირები",
      },
      {
        slug: "trimmer-and-trimming-discs",
        name: "Trimmer and Trimming Discs",
        name_ka: "საზუსტი აპარატები და დისკები",
      },
      {
        slug: "vacuum-mixing-units",
        name: "Vacuum Mixing Units",
        name_ka: "ვაკუუმური შერევის მოწყობილობები",
      },
      {
        slug: "vacuum-pumps",
        name: "Vacuum Pumps",
        name_ka: "ვაკუუმ ტუმბოები",
      },
      {
        slug: "vibrators",
        name: "Vibrators",
        name_ka: "ვიბრირებადი მაგიდები",
      },
    ],
  },
  {
    slug: "fixation",
    name: "Fixation",
    name_ka: "საფიქსაციო საშუალებები",
    subcategories: [
      {
        slug: "bonding-agent",
        name: "Bonding Agent",
        name_ka: "ბონდი",
      },
      {
        slug: "composite-adhesive",
        name: "Composite Adhesive",
        name_ka: "კომპოზიტური ადჰეზიური საშუალებები",
      },
      {
        slug: "etching-agents",
        name: "Etching Agents",
        name_ka: "მჟავას აგენტები (ეჩირება)",
      },
      {
        slug: "fixing-systems",
        name: "Fixing Systems",
        name_ka: "დამაგრების სისტემები",
      },
      {
        slug: "mixing-aids",
        name: "Mixing Aids",
        name_ka: "შემრევები",
      },
      {
        slug: "retention-aids",
        name: "Retention Aids",
        name_ka: "ფიქსაციის დამხმარე საშუალებები",
      },
      {
        slug: "veneer-fixation",
        name: "Veneer Fixation",
        name_ka: "ვინირების საფიქსაციო",
      },
    ],
  },
  {
    slug: "waste_disposal",
    name: "Waste Disposal",
    name_ka: "უტილიზაცია",
    subcategories: [
      {
        slug: "infectious-waste-container",
        name: "Infectious Waste Container / Cardboard Container for Sharp Instruments",
        name_ka: "ინფექციური ნარჩენების კონტეინერები",
      },
      {
        slug: "non-hazardous-waste-bin",
        name: "Non-Hazardous Waste Bin",
        name_ka: "არასახიფათო ნარჩენების ურნა",
      },
      {
        slug: "stickers",
        name: "Stickers",
        name_ka: "სტიკერები",
      },
      {
        slug: "non-hazardous-waste-bags",
        name: "Non-Hazardous Waste Bags (Black)",
        name_ka: "არასახიფათო ნარჩენების პარკები (შავი)",
      },
      {
        slug: "hazardous-waste-bags",
        name: "Hazardous Waste Bags (Yellow)",
        name_ka: "სახიფათო ნარჩენების პარკი (ყვითელი)",
      },
    ],
  },
  {
    slug: "therapy",
    name: "Therapy",
    name_ka: "თერაპია",
    subcategories: [
      {
        slug: "therapeutic-sets",
        name: "Therapeutic Sets (probe, mirror, tweezers, plugger)",
        name_ka: "თერაპიული ანაწყობები (ზონდი, სარკე, პინცეტი, ფითხი)",
      },
      {
        slug: "liquid-and-solid-fillings",
        name: "Liquid and Solid Fillings",
        name_ka: "თხევადი და მყარი ბჟენები",
      },
      {
        slug: "therapeutic-burs",
        name: "Therapeutic Burs",
        name_ka: "თერაპიული ბორები",
      },
      {
        slug: "endodontic-materials",
        name: "Endodontic Materials",
        name_ka: "ენდოდონტიური მასალები",
      },
      {
        slug: "strips",
        name: "Strips",
        name_ka: "შტრიფსები",
      },
      {
        slug: "therapeutic-applicator",
        name: "Therapeutic Applicator",
        name_ka: "თერაპიული აპლიკატორი",
      },
      {
        slug: "fixation-materials",
        name: "Fixation Materials (bond, etch)",
        name_ka: "საფიქსაციო მასალები (ბონდი, ეტჩი)",
      },
      {
        slug: "equipment",
        name: "Equipment",
        name_ka: "ტექნიკა",
      },
      {
        slug: "isolation-systems",
        name: "Isolation Systems (latex, frame, clamps, forceps, perforator)",
        name_ka:
          "საიზოლაციო სისტემები (ლატექსი, ჩარჩო, კლამერები, მაშა, პერფორატორი)",
      },
      {
        slug: "irrigation-solutions",
        name: "Irrigation Solutions",
        name_ka: "საირიგაციო ხსნარები",
      },
    ],
  },
  {
    slug: "periodontology",
    name: "Periodontology",
    name_ka: "პაროდონტოლოგია",
    subcategories: [
      {
        slug: "powders",
        name: "Powders",
        name_ka: "ფხვნილები",
      },
      {
        slug: "interdental-brushes",
        name: "Interdental Brushes",
        name_ka: "კბილთაშორისი ჯაგრისები",
      },
      {
        slug: "periodontal-gel",
        name: "Periodontal Gel",
        name_ka: "პაროდონტოლოგიური გელი",
      },
      {
        slug: "periodontal-rinses",
        name: "Periodontal Rinses",
        name_ka: "პაროდონტოლოგიური სავლები",
      },
      {
        slug: "colored-applicator",
        name: "Colored Applicator",
        name_ka: "ფერადი აპლიკატორი",
      },
      {
        slug: "periodontal-equipment",
        name: "Periodontal Equipment",
        name_ka: "პაროდონტოლოგიური ტექნიკა",
      },
      {
        slug: "equipment",
        name: "Equipment",
        name_ka: "ტექნიკა",
      },
      {
        slug: "curettes",
        name: "Curettes",
        name_ka: "კიურეტები",
      },
      {
        slug: "scaler-tips",
        name: "Scaler Tips",
        name_ka: "სკალერის თავები",
      },
      {
        slug: "furcation-instruments",
        name: "Furcation Instruments",
        name_ka: "ფურკაციის ინსტრუმენტები",
      },
      {
        slug: "explorer",
        name: "Explorer",
        name_ka: "ექსპლორერი",
      },
      {
        slug: "florida-probe",
        name: "Florida Probe",
        name_ka: "ფლოროდაპროუბი",
      },
      {
        slug: "electronic-probe",
        name: "Electronic Probe",
        name_ka: "ელექტრონული ზონდი",
      },
      {
        slug: "laser-and-laser-tips",
        name: "Laser + Laser Tips",
        name_ka: "ლაზერი + ლაზერის თავები",
      },
    ],
  },
  {
    slug: "modeling",
    name: "Modeling",
    name_ka: "მოდელირება",
    subcategories: [
      {
        slug: "attachment-technique",
        name: "Attachment Technique",
        name_ka: "სამაგრები",
      },
      {
        slug: "bonding-agent",
        name: "Bonding Agent",
        name_ka: "ლაბორატორიული ბონდი",
      },
      {
        slug: "brushes-and-application-aids",
        name: "Brushes and Application Aids",
        name_ka: "ფუნჯები და აპლიკატორები",
      },
      {
        slug: "ceramic-instruments",
        name: "Ceramic Instruments",
        name_ka: "კერამიკის ინსტრუმენტები",
      },
      {
        slug: "dipping-wax-units",
        name: "Dipping Wax Units",
        name_ka: "ცვილით მოდელირება",
      },
      {
        slug: "dipping-waxes",
        name: "Dipping Waxes",
        name_ka: "ცვილი",
      },
      {
        slug: "duplicating-units-and-flasks",
        name: "Duplicating Units and Duplicating Flasks",
        name_ka: "დუბლირების აპარატები და ფლასკები",
      },
      {
        slug: "instrument-sets",
        name: "Instrument Sets",
        name_ka: "ინსტრუმენტების ნაკრებები",
      },
      {
        slug: "modelling-instruments",
        name: "Modelling Instruments",
        name_ka: "მოდელირების ინსტრუმენტები",
      },
      {
        slug: "partial-denture-waxes",
        name: "Partial Denture Waxes",
        name_ka: "ცვილი",
      },
      {
        slug: "retention-aids",
        name: "Retention Aids",
        name_ka: "ფიქსაციის დამხმარე საშუალებები",
      },
      {
        slug: "root-pins",
        name: "Root Pins",
        name_ka: "ფესვის პინები",
      },
      {
        slug: "scalpels",
        name: "Scalpels",
        name_ka: "სკალპელები",
      },
      {
        slug: "scissors",
        name: "Scissors",
        name_ka: "მაკრატლები",
      },
    ],
  },
  {
    slug: "general-laboratory-supplies",
    name: "General Laboratory Supplies",
    name_ka: "ლაბორატორიის ზოგადი ინვენტარი",
    subcategories: [
      {
        slug: "accessories-for-workplace",
        name: "Accessories for the Workplace",
        name_ka: "სამუშაო ადგილის აქსესუარები",
      },
      {
        slug: "cameras-photo-studios-accessories",
        name: "Cameras, Photo Studios and Accessories",
        name_ka: "კამერები, ფოტო სტუდიები და აქსესუარები",
      },
      {
        slug: "chairs",
        name: "Chairs",
        name_ka: "სკამები",
      },
      {
        slug: "cleaning-and-disinfection-agents",
        name: "Cleaning and Disinfection Agents",
        name_ka: "დასუფთავებისა და დეზინფექციის საშუალებები",
      },
      {
        slug: "compressed-air-accessories",
        name: "Compressed Air Accessories",
        name_ka: "დაწნეხილი ჰაერით მუშაობის აქსესუარები",
      },
      {
        slug: "compressors",
        name: "Compressors",
        name_ka: "კომპრესორები",
      },
      {
        slug: "extraction-units",
        name: "Extraction Units",
        name_ka: "გამწოვი სისტემები",
      },
      {
        slug: "lights",
        name: "Lights",
        name_ka: "განათება",
      },
      {
        slug: "magnifiers",
        name: "Magnifiers",
        name_ka: "გამადიდებლები",
      },
      {
        slug: "measuring-and-scaling-devices",
        name: "Measuring and Scaling Devices",
        name_ka: "სასწორები",
      },
      {
        slug: "microscopes",
        name: "Microscopes",
        name_ka: "მიკროსკოპები",
      },
      {
        slug: "needles-and-dosing-aids",
        name: "Needles and Dosing Aids",
        name_ka: "შემრევი თავები და დოზირების საშუალებები",
      },
      {
        slug: "occupational-safety",
        name: "Occupational Safety",
        name_ka: "შრომის უსაფრთხოება",
      },
      {
        slug: "office-supplies",
        name: "Office Supplies",
        name_ka: "საოფისე ნივთები",
      },
      {
        slug: "packing-materials",
        name: "Packing Materials",
        name_ka: "შესაფუთი მასალები",
      },
      {
        slug: "paper-and-cellulose-tissues",
        name: "Paper and Cellulose Tissues",
        name_ka: "ხელსახოცები და მოწყობილობები",
      },
      {
        slug: "spare-parts-and-accessories",
        name: "Spare Parts and Accessories",
        name_ka: "სათადარიგო ნაწილები და აქსესუარები",
      },
      {
        slug: "tooth-cabinets",
        name: "Tooth Cabinets",
        name_ka: "სასაწყობე ინვენტარი",
      },
      {
        slug: "training-materials",
        name: "Training Materials",
        name_ka: "სასწავლო მასალები",
      },
      {
        slug: "work-trays",
        name: "Work Trays",
        name_ka: "სამუშაო კონტეინერი",
      },
      {
        slug: "workwear",
        name: "Workwear",
        name_ka: "ტანსაცმელი",
      },
    ],
  },
  {
    slug: "cad_cam_manufacturing",
    name: "Computer-Aided Manufacturing (CAD/CAM)",
    name_ka: "კომპიუტერული წარმოება (CAD - CAM)",
    subcategories: [
      {
        slug: "3d-printer-accessories",
        name: "3D Printer Accessories",
        name_ka: "3დ პრინტერის აქსესუარები",
      },
      {
        slug: "3d-printers",
        name: "3D Printers",
        name_ka: "3დ პრინტერები",
      },
      {
        slug: "3d-printing-materials",
        name: "3D Printing Materials",
        name_ka: "3დ საბეჭდი მასალები",
      },
      {
        slug: "3d-printing-post-processing",
        name: "3D Printing Post-Processing",
        name_ka: "ბეჭდვის შემდგომი დამუშავება",
      },
      {
        slug: "brushes-and-application-aids",
        name: "Brushes and Application Aids",
        name_ka: "ფუნჯები და აპლიკატორები",
      },
      {
        slug: "cad-cam-blanks-ceramic",
        name: "CAD/CAM Blanks, Ceramic",
        name_ka: "კერამიკის მასალები (Blanks)",
      },
      {
        slug: "cad-cam-blanks-composite",
        name: "CAD/CAM Blanks, Composite",
        name_ka: "კომპოზიტური მასალები (Blanks)",
      },
      {
        slug: "cad-cam-blanks-hybrid",
        name: "CAD/CAM Blanks, Hybrid Materials",
        name_ka: "ჰიბრიდული მასალები (Blanks)",
      },
      {
        slug: "cad-cam-blanks-metal",
        name: "CAD/CAM Blanks, Metal",
        name_ka: "მეტალის მასალები (Blanks)",
      },
      {
        slug: "cad-cam-blanks-resin",
        name: "CAD/CAM Blanks, Resin",
        name_ka: "ფისის მასალები (Blanks)",
      },
      {
        slug: "cad-cam-blanks-wax",
        name: "CAD/CAM Blanks, Wax",
        name_ka: "ცვილის მასალა (Blanks)",
      },
      {
        slug: "cam-accessories",
        name: "CAM Accessories",
        name_ka: "აქსესუარები",
      },
      {
        slug: "cam-milling-cutters",
        name: "CAM Milling Cutters",
        name_ka: "ჩარხის ბორები",
      },
      {
        slug: "cam-milling-units",
        name: "CAM Milling Units",
        name_ka: "ჩარხები",
      },
      {
        slug: "colouring-solutions",
        name: "Colouring Solutions",
        name_ka: "ცირკონის საღებავები",
      },
      {
        slug: "high-temperature-furnaces",
        name: "High-Temperature Furnaces",
        name_ka: "სინთერიზაციის ღუმელები",
      },
      {
        slug: "scanners",
        name: "Scanners",
        name_ka: "ლაბორატორიული სკანერები",
      },
      {
        slug: "separating-agents",
        name: "Separating Agents",
        name_ka: "საიზოლაციო(გამყოფი) საშუალებები",
      },
      {
        slug: "spare-parts-and-accessories",
        name: "Spare Parts and Accessories",
        name_ka: "სათადარიგო ნაწილები და აქსესუარები",
      },
    ],
  },
  {
    slug: "finishing",
    name: "Finishing",
    name_ka: "საბოლოო დამუშავება",
    subcategories: [
      {
        slug: "articulators-and-accessories",
        name: "Articulators and Accessories for Articulators",
        name_ka: "არტიკულატორები და მათი აქსესუარები",
      },
      {
        slug: "diamond-grinders",
        name: "Diamond Grinders",
        name_ka: "ალმასით დაფარული ბზრიალები (ბორები)",
      },
      {
        slug: "emery-paper",
        name: "Emery Paper",
        name_ka: "ზუმფარა (ემერის ქაღალდი)",
      },
      {
        slug: "grinders",
        name: "Grinders",
        name_ka: "სახეხი ბზრიალები (ბორები)",
      },
      {
        slug: "grinding-discs",
        name: "Grinding Discs",
        name_ka: "დასამუშავებელი დისკები",
      },
      {
        slug: "marking-aids",
        name: "Marking Aids",
        name_ka: "საოკლუზიო წვეთამფრქვევი (სპრეი)",
      },
      {
        slug: "measuring-devices",
        name: "Measuring Devices",
        name_ka: "საზომი მოწყობილობები",
      },
      {
        slug: "occlusion-testing-aid",
        name: "Occlusion Testing Aid",
        name_ka: "საოკლუზიო სპრეი",
      },
      {
        slug: "occupational-safety",
        name: "Occupational Safety",
        name_ka: "შრომის უსაფრთხოება (დასამუშავებელი ყუთი)",
      },
      {
        slug: "polishers",
        name: "Polishers",
        name_ka: "საპრიალებლები",
      },
      {
        slug: "polishing-abrasives-brushes-buffs",
        name: "Polishing Abrasives, Brushes and Buffs",
        name_ka: "საპრიალებელი საშუალებები, ფუნჯები და რბილი ქეჩები",
      },
      {
        slug: "polishing-agents",
        name: "Polishing Agents",
        name_ka: "საპრიალებელი ხსნარები",
      },
      {
        slug: "polishing-units",
        name: "Polishing Units",
        name_ka: "საპრიალებელი დანადგარები",
      },
      {
        slug: "prostheses-cleaning-agent",
        name: "Prostheses Cleaning Agent",
        name_ka: "პროთეზების სარეცხი საშუალება",
      },
      {
        slug: "spare-parts-and-accessories",
        name: "Spare Parts and Accessories",
        name_ka: "სათადარიგო ნაწილები და აქსესუარები",
      },
      {
        slug: "special-cutters",
        name: "Special Cutters",
        name_ka: "სპეციალური ბზრიალები (ბორები)",
      },
      {
        slug: "steam-cleaners",
        name: "Steam Cleaners",
        name_ka: "ორთქლის ჭავლის დანადგარები",
      },
      {
        slug: "tc-cutters-and-burs",
        name: "TC Cutters and Burs",
        name_ka: "მყარი შენადნობის ბზრიალები (ბორები)",
      },
      {
        slug: "tweezers",
        name: "Tweezers",
        name_ka: "დამჭერები",
      },
      {
        slug: "ultrasonic-cleaning-devices",
        name: "Ultrasonic Cleaning Devices",
        name_ka: "ულტრაბგერითი სარეცხი მოწყობილობები",
      },
    ],
  },
  {
    slug: "surgery",
    name: "Surgery",
    name_ka: "ქირურგია",
    subcategories: [
      {
        slug: "surgical-instruments",
        name: "Surgical Instruments",
        name_ka: "ქირურგიული ინსტრუმენტები",
      },
      {
        slug: "surgical-equipment",
        name: "Surgical Equipment",
        name_ka: "ქირურგიული ტექნიკა",
      },
      {
        slug: "bone",
        name: "Bone",
        name_ka: "ძვალი",
      },
      {
        slug: "membrane",
        name: "Membrane",
        name_ka: "მემბრანა",
      },
      {
        slug: "hemostatic-sponge",
        name: "Hemostatic Sponge",
        name_ka: "ჰემოსტაბილური ღრუბელი",
      },
      {
        slug: "monoject-and-tips",
        name: "Monoject + Tips",
        name_ka: "მონოჯექტი + თავები",
      },
      {
        slug: "scalpel-lancet",
        name: "Scalpel - Lancet",
        name_ka: "სკალპელი - ლანცეტი",
      },
    ],
  },
  {
    slug: "disposable-consumables",
    name: "Disposable Consumables",
    name_ka: "ერთჯერადი სახარჯი მასალები",
    subcategories: [
      {
        slug: "face-mask",
        name: "Face Mask",
        name_ka: "პირბადე",
      },
      {
        slug: "disposable-apron",
        name: "Disposable Apron",
        name_ka: "ერთჯერადი გულსაფარი",
      },
      {
        slug: "gloves",
        name: "Gloves",
        name_ka: "ხელთათმანები",
      },
      {
        slug: "towel",
        name: "Towel",
        name_ka: "ხელსახოცი",
      },
      {
        slug: "cotton-swabs",
        name: "Cotton Swabs",
        name_ka: "ყურის ჩხირები",
      },
      {
        slug: "rollers",
        name: "Rollers",
        name_ka: "ლილვაკები",
      },
      {
        slug: "gauze",
        name: "Gauze",
        name_ka: "დოლბანდი",
      },
      {
        slug: "disposable-medical-cap",
        name: "Disposable Medical Cap",
        name_ka: "სამედიცინო ქუდი ერთჯერადი",
      },
      {
        slug: "shoe-covers",
        name: "Shoe Covers",
        name_ka: "ბახილი",
      },
      {
        slug: "medical-gown",
        name: "Medical Gown",
        name_ka: "სამედიცინო ხალათი",
      },
      {
        slug: "disposable-cups",
        name: "Disposable Cups",
        name_ka: "ერთჯერადი ჭიქები",
      },
      {
        slug: "plastic-bags",
        name: "Plastic Bags",
        name_ka: "პოლიეთილენის პარკები",
      },
    ],
  },
  {
    slug: "ceramics_veneering",
    name: "Ceramics / Veneering",
    name_ka: "ფაიფური/ვინირება",
    subcategories: [
      {
        slug: "bonding-agent",
        name: "Bonding Agent",
        name_ka: "ბონდინგის აგენტი",
      },
      {
        slug: "brushes-and-application-aids",
        name: "Brushes and Application Aids",
        name_ka: "ფუნჯები და აპლიკატორები",
      },
      {
        slug: "ceramic-accessories",
        name: "Ceramic Accessories",
        name_ka: "ფაიფურის აქსესუარები",
      },
      {
        slug: "ceramic-furnaces-and-accessories",
        name: "Ceramic Furnaces and Accessories",
        name_ka: "ფაიფურის ღუმელები და აქსესუარები",
      },
      {
        slug: "ceramic-instruments",
        name: "Ceramic Instruments",
        name_ka: "ფაიფურის ინსტრუმენტები",
      },
      {
        slug: "ceramic-mixing-liquids",
        name: "Ceramic Mixing Liquids",
        name_ka: "ფაიფურის შესარევი სითხეები",
      },
      {
        slug: "ceramic-stains",
        name: "Ceramic Stains",
        name_ka: "ფაიფურის პიგმენტები",
      },
      {
        slug: "cleaning-and-disinfection-agents",
        name: "Cleaning and Disinfection Agents",
        name_ka: "დასუფთავებისა და დეზინფექციის საშუალებები",
      },
      {
        slug: "die-material",
        name: "Die Material",
        name_ka: "ანალოგის მასალა",
      },
      {
        slug: "die-spacers",
        name: "Die Spacers",
        name_ka: "ანალოგის გამყოფები",
      },
      {
        slug: "etching-agents",
        name: "Etching Agents",
        name_ka: "მჟავე აპლიკატორები",
      },
      {
        slug: "filling-material",
        name: "Filling Material",
        name_ka: "შესავსები მასალა",
      },
      {
        slug: "firing-trays",
        name: "Firing Trays",
        name_ka: "წვის თეფშები",
      },
      {
        slug: "flasks-flask-brackets-bench-presses",
        name: "Flasks, Flask Brackets and Bench Presses",
        name_ka: "ფლასკები, სამაგრები და პრესები",
      },
      {
        slug: "full-ceramics",
        name: "Full Ceramics",
        name_ka: "სრულად კერამიკული სისტემები",
      },
      {
        slug: "instrument-sets",
        name: "Instrument Sets",
        name_ka: "ინსტრუმენტების ნაკრები",
      },
      {
        slug: "instrument-storage",
        name: "Instrument Storage",
        name_ka: "ინსტრუმენტების შესანახი საშუალებები",
      },
      {
        slug: "light-curing-units",
        name: "Light-Curing Units",
        name_ka: "სინათლის რეაქტორი აპარატები",
      },
      {
        slug: "measuring-devices",
        name: "Measuring Devices",
        name_ka: "საზომი მოწყობილობები",
      },
      {
        slug: "metal-ceramics",
        name: "Metal Ceramics",
        name_ka: "მეტალოკერამიკა",
      },
      {
        slug: "mixing-devices",
        name: "Mixing Devices",
        name_ka: "შესარევი მოწყობილობები",
      },
      {
        slug: "mixing-plates-and-bowls",
        name: "Mixing Plates and Bowls",
        name_ka: "შერევის თეფშები და ჯამები",
      },
      {
        slug: "modelling-instruments",
        name: "Modelling Instruments",
        name_ka: "მოდელირების ინსტრუმენტები",
      },
      {
        slug: "polymerisation-units",
        name: "Polymerisation Units",
        name_ka: "პოლიმერიზაციის აპარატები",
      },
      {
        slug: "reinforcing-materials",
        name: "Reinforcing Materials",
        name_ka: "გამაძლიერებელი მასალები",
      },
      {
        slug: "resin-stains",
        name: "Resin Stains",
        name_ka: "სხივგამყარებადი პიგმენტები",
      },
      {
        slug: "separating-agents",
        name: "Separating Agents",
        name_ka: "გამყოფი საშუალებები",
      },
      {
        slug: "shade-guide",
        name: "Shade Guide",
        name_ka: "ფერის ბარათი",
      },
      {
        slug: "spare-parts-and-accessories",
        name: "Spare Parts and Accessories",
        name_ka: "სათადარიგო ნაწილები და აქსესუარები",
      },
      {
        slug: "special-resins",
        name: "Special Resins",
        name_ka: "სპეციალური რეზინები",
      },
      {
        slug: "telescopic-pliers",
        name: "Telescopic Pliers",
        name_ka: "ტელესკოპური პინცეტები",
      },
      {
        slug: "titanium-ceramics",
        name: "Titanium Ceramics",
        name_ka: "ტიტანის კერამიკა",
      },
      {
        slug: "tweezers",
        name: "Tweezers",
        name_ka: "პინცეტები",
      },
      {
        slug: "vacuum-pumps",
        name: "Vacuum Pumps",
        name_ka: "ვაკუუმის ტუმბოები",
      },
      {
        slug: "veneer-resins",
        name: "Veneer Resins",
        name_ka: "ვინირის რეზინები",
      },
      {
        slug: "veneers",
        name: "Veneers",
        name_ka: "ვინირები",
      },
    ],
  },
  {
    slug: "investment-casting-soldering",
    name: "Investment · Casting · Soldering",
    name_ka: "ჩამოსხმა · ინვესტირება · შედუღება",
    subcategories: [
      {
        slug: "acid-etching",
        name: "Acid-Etching",
        name_ka: "მჟავური გრავირება / მჟავით დამუშავება",
      },
      {
        slug: "blasting-agents-units",
        name: "Blasting Agents / Blasting Units",
        name_ka: "ქვიშა/ ქვიშაჭავლის ტექნიკა",
      },
      {
        slug: "casting-crucibles",
        name: "Casting Crucibles",
        name_ka: "ჩამოსხმის კერამიკული ჭურჭელი",
      },
      {
        slug: "casting-funnel-formers",
        name: "Casting Funnel Formers",
        name_ka: "ძაბრი",
      },
      {
        slug: "casting-units-and-accessories",
        name: "Casting Units and Accessories",
        name_ka: "ჩამოსხმის აპარატები და აქსესუარები",
      },
      {
        slug: "composite-adhesive",
        name: "Composite Adhesive",
        name_ka: "ესეც სხვა დანარჩენში უნდა წავიდეს",
      },
      {
        slug: "diamond-grinders",
        name: "Diamond Grinders",
        name_ka: "ალმასის დისკო",
      },
      {
        slug: "flasks-flask-brackets-bench-presses",
        name: "Flasks, Flask Brackets and Bench Presses",
        name_ka: "ფორმები, დამჭერები და საწნეხი აპარატები",
      },
      {
        slug: "investment-materials-precious-metals",
        name: "Investment Materials for Precious Metals",
        name_ka: "ძვირფასი ლითონებისთვის ჩამოსხმის მასალები",
      },
      {
        slug: "metal-refining-technique",
        name: "Metal Refining Technique",
        name_ka: "ლითონის გასუფთავების მასალა/ტექნიკა",
      },
      {
        slug: "mould-formers",
        name: "Mould Formers",
        name_ka: "ყალიბები",
      },
      {
        slug: "mould-pliers",
        name: "Mould Pliers",
        name_ka: "ყალიბის დამჭერი",
      },
      {
        slug: "needles-and-dosing-aids",
        name: "Needles and Dosing Aids",
        name_ka: "შემრევი თავები",
      },
      {
        slug: "partial-denture-alloys-investment",
        name: "Partial Denture Alloys / Partial Denture Investment Materials",
        name_ka: "ნაწილობრივი პროთეზის ჩამოსხმის მასალები",
      },
      {
        slug: "porcelain-bonding-alloys",
        name: "Porcelain-Bonding Alloys",
        name_ka: "მეტალი (ფაიფურისთვის)",
      },
      {
        slug: "pre-heating-furnaces",
        name: "Pre-Heating Furnaces",
        name_ka: "გამოსადნობი ღუმელები",
      },
      {
        slug: "press-ceramic-investment-materials",
        name: "Press Ceramic Investment Materials",
        name_ka: "პრესკერამიკისთვის საჭირო ინვენტარი",
      },
      {
        slug: "soldering-accessories",
        name: "Soldering Accessories",
        name_ka: "მისარჩილი მასალები",
      },
      {
        slug: "solders",
        name: "Solders",
        name_ka: "მისარჩილი მასალები",
      },
      {
        slug: "spare-parts-and-accessories",
        name: "Spare Parts and Accessories",
        name_ka: "სათადარიგო ნაწილები და აქსესუარები",
      },
      {
        slug: "titanium-investment-materials",
        name: "Titanium Investment Materials",
        name_ka: "ტიტანის ჩამოსხმის მასალები",
      },
      {
        slug: "tweezers",
        name: "Tweezers",
        name_ka: "პინცეტები",
      },
      {
        slug: "universal-investment-materials",
        name: "Universal Investment Materials",
        name_ka: "უნივერსალური ჩამოსხმის მასალები",
      },
      {
        slug: "welding-and-soldering-units",
        name: "Welding and Soldering Units",
        name_ka: "შედუღებისა და შედუღების მოწყობილობები",
      },
      {
        slug: "wires-brackets-wire-elements",
        name: "Wires, Brackets and Wire Elements",
        name_ka: "მავთულები, ბრეკეტები და მავთულის ელემენტები",
      },
    ],
  },
  {
    slug: "orthodontics",
    name: "Orthodontics",
    name_ka: "ორთოდონტია",
    subcategories: [
      {
        slug: "bonding-agent",
        name: "Bonding Agent",
        name_ka: "ბონდი",
      },
      {
        slug: "cleaning-and-disinfection-agents",
        name: "Cleaning and Disinfection Agents",
        name_ka: "სადეზინფექციო საშუალებები",
      },
      {
        slug: "fixing-systems",
        name: "Fixing Systems",
        name_ka: "ორთოდონტიული ბჟენი",
      },
      {
        slug: "needles-and-dosing-aids",
        name: "Needles and Dosing Aids",
        name_ka: "თავაკები და შემრევები",
      },
      {
        slug: "orthodontic-boxes",
        name: "Orthodontic Boxes",
        name_ka: "ორთოდონტიული ყუთები",
      },
      {
        slug: "orthodontic-resin",
        name: "Orthodontic Resin",
        name_ka: "ორთოდონტიული პოლიმერები",
      },
      {
        slug: "orthodontic-screws",
        name: "Orthodontic Screws",
        name_ka: "ორთოდონტიული ხრახნები",
      },
      {
        slug: "retention-aids-separation",
        name: "Retention Aids",
        name_ka: "სეპარაციის საშუალებები",
      },
      {
        slug: "retention-aids-wire",
        name: "Retention Aids",
        name_ka: "სარეტენციო რკალი",
      },
      {
        slug: "special-silicones",
        name: "Special Silicones",
        name_ka: "სპეციალური სილიკონები",
      },
      {
        slug: "wires-brackets-and-wire-elements",
        name: "Wires, Brackets and Wire Elements",
        name_ka: "რაკლები, ბრეკეტები და რაკლის ელემენტები",
      },
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
          slug: `${category.slug}-${subcategory.slug}`,
          parent_id: parentCategory.id,
        },
      });

      createdCategories[subcategory.slug] = createdSubcategory.id;
    }
  }

  // Create a test admin user
  await prisma.users.create({
    data: {
      email: "admin@dentalmall.ge",
      first_name: "Admin",
      last_name: "Dentall",
      role: "ADMIN",
      firebase_uid: "nQLdzBrzmWOSUvbN4UuFZfAajR03",
    },
  });

  const parentCount = categoriesData.length;
  const subcategoryCount = categoriesData.reduce(
    (acc, cat) => acc + cat.subcategories.length,
    0,
  );

  console.log("Seed completed successfully!");
  console.log("Created:");
  console.log(`- ${parentCount} parent categories`);
  console.log(`- ${subcategoryCount} subcategories`);
  console.log("- 1 admin user");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
