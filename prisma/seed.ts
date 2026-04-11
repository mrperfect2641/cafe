import 'dotenv/config';
import bcrypt from 'bcrypt';
import { Role } from '../app/generated/prisma/client';
import { prisma } from '../lib/prisma';

async function getOrCreateCategory(name: string) {
  const existing = await prisma.category.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.category.create({ data: { name } });
}

async function getOrCreateProduct(data: {
  name: string;
  price: string;
  categoryId: string;
  isAvailable?: boolean;
}) {
  const existing = await prisma.product.findFirst({
    where: { name: data.name, categoryId: data.categoryId },
  });
  if (existing) return existing;

  return prisma.product.create({
    data: {
      name: data.name,
      price: data.price,
      categoryId: data.categoryId,
      isAvailable: data.isAvailable ?? true,
    },
  });
}

async function main() {
  const adminEmail = 'admin@example.com';
  const managerEmail = 'manager@example.com';
  const staffEmail = 'staff@example.com';

  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  const managerPasswordHash = await bcrypt.hash('manager123', 12);
  const staffPasswordHash = await bcrypt.hash('staff123', 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'Admin',
      password: adminPasswordHash,
      role: Role.ADMIN,
      isActive: true,
    },
    create: {
      name: 'Admin',
      email: adminEmail,
      password: adminPasswordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: managerEmail },
    update: {
      name: 'Manager',
      password: managerPasswordHash,
      role: Role.MANAGER,
      isActive: true,
    },
    create: {
      name: 'Manager',
      email: managerEmail,
      password: managerPasswordHash,
      role: Role.MANAGER,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: staffEmail },
    update: {
      name: 'Staff',
      password: staffPasswordHash,
      role: Role.STAFF,
      isActive: true,
    },
    create: {
      name: 'Staff',
      email: staffEmail,
      password: staffPasswordHash,
      role: Role.STAFF,
      isActive: true,
    },
  });

  const hotCoffee = await getOrCreateCategory('Hot Coffee');
  const iced = await getOrCreateCategory('Iced & Cold Drinks');
  const breakfast = await getOrCreateCategory('Breakfast');
  const sandwiches = await getOrCreateCategory('Sandwiches & Lunch');
  const desserts = await getOrCreateCategory('Desserts');

  const products: { name: string; price: string; categoryId: string }[] = [
    { name: 'Espresso', price: '230.00', categoryId: hotCoffee.id },
    { name: 'Americano', price: '270.00', categoryId: hotCoffee.id },
    { name: 'Cappuccino', price: '320.00', categoryId: hotCoffee.id },
    { name: 'House Latte', price: '340.00', categoryId: hotCoffee.id },
    { name: 'Iced Americano', price: '320.00', categoryId: iced.id },
    { name: 'Iced Latte', price: '360.00', categoryId: iced.id },
    { name: 'Cold Brew', price: '385.00', categoryId: iced.id },
    { name: 'Lemonade', price: '320.00', categoryId: iced.id },
    { name: 'Avocado Toast', price: '590.00', categoryId: breakfast.id },
    { name: 'Egg & Cheese Sandwich', price: '500.00', categoryId: breakfast.id },
    { name: 'Oatmeal Bowl', price: '410.00', categoryId: breakfast.id },
    { name: 'Croissant', price: '300.00', categoryId: breakfast.id },
    { name: 'Grilled Chicken Panini', price: '770.00', categoryId: sandwiches.id },
    { name: 'Turkey & Cheese Sandwich', price: '680.00', categoryId: sandwiches.id },
    { name: 'Veggie Wrap', price: '630.00', categoryId: sandwiches.id },
    { name: 'Tuna Melt', price: '725.00', categoryId: sandwiches.id },
    { name: 'Cheesecake Slice', price: '500.00', categoryId: desserts.id },
    { name: 'Brownie', price: '320.00', categoryId: desserts.id },
    { name: 'Cinnamon Roll', price: '360.00', categoryId: desserts.id },
    { name: 'Muffin', price: '320.00', categoryId: desserts.id },
  ];

  for (const p of products) {
    await getOrCreateProduct(p);
  }
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
