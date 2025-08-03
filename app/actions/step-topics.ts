import prisma from "@/lib/db";


export async function getStepsWithTopics() {
  const steps = await prisma.step.findMany({
    where: {
      isActive: true,
    },
    include: {
      topics: {
        where: {
          isActive: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
    orderBy: {
      order: 'asc',
    },
  });

  return steps;
}