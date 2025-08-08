import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    console.log("categorizing questions ...");
    // await saveExaplanation();
    // categorizeQuestions();
    // await insertStepDisciplines("0b40bcf0-fd3e-4002-9979-9d3063653223");
    // await insertStepSystems("0b40bcf0-fd3e-4002-9979-9d3063653223");
    await categorizeQuestionsWithAI();
    // importQuestions();
    // await prisma.question.deleteMany()
    // await prisma.question.updateMany({
    //   data:{
    //     isActive: false
    //   }
    // })

    return new Response("categorizing questions saved", {
      status: 200,
    });
  } catch (error) {
    console.error("Error seeding cardiology topics:", error);
    return new Response("Error seeding topics", { status: 500 });
  }
}

// Schema for AI response validation
const categorizationSchema = z.object({
  stepId: z
    .string()
    .describe("The ID of the step that this question belongs to"),
  systems: z
    .array(z.string())
    .describe(
      "Array of relevant medical systems for this question from the selected step"
    ),
  disciplines: z
    .array(z.string())
    .describe(
      "Array of relevant medical disciplines for this question from the selected step"
    ),
  difficulty: z
    .enum(["EASY", "MEDIUM", "HARD"])
    .describe("Difficulty level of the question"),
  reasoning: z
    .string()
    .describe(
      "Brief explanation of the categorization choices including why this step was chosen"
    ),
});

interface CategorizationResult1 {
  stepId: string;
  systems: string[];
  disciplines: string[];
  difficulty: Difficulty;
  reasoning: string;
}

interface StepInfo {
  id: string;
  name: string;
  slug: string;
  stepNumber: number;
  systems: string[];
  disciplines: string[];
}

/**
 * Fetches all steps with their associated systems and disciplines
 */
async function getStepsWithSystemsAndDisciplines(): Promise<StepInfo[]> {
  try {
    const steps = await prisma.step.findMany({
      where: { isActive: true },
      include: {
        StepSystem: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
        StepDiscipline: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { stepNumber: "asc" },
    });
    //@ts-ignore
    return steps.map((step) => ({
      id: step.id,
      name: step.name,
      slug: step.slug,
      stepNumber: step.stepNumber,
      //@ts-ignore
      systems: step.StepSystem.map((ss) => ss.system),
      //@ts-ignore
      disciplines: step.StepDiscipline.map((sd) => sd.discipline),
    }));
  } catch (error) {
    console.error("Error fetching steps with systems and disciplines:", error);
    throw error;
  }
}
async function categorizeQuestionWithAI(
  questionText: string,
  stepsInfo: StepInfo[]
): Promise<CategorizationResult1> {
  try {
    // Format step information for the AI prompt
    const stepsDescription = stepsInfo
      .map(
        (step) =>
          `STEP ${step.stepNumber} - ${step.name} (ID: ${step.id}):
  Systems: ${step.systems.join(", ") || "None"}
  Disciplines: ${step.disciplines.join(", ") || "None"}`
      )
      .join("\n\n");

    const prompt = `
You are a medical education expert. Analyze the following medical question and categorize it appropriately.

QUESTION TO ANALYZE:
${questionText}

AVAILABLE STEPS WITH THEIR SYSTEMS AND DISCIPLINES:
${stepsDescription}

DIFFICULTY LEVELS:
- EASY: Basic recall, simple concepts
- MEDIUM: Application of knowledge, moderate complexity
- HARD: Complex analysis, multiple concepts integration

IMPORTANT RULES:
1. You MUST choose exactly ONE step that this question belongs to
2. You can only select systems that belong to that chosen step
3. You can only select disciplines that belong to that chosen step
4. Do NOT mix systems from one step with disciplines from another step
5. Be selective - only choose systems and disciplines that are directly relevant to the question content

Please categorize this question by:
1. First determining which step this question belongs to based on its content
2. Then selecting relevant systems from that step's available systems
3. Then selecting relevant disciplines from that step's available disciplines
4. Assigning an appropriate difficulty level
5. Providing reasoning for your choices, especially why you chose that specific step

The stepId in your response must match one of the step IDs provided above.
`;

    // const result = await generateObject({
    //   model: openai("gpt-4-turbo"),
    //   schema: categorizationSchema,
    //   prompt: prompt,
    //   temperature: 0.3, // Lower temperature for more consistent categorization
    // });
    const result = await generateObject({
      model: azure_gpt5("gpt-5-chat"),
      schema: categorizationSchema,
      prompt: prompt,
      temperature: 0.1,
    });

    // Validate that the selected step exists
    const selectedStep = stepsInfo.find(
      (step) => step.id === result.object.stepId
    );
    if (!selectedStep) {
      throw new Error(
        `Invalid step ID returned by AI: ${result.object.stepId}`
      );
    }

    // Filter to only include systems and disciplines that exist in the selected step
    const validSystems = result.object.systems.filter((system) =>
      selectedStep.systems.includes(system)
    );

    const validDisciplines = result.object.disciplines.filter((discipline) =>
      selectedStep.disciplines.includes(discipline)
    );

    // Log validation warnings
    const invalidSystems = result.object.systems.filter(
      (system) => !selectedStep.systems.includes(system)
    );
    const invalidDisciplines = result.object.disciplines.filter(
      (discipline) => !selectedStep.disciplines.includes(discipline)
    );

    if (invalidSystems.length > 0) {
      console.warn(
        `⚠️  AI suggested invalid systems for step ${selectedStep.name}: ${invalidSystems.join(", ")}`
      );
    }
    if (invalidDisciplines.length > 0) {
      console.warn(
        `⚠️  AI suggested invalid disciplines for step ${selectedStep.name}: ${invalidDisciplines.join(", ")}`
      );
    }

    return {
      stepId: result.object.stepId,
      systems: validSystems,
      disciplines: validDisciplines,
      difficulty: result.object.difficulty as Difficulty,
      reasoning: result.object.reasoning,
    };
  } catch (error) {
    console.error("Error in AI categorization:", error);
    throw error;
  }
}

/**
 * Updates question with categorization data in the database
 */
async function updateQuestionCategorization(
  questionId: string,
  categorization: CategorizationResult1
): Promise<void> {
  try {
    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Update the question's difficulty and direct system/discipline fields
      await tx.question.update({
        where: { id: questionId },
        data: {
          difficulty: categorization.difficulty,
          // Update the direct system and discipline fields with the primary ones
          system: categorization.systems[0] || null,
          discipline: categorization.disciplines[0] || null,
        },
      });

      // Clear existing question-system relationships
      await tx.questionSystem.deleteMany({
        where: { questionId },
      });

      // Clear existing question-discipline relationships
      await tx.questionDiscipline.deleteMany({
        where: { questionId },
      });

      // Create new question-system relationships
      if (categorization.systems.length > 0) {
        await tx.questionSystem.createMany({
          data: categorization.systems.map((system) => ({
            questionId,
            system,
          })),
        });
      }

      // Create new question-discipline relationships
      if (categorization.disciplines.length > 0) {
        await tx.questionDiscipline.createMany({
          data: categorization.disciplines.map((discipline) => ({
            questionId,
            discipline,
          })),
        });
      }
    });

    console.log(
      `✅ Updated question ${questionId} with step ${categorization.stepId} categorization`
    );
  } catch (error) {
    console.error(`❌ Error updating question ${questionId}:`, error);
    throw error;
  }
}

