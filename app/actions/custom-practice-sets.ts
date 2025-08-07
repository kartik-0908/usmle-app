import prisma from "@/lib/db";

export interface CreateCustomPracticeSetInput {
  name: string;
  description?: string;
  totalQuestions: number;
  selectedTopics: string[];
  userId: string;
}

export async function getUserCustomPracticeSets(userId: string) {
  const practiceSets = await prisma.customPracticeSet.findMany({
    where: {
      userId,
      isActive: true,
    },
    include: {
      userPracticeSets: {
        where: {
          userId,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return practiceSets.map((set) => ({
    id: set.id,
    name: set.name,
    description: set.description,
    totalQuestions: set.totalQuestions,
    status: set.userPracticeSets[0]?.status || 'NOT_STARTED',
    createdAt: set.createdAt,
    lastAttempted: set.userPracticeSets[0]?.updatedAt || null,
    bestScore: set.userPracticeSets[0]?.score || null,
    attempts: set.userPracticeSets.length,
  }));
}

// export async function createCustomPracticeSet(input: CreateCustomPracticeSetInput) {
//   const { name, description, totalQuestions, selectedTopics, userId } = input;

//   // Create the practice set with topics and generate questions in a transaction
//   const practiceSet = await prisma.$transaction(async (tx) => {
//     // Create the custom practice set
//     const newSet = await tx.customPracticeSet.create({
//       data: {
//         name,
//         description,
//         totalQuestions,
//         userId,
//       },
//     });


//     // Generate random questions from selected topics
//     const generatedQuestions = await generateRandomQuestions(tx, selectedTopics, totalQuestions);
    
//     if (generatedQuestions.length === 0) {
//       throw new Error('No questions found for the selected topics');
//     }

//     // Create initial user practice set with generated questions
//     const userPracticeSet = await tx.userCustomPracticeSet.create({
//       data: {
//         userId,
//         customPracticeSetId: newSet.id,
//         status: 'NOT_STARTED',
//       },
//     });

//     // Store the generated questions for this practice set
//     await tx.userCustomPracticeQuestion.createMany({
//       data: generatedQuestions.map((question: any, index: any) => ({
//         userCustomPracticeSetId: userPracticeSet.id,
//         questionId: question.id,
//         order: index + 1,
//       })),
//     });


//   },{
//     timeout: 30000, // 10 seconds timeout for the transaction
//   });

//   if (!practiceSet) {
//     throw new Error('Failed to create practice set');
//   }

//   return {
//     id: practiceSet.id,
//     name: practiceSet.name,
//     description: practiceSet.description,
//     totalQuestions: practiceSet.totalQuestions,
//     topicCount: practiceSet.topics.length,
//     topics: practiceSet.topics.map((t) => t.topic.name),
//     status: 'NOT_STARTED' as const,
//     createdAt: practiceSet.createdAt,
//     lastAttempted: null,
//     bestScore: null,
//     attempts: 0,
//   };
// }

// Helper function to generate random questions from selected topics
// async function generateRandomQuestions(
//   tx: any, // Prisma transaction client
//   topicIds: string[],
//   totalQuestions: number
// ) {
//   // Get all active questions from the selected topics
//   const availableQuestions = await tx.question.findMany({
//     where: {
//       isActive: true,
//       questionTopics: {
//         some: {
//           topicId: {
//             in: topicIds,
//           },
//         },
//       },
//     },
//     include: {
//       questionTopics: {
//         include: {
//           topic: true,
//         },
//       },
//     },
//   });

//   if (availableQuestions.length === 0) {
//     return [];
//   }

//   // If we have fewer questions than requested, return all available
//   if (availableQuestions.length <= totalQuestions) {
//     return availableQuestions;
//   }

//   // Shuffle and select random questions
//   const shuffled = availableQuestions.sort(() => 0.5 - Math.random());
//   return shuffled.slice(0, totalQuestions);
// }

export async function deleteCustomPracticeSet(practiceSetId: string) {
  await prisma.$transaction(async (tx) => {
    // Get all user practice sets for this custom practice set
    const userPracticeSets = await tx.userCustomPracticeSet.findMany({
      where: {
        customPracticeSetId: practiceSetId,
      },
      select: {
        id: true,
      },
    });

    // Delete user custom practice questions
    if (userPracticeSets.length > 0) {
      await tx.userCustomPracticeQuestion.deleteMany({
        where: {
          userCustomPracticeSetId: {
            in: userPracticeSets.map(ups => ups.id),
          },
        },
      });
    }

    // Delete user practice sets
    await tx.userCustomPracticeSet.deleteMany({
      where: {
        customPracticeSetId: practiceSetId,
      },
    });

    // Delete the practice set
    await tx.customPracticeSet.delete({
      where: {
        id: practiceSetId,
      },
    });
  });
}