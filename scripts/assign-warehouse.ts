import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const warehouse = await prisma.warehouse.findFirst({ where: { name: "warehouse 1" } });
  if (!warehouse) {
    console.log("No warehouse 1 found");
    return;
  }
  const result = await prisma.product.updateMany({
    data: { warehouseId: warehouse.id },
  });
  console.log(`Updated ${result.count} products to warehouse: ${warehouse.name} (${warehouse.id})`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
