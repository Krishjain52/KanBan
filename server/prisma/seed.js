const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@kanban.dev' },
    update: {},
    create: {
      email: 'demo@kanban.dev',
      name: 'Demo User',
      passwordHash,
      boards: {
        create: {
          title: 'Product Roadmap',
          columns: {
            create: [
              {
                title: 'Backlog',
                order: 0,
                tasks: {
                  create: [
                    { title: 'Research competitors', description: 'Analyze top 5 competitors', priority: 'HIGH', order: 0 },
                    { title: 'Define user personas', priority: 'MEDIUM', order: 1 },
                  ],
                },
              },
              {
                title: 'In Progress',
                order: 1,
                tasks: {
                  create: [
                    { title: 'Design system setup', description: 'Configure Figma tokens and component library', priority: 'HIGH', order: 0 },
                    { title: 'API architecture doc', priority: 'URGENT', order: 1 },
                  ],
                },
              },
              {
                title: 'Review',
                order: 2,
                tasks: {
                  create: [
                    { title: 'Auth flow implementation', priority: 'HIGH', order: 0 },
                  ],
                },
              },
              {
                title: 'Done',
                order: 3,
                tasks: {
                  create: [
                    { title: 'Project kickoff meeting', priority: 'LOW', order: 0 },
                    { title: 'Tech stack decision', priority: 'MEDIUM', order: 1 },
                  ],
                },
              },
            ],
          },
        },
      },
    },
  });

  console.log('Seeded user:', user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
