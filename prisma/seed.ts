import { PrismaClient, Role } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

if (process.env.NODE_ENV === "production") {
  console.error("Cannot seed in production. Aborting.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.$executeRaw`TRUNCATE TABLE "sale_items" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "sales" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "stock_movements" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "expenses" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "products" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "categories" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "suppliers" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "customers" CASCADE`;

  // Create users
  const password = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@firstlady.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@firstlady.com",
      password,
      role: Role.ADMIN,
      phone: "+234 801 234 5678",
    },
  });

  const salesRep = await prisma.user.upsert({
    where: { email: "sales@firstlady.com" },
    update: {},
    create: {
      name: "Sales Rep",
      email: "sales@firstlady.com",
      password,
      role: Role.SALES,
      phone: "+234 802 345 6789",
    },
  });

  const warehouseMgr = await prisma.user.upsert({
    where: { email: "warehouse@firstlady.com" },
    update: {},
    create: {
      name: "Warehouse Manager",
      email: "warehouse@firstlady.com",
      password,
      role: Role.WAREHOUSE,
      phone: "+234 803 456 7890",
    },
  });

  const accountantUser = await prisma.user.upsert({
    where: { email: "accountant@firstlady.com" },
    update: {},
    create: {
      name: "Accountant",
      email: "accountant@firstlady.com",
      password,
      role: Role.ACCOUNTANT,
      phone: "+234 804 567 8901",
    },
  });

  console.log("Users created");

  // Create categories
  const foodOils = await prisma.category.upsert({
    where: { name: "Food & Cooking Oils" },
    update: {},
    create: { name: "Food & Cooking Oils", description: "Edible oils and cooking ingredients" },
  });

  const toiletries = await prisma.category.upsert({
    where: { name: "Toiletries & Personal Care" },
    update: {},
    create: { name: "Toiletries & Personal Care", description: "Soaps, creams, and personal care products" },
  });

  console.log("Categories created");

  // Create suppliers
  const supplier1 = await prisma.supplier.upsert({
    where: { id: "first-lady-supplier" },
    update: {},
    create: {
      id: "first-lady-supplier",
      name: "FirstLady Foods Ltd",
      email: "supply@firstladyfoods.com",
      phone: "+234 810 111 2222",
      address: "12 Industrial Estate, Lagos",
    },
  });

  const supplier2 = await prisma.supplier.upsert({
    where: { id: "purewave-supplier" },
    update: {},
    create: {
      id: "purewave-supplier",
      name: "Purewave Consumer Goods",
      email: "orders@purewave.com",
      phone: "+234 810 333 4444",
      address: "45 Production Road, Ogun State",
    },
  });

  console.log("Suppliers created");

  // Create products
  const products = [
    {
      name: "First Lady Red Palm Olein (5L)",
      sku: "FLO-00001",
      costPrice: 4500,
      sellingPrice: 6500,
      stockQuantity: 200,
      minStockLevel: 50,
      maxStockLevel: 500,
      unit: "ltr",
      categoryId: foodOils.id,
      supplierId: supplier1.id,
      description: "Premium quality red palm oil, 5 litre gallon",
      image: "/products/first-lady-5l.svg",
    },
    {
      name: "First Lady Red Palm Olein (3L)",
      sku: "FLO-00002",
      costPrice: 2800,
      sellingPrice: 4000,
      stockQuantity: 150,
      minStockLevel: 40,
      maxStockLevel: 400,
      unit: "ltr",
      categoryId: foodOils.id,
      supplierId: supplier1.id,
      description: "Premium quality red palm oil, 3 litre bottle",
      image: "/products/first-lady-3l.svg",
    },
    {
      name: "First Lady Red Palm Olein (1L)",
      sku: "FLO-00003",
      costPrice: 1000,
      sellingPrice: 1500,
      stockQuantity: 300,
      minStockLevel: 80,
      maxStockLevel: 600,
      unit: "ltr",
      categoryId: foodOils.id,
      supplierId: supplier1.id,
      description: "Premium quality red palm oil, 1 litre bottle",
      image: "/products/first-lady-1l.svg",
    },
    {
      name: "Purewave Soap (Family Pack)",
      sku: "PWV-00001",
      costPrice: 800,
      sellingPrice: 1200,
      stockQuantity: 180,
      minStockLevel: 40,
      maxStockLevel: 400,
      unit: "pcs",
      categoryId: toiletries.id,
      supplierId: supplier2.id,
      description: "Purewave bathing soap, family size bar",
      image: "/products/purewave-soap-family.svg",
    },
    {
      name: "Purewave Soap (Regular)",
      sku: "PWV-00002",
      costPrice: 400,
      sellingPrice: 650,
      stockQuantity: 250,
      minStockLevel: 60,
      maxStockLevel: 500,
      unit: "pcs",
      categoryId: toiletries.id,
      supplierId: supplier2.id,
      description: "Purewave bathing soap, standard bar",
      image: "/products/purewave-soap-regular.svg",
    },
    {
      name: "Purewave Cream (Large)",
      sku: "PWC-00001",
      costPrice: 1500,
      sellingPrice: 2200,
      stockQuantity: 120,
      minStockLevel: 30,
      maxStockLevel: 300,
      unit: "pcs",
      categoryId: toiletries.id,
      supplierId: supplier2.id,
      description: "Purewave body cream, large tub",
      image: "/products/purewave-cream-large.svg",
    },
    {
      name: "Purewave Cream (Medium)",
      sku: "PWC-00002",
      costPrice: 900,
      sellingPrice: 1400,
      stockQuantity: 160,
      minStockLevel: 40,
      maxStockLevel: 350,
      unit: "pcs",
      categoryId: toiletries.id,
      supplierId: supplier2.id,
      description: "Purewave body cream, medium size",
      image: "/products/purewave-cream-medium.svg",
    },
    {
      name: "Purewave Cream (Small)",
      sku: "PWC-00003",
      costPrice: 500,
      sellingPrice: 800,
      stockQuantity: 200,
      minStockLevel: 50,
      maxStockLevel: 400,
      unit: "pcs",
      categoryId: toiletries.id,
      supplierId: supplier2.id,
      description: "Purewave body cream, travel size",
      image: "/products/purewave-cream-small.svg",
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        stockQuantity: product.stockQuantity,
        minStockLevel: product.minStockLevel,
        maxStockLevel: product.maxStockLevel,
        description: product.description,
        image: product.image,
      },
      create: product,
    });
  }

  console.log("Products created");

  // Create customers
  const customers = [
    { name: "Mama Ngozi Store", email: "mamangozi@email.com", phone: "+234 812 345 6789", address: "10 Allen Avenue, Lagos" },
    { name: "Kemi Supermarket", email: "kemi@email.com", phone: "+234 813 456 7890", address: "22 Wuse Zone 5, Abuja" },
    { name: "Ibrahim General Store", email: "ibrahim@email.com", phone: "+234 814 567 8901", address: "5 Kaduna Road" },
    { name: "Funke provisions", email: "funke@email.com", phone: "+234 815 678 9012", address: "15 Victoria Island, Lagos" },
    { name: "Emeka Mini Market", email: "emeka@email.com", phone: "+234 816 789 0123", address: "30 GRA, Port Harcourt" },
    { name: "Fatima Wholesale", email: "fatima@email.com", phone: "+234 817 890 1234", address: "8 Kano Street" },
    { name: "Tunde Retail Shop", email: "tunde@email.com", phone: "+234 818 901 2345", address: "12 Ikeja GRA, Lagos" },
    { name: "Ngozi Distribution", email: "ngozi@email.com", phone: "+234 819 012 3456", address: "7 Enugu Road" },
  ];

  for (const customer of customers) {
    await prisma.customer.create({ data: customer });
  }

  console.log("Customers created");

  // Create some sample sales
  const allProducts = await prisma.product.findMany();
  const allCustomers = await prisma.customer.findMany();

  const sampleSales = [
    { customerIdx: 0, productSku: "FLO-00001", qty: 20 },
    { customerIdx: 1, productSku: "FLO-00001", qty: 10 },
    { customerIdx: 2, productSku: "PWV-00001", qty: 30 },
    { customerIdx: 3, productSku: "PWC-00001", qty: 15 },
    { customerIdx: 4, productSku: "FLO-00002", qty: 25 },
    { customerIdx: 5, productSku: "PWV-00002", qty: 50 },
    { customerIdx: 6, productSku: "PWC-00002", qty: 20 },
    { customerIdx: 7, productSku: "FLO-00003", qty: 40 },
  ];

  for (const s of sampleSales) {
    const product = allProducts.find((p) => p.sku === s.productSku);
    const customer = allCustomers[s.customerIdx];
    if (!product || !customer) continue;

    const subtotal = Number(product.sellingPrice) * s.qty;
    const taxAmount = subtotal * 0.075;

    await prisma.sale.create({
      data: {
        invoiceNumber: `INV-${new Date().getFullYear()}${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
        userId: salesRep.id,
        customerId: customer.id,
        subtotal,
        taxRate: 7.5,
        taxAmount,
        totalAmount: subtotal + taxAmount,
        paymentMethod: "CASH",
        amountPaid: subtotal + taxAmount,
        status: "COMPLETED",
        items: {
          create: {
            productId: product.id,
            quantity: s.qty,
            unitPrice: Number(product.sellingPrice),
            costPrice: Number(product.costPrice),
            total: Number(product.sellingPrice) * s.qty,
          },
        },
      },
    });
  }

  console.log("Sales created");

  // Create expenses
  const expenses = [
    { title: "Shop Rent - January", amount: 150000, category: "Rent" },
    { title: "Electricity Bill", amount: 25000, category: "Utilities" },
    { title: "Staff Salaries", amount: 350000, category: "Salaries" },
    { title: "Delivery Van Fuel", amount: 15000, category: "Transport" },
    { title: "Packaging Materials", amount: 30000, category: "Office Supplies" },
  ];

  for (const expense of expenses) {
    await prisma.expense.create({
      data: {
        ...expense,
        userId: accountantUser.id,
        status: "APPROVED",
      },
    });
  }

  console.log("Expenses created");
  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
