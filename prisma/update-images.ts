import prisma from "../src/lib/prisma";

const IMAGE_MAP: Record<string, string> = {
  "FLO-00001": "/products/first-lady-5l.svg",
  "FLO-00002": "/products/first-lady-3l.svg",
  "FLO-00003": "/products/first-lady-1l.svg",
  "PWV-00001": "/products/purewave-soap-family.svg",
  "PWV-00002": "/products/purewave-soap-regular.svg",
  "PWC-00001": "/products/purewave-cream-large.svg",
  "PWC-00002": "/products/purewave-cream-medium.svg",
  "PWC-00003": "/products/purewave-cream-small.svg",
};

async function main() {
  for (const [sku, image] of Object.entries(IMAGE_MAP)) {
    const result = await prisma.product.updateMany({
      where: { sku },
      data: { image },
    });
    console.log(`Updated ${sku}: ${result.count} row(s)`);
  }
  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
