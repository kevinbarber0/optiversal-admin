const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seed() {
  // Seed initial optiversal demo organization
  console.log('Seeding initial optiversal demo organization...');
  try {
    await prisma.organization.upsert({
      where: {
        organization_id: '9b5711e85', // Maybe stop hardcoding this?
      },
      create: {
        name: 'Optiversal Demo',
        organization_id: '9b5711e85',
        allowed_domain: 'optiversal.com',
        active: true,
        directory: 'hibbet',
        settings: {
          name: 'Athletic Apparel Co',
          homeUrl: 'https://apparelsite.com',
          urlFormat: 'https://apparelsite.com/shop/{{slug}}',
          dictionary: [],
          maxResults: '15',
          includeCons: true,
          includePros: true,
          productType: 'athletic apparel',
          boostedWords: [],
          excludedSkus: [
            { label: '1P424', value: '1P424' },
            { label: '31965650', value: '31965650' },
          ],
          geoLocations: null,
          integrations: {
            googleSearchConsoleAPICode: null,
            googleSearchConsoleAPIToken:
              '',
            googleSearchConsoleAPITokens: null,
          },
          localizations: ['fr', 'es'],
          defaultTemplate: '2f757ee8-719d-4292-ba48-2c43e2ba2e83',
          suppressedWords: ['cheap'],
          locationPageTitle: '{{title}} in {{city}}',
          excludedCategories: [
            {
              label: 'Clothing (clearance-mens-clothing)',
              value: 'clearance-mens-clothing',
            },
          ],
          minimumQualityScore: '6',
          includeReviewExcerpts: true,
        },
      },
      update: {
        name: 'Optiversal Demo',
      },
    });
  } catch (error) {
    console.error(`Error creating seed organization`, error);
  }

  const products = require('./data/products');

  // Seed initial optiversal demo products
  console.log('Seeding initial optiversal demo products...');
  try {
    await prisma.product.createMany({
      data: products,
    });
  } catch (error) {
    console.error(`Error seeding products,`, error);
  }
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })

  .catch(async (e) => {
    console.error(e);

    await prisma.$disconnect();

    process.exit(1);
  });