/**
 * Main function to process questions one by one and categorize them
 */
async function categorizeQuestionsWithAI(
  options: {
    batchSize?: number;
    startFromId?: string;
    onlyUncategorized?: boolean;
    delayBetweenRequests?: number;
    specificStepId?: string; // Optional: only categorize questions for a specific step
  } = {}
) {
  const {
    batchSize = 10,
    startFromId,
    onlyUncategorized = true,
    delayBetweenRequests = 200, //ms
    specificStepId,
  } = options;

  try {
    console.log("🔄 Starting question categorization process...");

    // Get all steps with their systems and disciplines
    const stepsInfo = await getStepsWithSystemsAndDisciplines();

    if (stepsInfo.length === 0) {
      throw new Error(
        "No active steps found in the database. Please ensure steps table has active records."
      );
    }

    console.log(`📊 Found ${stepsInfo.length} active steps:`);
    stepsInfo.forEach((step) => {
      console.log(`  Step ${step.stepNumber}: ${step.name}`);
      console.log(
        `    Systems (${step.systems.length}): ${step.systems.join(", ") || "None"}`
      );
      console.log(
        `    Disciplines (${step.disciplines.length}): ${step.disciplines.join(", ") || "None"}`
      );
    });

    // Filter steps if specificStepId is provided
    let targetSteps = stepsInfo;
    if (specificStepId) {
      targetSteps = stepsInfo.filter((step) => step.id === specificStepId);
      if (targetSteps.length === 0) {
        throw new Error(
          `Step with ID ${specificStepId} not found or not active.`
        );
      }
      console.log(`🎯 Focusing on specific step: ${targetSteps[0].name}`);
    }

    // Get total count for progress tracking
    const totalQuestions = await prisma.question.count({
      where: {
        system: null,
        discipline: null,
      },
    });

    console.log(`📋 Found ${totalQuestions} questions to process`);

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    const stepAssignments: Record<string, number> = {};

    // Process questions in batches
    while (processedCount < totalQuestions) {
      const questions = await prisma.question.findMany({
        where: {
          system: null,
          discipline: null,
        },
        select: {
          id: true,
          title: true,
          questionText: true,
          system: true,
          discipline: true,
          difficulty: true,
        },
        orderBy: { createdAt: "asc" },
        skip: processedCount,
        take: batchSize,
      });

      if (questions.length === 0) break;

      console.log(
        `\n🔄 Processing batch ${Math.ceil(processedCount / batchSize) + 1}...`
      );

      for (const question of questions) {
        try {
          console.log(`\n📝 Processing question: ${question.id}`);
          console.log(`Title: ${question.title.substring(0, 100)}...`);

          // Combine title and question text for better context
          const fullQuestionText = `${question.title}\n\n${question.questionText}`;

          // Get AI categorization
          const categorization = await categorizeQuestionWithAI(
            fullQuestionText,
            stepsInfo
          );

          // Find the step name for logging
          const assignedStep = stepsInfo.find(
            (s) => s.id === categorization.stepId
          );
          const stepName = assignedStep
            ? `${assignedStep.name} (Step ${assignedStep.stepNumber})`
            : categorization.stepId;

          console.log(`🤖 AI Categorization:`);
          console.log(`  Assigned Step: ${stepName}`);
          console.log(
            `  Systems: ${categorization.systems.join(", ") || "None"}`
          );
          console.log(
            `  Disciplines: ${categorization.disciplines.join(", ") || "None"}`
          );
          console.log(`  Difficulty: ${categorization.difficulty}`);
          console.log(
            `  Reasoning: ${categorization.reasoning.substring(0, 150)}...`
          );

          // Update question in database
          await updateQuestionCategorization(question.id, categorization);
          successCount++;

          // Track step assignments for summary
          stepAssignments[stepName] = (stepAssignments[stepName] || 0) + 1;

          // Add delay between requests to respect rate limits
          if (delayBetweenRequests > 0) {
            await new Promise((resolve) =>
              setTimeout(resolve, delayBetweenRequests)
            );
          }
        } catch (error) {
          console.error(`❌ Error processing question ${question.id}:`, error);
          errorCount++;
        }

        processedCount++;

        // Progress update
        const progress = ((processedCount / totalQuestions) * 100).toFixed(1);
        console.log(
          `📊 Progress: ${processedCount}/${totalQuestions} (${progress}%)`
        );
      }
    }

    console.log("\n✅ Categorization process completed!");
    console.log(`📊 Summary:`);
    console.log(`  Total processed: ${processedCount}`);
    console.log(`  Successful: ${successCount}`);
    console.log(`  Errors: ${errorCount}`);
    console.log(
      `  Success rate: ${((successCount / processedCount) * 100).toFixed(1)}%`
    );

    console.log("\n📈 Questions assigned by step:");
    Object.entries(stepAssignments).forEach(([stepName, count]) => {
      console.log(`  ${stepName}: ${count} questions`);
    });

    return {
      totalProcessed: processedCount,
      successful: successCount,
      errors: errorCount,
      stepAssignments,
    };
  } catch (error) {
    console.error("💥 Fatal error in categorization process:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Helper function to categorize a single question (useful for testing)
 */
async function categorizeSingleQuestion(questionId: string) {
  try {
    const stepsInfo = await getStepsWithSystemsAndDisciplines();

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        title: true,
        questionText: true,
        system: true,
        discipline: true,
        difficulty: true,
      },
    });

    if (!question) {
      throw new Error(`Question with ID ${questionId} not found`);
    }

    const fullQuestionText = `${question.title}\n\n${question.questionText}`;
    const categorization = await categorizeQuestionWithAI(
      fullQuestionText,
      stepsInfo
    );

    await updateQuestionCategorization(questionId, categorization);

    const assignedStep = stepsInfo.find((s) => s.id === categorization.stepId);

    return {
      questionId: question.id,
      categorization,
      assignedStepName: assignedStep
        ? `${assignedStep.name} (Step ${assignedStep.stepNumber})`
        : categorization.stepId,
      success: true,
    };
  } catch (error) {
    console.error(`Error categorizing single question ${questionId}:`, error);
    return {
      questionId,
      error: error instanceof Error ? error.message : "Unknown error",
      success: false,
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function insertStepDisciplines(stepId: string) {
  const disciplines = [
    "Pathology",
    "Physiology",
    "Pharmacology",
    "Anatomy",
    "Microbiology",
    "Embryology",
    "Biochemistry",
    "Genetics",
    "Immunology",
    "Behavioral Science",
  ];
  // const disciplines = [
  //   "Internal Medicine",
  //   "Surgery",
  //   "Pediatrics",
  //   "Psychiatry",
  //   "Obstetrics & Gynecology",
  //   "Preventive Medicine",
  //   "Emergency Medicine",
  //   "Ethics / Communication",
  //   "Epidemiology / Biostatistics",
  // ];

  try {
    // Insert all disciplines for the step with proper ordering
    const insertedDisciplines = await prisma.stepDiscipline.createMany({
      data: disciplines.map((discipline, index) => ({
        stepId,
        discipline,
        isActive: true,
        order: index + 1, // Start ordering from 1
      })),
      skipDuplicates: true, // This will skip if discipline-step combination already exists
    });

    console.log(
      `Successfully inserted ${insertedDisciplines.count} disciplines for step ${stepId}`
    );
    return insertedDisciplines;
  } catch (error) {
    console.error("Error inserting step disciplines:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function insertStepSystems(stepId: string) {
  const systems = [
    "Cardiovascular",
    "Endocrine",
    "Gastrointestinal",
    "Hematology & Oncology",
    "Musculoskeletal",
    "Nervous & Special Senses",
    "Renal & Urinary",
    "Reproductive",
    "Respiratory",
    "Skin & Subcutaneous Tissue",
    "Multisystem Disorders",
  ];
  // const systems = [
  //   "Cardiovascular",
  //   "Endocrine / Diabetes",
  //   "Gastrointestinal",
  //   "Hematology & Oncology",
  //   "Infectious Diseases",
  //   "Musculoskeletal / Rheumatology",
  //   "Neurology",
  //   "Obstetrics & Gynecology",
  //   "Pediatrics",
  //   "Psychiatry",
  //   "Pulmonary / Critical Care",
  //   "Renal / Urology",
  //   "Dermatology",
  //   "Emergency Medicine",
  //   "Preventive Medicine",
  //   "Multisystem / Miscellaneous",
  // ];

  try {
    // Insert all systems for the step with proper ordering
    const insertedSystems = await prisma.stepSystem.createMany({
      data: systems.map((system, index) => ({
        stepId,
        system,
        isActive: true,
        order: index + 1, // Start ordering from 1
      })),
      skipDuplicates: true, // This will skip if system-step combination already exists
    });

    console.log(
      `Successfully inserted ${insertedSystems.count} systems for step ${stepId}`
    );
    return insertedSystems;
  } catch (error) {
    console.error("Error inserting step systems:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Helper function to create slug from branch name
 * @param name - Branch name
 * @returns string - Slugified version of the name
 */
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface SubtopicData {
  name: string;
  order: number;
  details: string[];
}

interface TopicData {
  name: string;
  order: number;
  subtopics: SubtopicData[];
}

interface StepData {
  stepNumber: number;
  name: string;
  description: string;
  topics: TopicData[];
}

interface USMLEData {
  steps: StepData[];
}

interface InsertionResults {
  steps: any[];
  topics: any[];
  subtopics: any[];
}

const usmleData: USMLEData = {
  steps: [
    {
      stepNumber: 1,
      name: "Basic Sciences",
      description: "Foundational medical sciences and organ systems",
      topics: [
        {
          name: "General Principles",
          order: 1,
          subtopics: [
            {
              name: "Biochemistry & Molecular Biology",
              order: 1,
              details: [
                "DNA/RNA structure",
                "Transcription",
                "Translation",
                "Mutations",
                "Gene expression",
              ],
            },
            {
              name: "Cell Biology",
              order: 2,
              details: [
                "Cell organelles",
                "Cell cycle",
                "Apoptosis",
                "Cell signaling",
                "Cytoskeleton",
              ],
            },
            {
              name: "Genetics",
              order: 3,
              details: [
                "Mendelian genetics",
                "Pedigrees",
                "Chromosomal abnormalities",
                "Genetic testing",
              ],
            },
            {
              name: "Immunology",
              order: 4,
              details: [
                "Innate immunity",
                "Adaptive immunity",
                "Hypersensitivity reactions",
                "Immune deficiencies",
                "Vaccines",
              ],
            },
            {
              name: "Microbiology",
              order: 5,
              details: [
                "Bacteriology",
                "Virology",
                "Mycology",
                "Parasitology",
                "Antimicrobials",
                "Resistance mechanisms",
              ],
            },
            {
              name: "Pharmacology",
              order: 6,
              details: [
                "Pharmacokinetics",
                "Pharmacodynamics",
                "Drug interactions",
                "Side effects",
                "Mechanisms of action",
              ],
            },
            {
              name: "Pathology",
              order: 7,
              details: [
                "Cell injury",
                "Inflammation",
                "Neoplasia",
                "Tissue repair",
                "Hemodynamics",
              ],
            },
            {
              name: "Behavioral Science",
              order: 8,
              details: [
                "Developmental milestones",
                "Psychological theories",
                "Ethics",
                "Epidemiology",
                "Biostatistics",
              ],
            },
          ],
        },
        {
          name: "Organ Systems",
          order: 2,
          subtopics: [
            {
              name: "Cardiovascular",
              order: 1,
              details: [
                "Anatomy",
                "Physiology",
                "Cardiac cycle",
                "Congenital heart defects",
                "Pharmacology",
              ],
            },
            {
              name: "Respiratory",
              order: 2,
              details: [
                "Lung anatomy",
                "Ventilation/perfusion",
                "Asthma",
                "COPD",
                "Restrictive diseases",
              ],
            },
            {
              name: "Renal",
              order: 3,
              details: [
                "Nephron function",
                "Acid-base balance",
                "Renal clearance",
                "Glomerular diseases",
              ],
            },
            {
              name: "Gastrointestinal",
              order: 4,
              details: [
                "GI motility",
                "Digestion",
                "Malabsorption",
                "Liver pathology",
                "Enzymes",
              ],
            },
            {
              name: "Endocrine",
              order: 5,
              details: [
                "Hormonal regulation",
                "Thyroid",
                "Adrenal",
                "Pancreas",
                "Endocrine pharmacology",
              ],
            },
            {
              name: "Reproductive",
              order: 6,
              details: [
                "Embryology",
                "Menstrual cycle",
                "Pregnancy",
                "Contraceptives",
                "STDs",
              ],
            },
            {
              name: "Musculoskeletal",
              order: 7,
              details: [
                "Bone structure",
                "Muscle contraction",
                "Connective tissue diseases",
                "Arthritis",
              ],
            },
            {
              name: "Nervous System",
              order: 8,
              details: [
                "Neuroanatomy",
                "Neurotransmitters",
                "CNS diseases",
                "Seizures",
                "Stroke",
              ],
            },
            {
              name: "Skin & Special Senses",
              order: 9,
              details: [
                "Dermatology",
                "Eye anatomy",
                "Ear",
                "Vision and hearing physiology",
              ],
            },
          ],
        },
      ],
    },
    {
      stepNumber: 2,
      name: "Clinical Sciences",
      description: "Clinical medicine and physician skills",
      topics: [
        {
          name: "Clinical Medicine",
          order: 1,
          subtopics: [
            {
              name: "Internal Medicine",
              order: 1,
              details: [
                "Cardiology",
                "Pulmonology",
                "Nephrology",
                "Gastroenterology",
                "Endocrinology",
                "Infectious disease",
                "Oncology",
              ],
            },
            {
              name: "Surgery",
              order: 2,
              details: [
                "Pre-op/post-op care",
                "Abdominal emergencies",
                "Trauma",
                "Surgical infections",
              ],
            },
            {
              name: "Pediatrics",
              order: 3,
              details: [
                "Developmental milestones",
                "Pediatric infections",
                "Neonatology",
                "Vaccines",
              ],
            },
            {
              name: "OB/GYN",
              order: 4,
              details: [
                "Prenatal care",
                "Labor & delivery",
                "Contraception",
                "Menstrual disorders",
              ],
            },
            {
              name: "Psychiatry",
              order: 5,
              details: [
                "Mood disorders",
                "Psychosis",
                "Anxiety",
                "Substance use",
                "Suicide prevention",
              ],
            },
            {
              name: "Preventive Medicine",
              order: 6,
              details: [
                "Screening guidelines",
                "Health maintenance",
                "Risk factor modification",
              ],
            },
          ],
        },
        {
          name: "Skills & Physician Tasks",
          order: 2,
          subtopics: [
            {
              name: "Diagnosis",
              order: 1,
              details: [],
            },
            {
              name: "Management",
              order: 2,
              details: [],
            },
            {
              name: "Communication",
              order: 3,
              details: [],
            },
            {
              name: "Ethical Decision-Making",
              order: 4,
              details: [],
            },
            {
              name: "Prognosis",
              order: 5,
              details: [],
            },
          ],
        },
      ],
    },
    {
      stepNumber: 3,
      name: "Advanced Clinical Practice",
      description: "Advanced clinical skills and case simulation",
      topics: [
        {
          name: "Clinical Systems",
          order: 1,
          subtopics: [
            {
              name: "Advanced Internal Medicine",
              order: 1,
              details: [
                "Multisystem diseases",
                "Complex comorbidities",
                "Longitudinal care",
              ],
            },
            {
              name: "Emergency Medicine",
              order: 2,
              details: [
                "ACLS",
                "Airway management",
                "Trauma resuscitation",
                "Toxicology",
              ],
            },
            {
              name: "OB/GYN Advanced",
              order: 3,
              details: [
                "High-risk pregnancies",
                "Obstetric emergencies",
                "Chronic conditions in pregnancy",
              ],
            },
            {
              name: "Pediatrics Advanced",
              order: 4,
              details: [
                "Chronic pediatric conditions",
                "Genetic syndromes",
                "Developmental delay",
              ],
            },
            {
              name: "Psychiatry Advanced",
              order: 5,
              details: [
                "Chronic psych management",
                "Medication adherence",
                "Legal issues",
              ],
            },
          ],
        },
        {
          name: "Judgment & Case Simulation",
          order: 2,
          subtopics: [
            {
              name: "Patient Management",
              order: 1,
              details: [
                "Initial workup",
                "Treatment planning",
                "Discharge decisions",
                "Follow-up",
              ],
            },
            {
              name: "CCS Cases",
              order: 2,
              details: [
                "Simulated patient care",
                "Time management",
                "Testing",
                "Consultation",
                "Therapy",
              ],
            },
            {
              name: "Professionalism",
              order: 3,
              details: [
                "Ethical dilemmas",
                "Health systems",
                "Cost-effective care",
                "Quality improvement",
              ],
            },
          ],
        },
      ],
    },
  ],
};

async function getO1Explanation(
  ques: string,
  options: {
    text: string;
    isCorrect: boolean;
    order: number;
  }[]
) {
  const prompt = `
  
  You are a medical education expert. Generate a concise, clear explanation for the following question based on the correct options and wrong options provided.
  
For every USMLE question provided—complete with its answer choices and the correct choice clearly indicated—take on the role of a USMLE expert. Offer a clinical/scientific rationale for each option, explaining why the correct answer is right and why every other choice is wrong

Question: ${ques}
Options:
${options
  .map(
    (option) =>
      `- ${option.text} (${option.isCorrect ? "Correct" : "Incorrect"})`
  )
  .join("\n")}


Below is an example of question and expected explanation:

For eg
A 58-year-old man comes to the emergency department with acute-onset chest pain that began 1 hour ago while climbing stairs. The pain is substernal, pressure-like, and radiates to his left arm. He is diaphoretic and appears anxious. His medical history includes hypertension, hyperlipidemia, and type 2 diabetes mellitus. He has smoked one pack of cigarettes daily for the past 35 years. His father died of a myocardial infarction at age 60. Vitals: BP: 148/90 mmHg HR: 102/min RR: 18/min SpO₂: 97% on room air ECG shows ST-segment elevation in leads V2-V4. Troponin I is pending. He is given aspirin, sublingual nitroglycerin, and started on heparin. A few minutes later, his BP drops to 82/54 mmHg, HR increases to 120/min, and he becomes cold and clammy. Which of the following is the most appropriate next step in management? A. Administer intravenous beta-blocker B. Administer intravenous morphine C. Administer intravenous normal saline bolus ✅ D. Administer sublingual nitroglycerin again E. Start dopamine infusion 
 Correct Answer: C. Administer intravenous normal saline bolus

You have to give a response like this:

Understanding the Clinical Scenario
This 58-year-old man’s presentation is classic for an acute ST-elevation myocardial infarction (STEMI). His risk factors (hypertension, hyperlipidemia, diabetes, heavy smoking, family history) and his ECG findings of ST elevations in leads V2–V4 point to an anteroseptal infarction (likely due to occlusion of the left anterior descending artery). Initial management of a suspected MI is appropriately started – aspirin, sublingual nitroglycerin, and heparin – to limit thrombosis and relieve ischemia. However, shortly after these interventions, he develops hypotension (82/54 mmHg), tachycardia (HR 120), and cold, clammy skin, which are signs of shock (poor perfusion). This abrupt hemodynamic collapse in the context of an MI suggests cardiogenic shock – the damaged heart is not pumping effectively – possibly exacerbated by nitroglycerin’s vasodilatory effect reducing preload. Recognizing the cause of his hypotension is critical to choosing the next step in management.
Correct Answer: IV Normal Saline Bolus (Option C)
Giving an intravenous normal saline bolus is the most appropriate next step because it addresses the likely cause of the hypotension: inadequate preload and reduced cardiac output. Nitroglycerin, while helpful for pain and ischemia, causes venous dilation and reduced preload, which can lead to a significant drop in blood pressure In an acute MI, especially if there is any involvement of the right ventricle or the patient’s blood pressure is “precarious,” nitroglycerin can precipitate transient hypotension. The recommended response to nitrate-induced hypotension is to administer IV fluids to restore intravascular volume and cardiac filling pressure. By giving a normal saline bolus, we increase venous return to the heart, thereby improving stroke volume and raising the blood pressure.
Restoring blood pressure with fluids is crucial because it improves perfusion of vital organs and the coronary arteries. In cardiogenic shock, although the primary issue is pump failure, a gentle fluid challenge is often indicated as a first step if the patient is not overtly fluid-overloaded. The patient in this scenario has no mention of pulmonary edema (no rales or jugular venous distension were noted), so a fluid bolus is appropriate to see if his blood pressure improves. IV fluids are a cornerstone of initial shock management – even in cardiogenic shock, careful fluid resuscitation is often done to optimize preload before initiating potent vasoactive drugs. In summary, a normal saline bolus is the quickest and most effective way to counteract the nitroglycerin-induced or shock-related hypotension, stabilize the patient’s hemodynamics, and improve tissue perfusion.
Why the Other Options Are Incorrect
Option A – IV Beta-Blocker: Administering an intravenous beta-blocker (e.g. IV metoprolol) at this time would be dangerous. Beta-blockers decrease heart rate and contractility, which reduces blood pressure and cardiac output further – the opposite of what this hypotensive patient needs. While beta-blockers are generally beneficial in MI (they reduce myocardial oxygen demand and prevent arrhythmias), they are contraindicated in the acute setting of hypotension or cardiogenic shock. In fact, IV beta-blockade in STEMI patients has been associated with precipitating severe hypotension and shock in unstable patients. This patient is already hypotensive and tachycardic (a sign of compensatory response to shock); a beta-blocker could cause bradycardia, worsen the low-output state, and potentially be fatal. The proper timing for beta-blockers in MI is after the patient is hemodynamically stable. In this scenario, beta-blockade should be withheld until blood pressure is under control and the acute shock has resolved.


Option B – IV Morphine: Morphine is an analgesic that can alleviate chest pain and anxiety in MI, but it is not appropriate here and can actually worsen the situation. Morphine has a vasodilatory effect and blunts sympathetic drive, which can lead to lower blood pressure and reduced cardiac preload In a patient who is already hypotensive and in shock, giving morphine could further drop his blood pressure (via histamine-mediated vasodilation) and slow the heart rate, compounding the perfusion problem. Moreover, morphine doesn’t treat the underlying cause of his instability – it would only mask pain. The priority in acute management is to support circulation and coronary perfusion, not just pain control. Therefore, morphine is contraindicated in hypotensive/shock states; pain control in this patient should be addressed after stabilizing his hemodynamics (or with smaller titrated doses if absolutely necessary, but not as an immediate next step). In summary, morphine’s side effects (hypotension and bradycardia) make it a poor choice in a shocky patient, and it does nothing to correct his underlying circulatory collapse.


Option D – Another Dose of Nitroglycerin: Re-administering sublingual nitroglycerin would be the worst choice here. Nitroglycerin’s mechanism – venous dilation leading to decreased preload and blood pressure – is exactly what likely triggered the patient’s hypotension in the first place. A second dose would further pool blood in the veins, dramatically reducing venous return to an already struggling heart, and could cause blood pressure to plummet even more. In the setting of an acute MI, nitrates are contraindicated if the patient is hypotensive (or if a right ventricular infarction is present, because those patients rely heavily on preload). This patient’s systolic BP is 82 mmHg, far below a safe threshold for nitroglycerin use. Giving more nitro could precipitate cardiovascular collapse. The correct approach is to stop any nitrates and counteract their effect with fluids (as in Option C), not to give additional doses. Thus, Option D is clearly incorrect – nitroglycerin should be avoided in a hypotensive MI patient to prevent worsening shock.


Option E – Start Dopamine Infusion: Dopamine is an adrenergic agonist that can act as a vasopressor and inotrope; at certain doses it increases cardiac contractility and at higher doses causes vasoconstriction to raise blood pressure. While this might sound useful for a shock state, it is not the appropriate first step here. In cardiogenic shock after MI, if hypotension persists despite fluids, inotropic support can indeed be necessary – but typically agents like dobutamine (a beta-1 agonist) or norepinephrine are preferred. Dopamine is generally avoided unless absolutely needed, because it has been associated with worse outcomes in cardiogenic shock. Studies have shown that dopamine use in cardiogenic shock is linked to higher rates of arrhythmias and even increased mortality compared to other pressors. Dopamine will also raise the heart rate (it’s already 120) and myocardial oxygen demand, potentially aggravating ischemia or precipitating dangerous arrhythmias. In short, starting a dopamine drip is too aggressive and risky as an initial maneuver. The better approach is to first give fluids (Option C) to see if the blood pressure improves. If the patient remained in cardiogenic shock after optimizing preload, then inotropes/vasopressors could be initiated – but even then, dobutamine or norepinephrine would be favored over dopamine in an MI patient, due to dopamine’s side effect profile. Thus, Option E is not the most appropriate next step in this immediate scenario.


Takeaway
In an acute MI patient who develops hypotension and shock signs after initial treatments, think about causes like nitroglycerin-induced preload drop or extensive infarction causing pump failure (cardiogenic shock). The first intervention should be to support blood pressure and cardiac output in a way that does not worsen the ischemia. IV fluid bolus is often the correct initial step to improve preload and perfusion, especially if nitrates might have precipitated the hypotension. Avoid interventions that could further depress cardiac function or blood pressure (like beta-blockers, more nitroglycerin, or opioids) in an unstable patient. More potent therapies (pressors/inotropes) should be reserved for when fluid support is insufficient. This approach stabilizes the patient and optimizes conditions for definitive MI management (urgent reperfusion therapy), ultimately improving outcomes.

  `;

  // console.log("Prompt for O1:", prompt);

  try {
    const result = await generateText({
      model: azure("o1"),
      prompt: prompt,
    });

    return result.text;
  } catch (error) {
    console.error("Error categorizing question:", error);
    return null;
  }
}

async function saveExaplanation() {
  let count = 0;
  try {
    while (count < 500) {
      console.log("count", count);
      const question = await prisma.question.findFirst({
        where: {
          o1answer: null,
        },
        include: {
          options: true,
        },
      });
      const explaination = await getO1Explanation(
        question?.questionText || "",
        question?.options || []
      );
      await prisma.question.update({
        where: {
          id: question?.id || "",
        },
        data: {
          explanation: explaination,
          o1answer: "done",
          isActive: true,
        },
      });
      count++;
    }
  } catch (error) {}
}

const fs = require("fs");
const { createInterface } = require("readline");

// Helper function to parse JSONL file
async function parseJSONLFile(filePath: string) {
  const questions = [];
  const fileStream = fs.createReadStream(filePath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (line.trim()) {
      try {
        const question = JSON.parse(line);
        questions.push(question);
      } catch (error) {
        console.error("Error parsing line:", line, error);
      }
    }
  }

  return questions;
}

// Function to determine difficulty based on meta_info
function getDifficulty(metaInfo: string) {
  if (!metaInfo) return "MEDIUM";

  const info = metaInfo.toLowerCase();
  if (info.includes("step1")) return "MEDIUM";
  if (info.includes("step2") || info.includes("step3")) return "HARD";
  return "MEDIUM";
}

async function createQuestionWithOptions(questionData: any) {
  const { question, answer, options, meta_info } = questionData;

  return await prisma.$transaction(async (tx: any) => {
    // Check if question already exists
    const existingQuestion = await tx.question.findFirst({
      where: {
        questionText: question,
      },
    });

    // If question already exists, skip creation and return the existing question
    if (existingQuestion) {
      console.log(
        `Question already exists with ID: ${existingQuestion.id}, skipping...`
      );
      return existingQuestion;
    }

    // Create the question if it doesn't exist
    const createdQuestion = await tx.question.create({
      data: {
        title:
          question.substring(0, 100) + (question.length > 100 ? "..." : ""),
        questionText: question,
        // explanation: `Correct answer: ${answer}`, // Store the correct answer text as explanation
        difficulty: getDifficulty(meta_info),
        questionType: "MULTIPLE_CHOICE",
        isActive: false,
      },
    });

    // Create options
    const optionPromises = Object.entries(options).map(([key, text], index) =>
      tx.option.create({
        data: {
          text: text,
          isCorrect: key === answer,
          order: index,
          questionId: createdQuestion.id,
        },
      })
    );

    await Promise.all(optionPromises);

    return createdQuestion;
  });
}
async function importQuestions() {
  try {
    // Get the file path from command line arguments
    const filePath = "/Users/kartik/projects/usmle/public/US/US_qbank.jsonl";

    if (!filePath) {
      console.error("Please provide the path to your JSONL file");
      console.error(
        "Usage: node scripts/import-questions.js <path-to-jsonl-file>"
      );
      process.exit(1);
    }

    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    console.log("🚀 Starting question import process...");

    // Parse JSONL file
    console.log("📖 Parsing JSONL file...");
    const questions = await parseJSONLFile(filePath);
    console.log(`Found ${questions.length} questions to process`);

    const results = {
      total: questions.length,
      successful: 0,
      failed: 0,
      errors: [],
    };

    // Process questions in batches
    const batchSize = 10; // Larger batch size since no API calls

    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);

      console.log(
        `\n🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(questions.length / batchSize)} (questions ${i + 1}-${Math.min(i + batchSize, questions.length)})`
      );

      await Promise.all(
        batch.map(async (questionData, index) => {
          const questionNumber = i + index + 1;

          try {
            console.log(
              `   Processing question ${questionNumber}/${questions.length}...`
            );

            // Create question with options
            await createQuestionWithOptions(questionData);

            results.successful++;
            console.log(
              `   ✅ Question ${questionNumber} created successfully`
            );
          } catch (error) {
            console.error(
              `   ❌ Error processing question ${questionNumber}:`,
              error
            );
            results.failed++;
            //   results.errors.push({
            //     questionNumber,
            //     error: error.message,
            //     question: questionData.question.substring(0, 100) + '...'
            //   });
          }
        })
      );
    }

    console.log("\n🎉 Import process completed!");
    console.log(`📊 Results:`);
    console.log(`   Total: ${results.total}`);
    console.log(`   Successful: ${results.successful}`);
    console.log(`   Failed: ${results.failed}`);

    // if (results.errors.length > 0) {
    //   console.log('\n❌ Errors encountered:');
    //   results.errors.forEach(error => {
    //     console.log(`   Question ${error.questionNumber}: ${error.error}`);
    //     console.log(`   Preview: ${error.question}`);
    //   });
    // }

    // Show some sample created questions
    if (results.successful > 0) {
      console.log("\n📋 Sample created questions:");
      const sampleQuestions = await prisma.question.findMany({
        take: 3,
        orderBy: { createdAt: "desc" },
        include: {
          options: true,
        },
      });

      //   sampleQuestions.forEach((q, index) => {
      //     console.log(`\n   ${index + 1}. ${q.title}`);
      //     console.log(`      Difficulty: ${q.difficulty}`);
      //     console.log(`      Options: ${q.options.length}`);
      //     console.log(`      Correct: ${q.options.find(o => o.isCorrect)?.text.substring(0, 50)}...`);
      //   });
    }
  } catch (error) {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

import { generateObject, generateText } from "ai";
import { z } from "zod";

import { createAzure } from "@ai-sdk/azure";
import { Difficulty } from "@/app/generated/prisma";
import { azure_gpt5 } from "@/lib/ai/azure";

const azure = createAzure({
  resourceName: "makai-azurespon", // Azure resource name
  apiKey: process.env.AZURE_API_KEY, // Your Azure API key
});
