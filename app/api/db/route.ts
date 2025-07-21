import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    console.log("categorizing questions ...");
    await saveExaplanation();
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
    while (count < 5) {
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
        where:{
          id: question?.id || "",
        },
        data:{
          explanation: explaination,
          isActive: true
        }
      })
      count++;
    }
  } catch (error) {}
}

// Helper function to generate slug from name
function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const cardiologyTopics = [
  {
    name: "Anatomy & Physiology",
    order: 1,
    isActive: true,
    subtopics: [
      "Cardiac embryology (truncus arteriosus, septation, aortic arches)",
      "Coronary circulation & perfusion timing",
      "Cardiac cycle: pressures, sounds, murmurs",
      "Ventricular pressure-volume loops",
      "Jugular venous pressure waveforms",
      "Mean arterial pressure, pulse pressure, TPR",
    ],
  },
  {
    name: "Electrophysiology",
    order: 2,
    isActive: true,
    subtopics: [
      "Cardiac action potentials: pacemaker vs myocyte",
      "SA & AV node conduction, PR interval, QT interval",
      "ECG interpretation (axis, blocks, arrhythmias)",
      "Cardiac conduction abnormalities (e.g. WPW, AV blocks)",
    ],
  },
  {
    name: "Pharmacology",
    order: 3,
    isActive: true,
    subtopics: [
      "Anti-hypertensives (ACEi, ARBs, CCBs, beta blockers)",
      "Heart failure drugs (loop diuretics, ARNI, digoxin)",
      "Antiarrhythmics (Class I–IV)",
      "Lipid-lowering drugs (statins, PCSK9 inhibitors)",
      "Antiplatelet & anticoagulants (aspirin, heparin, DOACs)",
    ],
  },
  {
    name: "Pathology: Vascular",
    order: 4,
    isActive: true,
    subtopics: [
      "Atherosclerosis, arteriosclerosis types",
      "Aneurysms and dissections",
      "Vasculitis (Takayasu, temporal arteritis, PAN, Kawasaki, etc.)",
      "Peripheral artery disease",
      "DVT & pulmonary embolism",
    ],
  },
  {
    name: "Pathology: Cardiac",
    order: 5,
    isActive: true,
    subtopics: [
      "Coronary artery disease & MI (STEMI vs NSTEMI)",
      "Stable vs unstable angina",
      "Heart failure (HFrEF vs HFpEF)",
      "Cardiomyopathies (dilated, hypertrophic, restrictive)",
      "Valvular diseases (AS, MS, MR, AR)",
      "Endocarditis (culture-positive vs culture-negative)",
      "Pericarditis & cardiac tamponade",
      "Myocarditis (viral, autoimmune)",
      "Rheumatic heart disease",
      "Congenital heart diseases (Tetralogy, ASD, VSD, PDA, etc.)",
    ],
  },
  {
    name: "Clinical Skills / Presentations",
    order: 6,
    isActive: true,
    subtopics: [
      "Chest pain differential diagnosis",
      "Murmur identification and maneuvers",
      "Hypertension workup and staging",
      "Syncope and arrhythmia evaluation",
      "Shock types (cardiogenic, hypovolemic, distributive)",
      "Cardiac arrest & ACLS algorithms",
      "EKG in emergency medicine",
    ],
  },
  {
    name: "Cardiovascular Risk & Prevention",
    order: 7,
    isActive: true,
    subtopics: [
      "Lipid panel interpretation",
      "ASCVD risk calculator",
      "Screening guidelines (BP, lipids)",
      "Smoking cessation",
      "Diabetes & cardiovascular risk",
    ],
  },
  {
    name: "Special Populations",
    order: 8,
    isActive: true,
    subtopics: [
      "Cardiac conditions in pregnancy (peripartum cardiomyopathy, HTN disorders)",
      "Pediatric congenital defects",
      "Elderly: isolated systolic HTN, diastolic dysfunction",
    ],
  },
];

async function seedCardiologyTopics() {
  try {
    console.log("Starting to seed cardiology topics...");

    await prisma.$transaction(async (tx: any) => {
      for (const topicData of cardiologyTopics) {
        const { name, subtopics, order, isActive } = topicData;

        console.log(`Creating topic: ${name}`);

        const topic = await tx.topic.create({
          data: {
            name,
            slug: generateSlug(name),
            order,
            isActive,
            subtopics: {
              create: subtopics.map((subtopicName, index) => ({
                name: subtopicName,
                slug: generateSlug(subtopicName),
                order: index + 1,
                isActive: true,
              })),
            },
          },
          include: {
            subtopics: true,
          },
        });

        console.log(
          `✅ Created topic "${name}" with ${topic.subtopics.length} subtopics`
        );
      }
    });

    console.log("🎉 Successfully seeded all cardiology topics!");
  } catch (error) {
    console.error("❌ Error seeding topics:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
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

// Function to create question with options
async function createQuestionWithOptions(questionData: any) {
  const { question, answer, options, meta_info, answer_idx } = questionData;

  return await prisma.$transaction(async (tx: any) => {
    // Create the question
    const createdQuestion = await tx.question.create({
      data: {
        title:
          question.substring(0, 100) + (question.length > 100 ? "..." : ""),
        questionText: question,
        explanation: `Correct answer: ${answer}`, // Store the correct answer text as explanation
        difficulty: getDifficulty(meta_info),
        questionType: "MULTIPLE_CHOICE",
        isActive: true,
      },
    });

    // Create options
    const optionPromises = Object.entries(options).map(([key, text], index) =>
      tx.option.create({
        data: {
          text: text,
          isCorrect: key === answer_idx,
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
import { Question, Subtopic, Topic } from "@/app/generated/prisma";

const azure = createAzure({
  resourceName: "makai-azurespon", // Azure resource name
  apiKey: process.env.AZURE_API_KEY, // Your Azure API key
});

// Schema for LLM response validation
const categorizeSchema = z.object({
  topicName: z.string().describe("The exact topic name from the provided list"),
  subtopicName: z
    .string()
    .describe("The exact subtopic name from the provided list"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence level (0-1) for this categorization"),
});

// Type definitions
type CategorizationResult = z.infer<typeof categorizeSchema>;

interface TopicWithSubtopics extends Topic {
  subtopics: Subtopic[];
}

interface ErrorItem {
  questionNumber: number;
  questionId: string;
  questionTitle: string;
  error: string;
}

interface CategorizationItem {
  questionId: string;
  questionTitle: string;
  topicName: string;
  subtopicName: string;
  confidence: number;
}

interface Results {
  total: number;
  successful: number;
  failed: number;
  lowConfidence: number;
  errors: ErrorItem[];
  categorizations: CategorizationItem[];
}

// Function to get uncategorized questions
async function getUncategorizedQuestions(
  limit: number = 50
): Promise<Question[]> {
  return await prisma.question.findMany({
    where: {
      questionTopics: {
        none: {}, // Questions that have no topic assignments
      },
    },
    take: limit,
    orderBy: {
      createdAt: "asc",
    },
  });
}

// Function to get all topics and subtopics for LLM context
async function getTopicsAndSubtopics(): Promise<TopicWithSubtopics[]> {
  const topics = await prisma.topic.findMany({
    include: {
      subtopics: {
        where: {
          isActive: true,
        },
      },
    },
    where: {
      isActive: true,
    },
  });

  return topics;
}

// Function to categorize question using Vercel AI SDK
async function categorizeQuestion(
  questionText: string,
  topicsContext: TopicWithSubtopics[]
): Promise<CategorizationResult> {
  const topicsText: string = topicsContext
    .map(
      (topic) =>
        `${topic.name}:\n${topic.subtopics.map((sub) => `  - ${sub.name}`).join("\n")}`
    )
    .join("\n\n");

  const prompt = `
You are a medical education expert. Analyze the following medical question and categorize it into the most appropriate topic and subtopic from the provided list.

Available Topics and Subtopics:
${topicsText}

Question to categorize:
"${questionText}"

Instructions:
- Choose the MOST SPECIFIC and RELEVANT topic and subtopic
- Use EXACT names from the list above
- Consider the main medical concept being tested
- Provide a confidence score (0-1) for your categorization

Focus on the primary medical concept, condition, or skill being evaluated in the question.
`;

  try {
    const result = await generateObject({
      model: azure("gpt-4.1"),
      schema: categorizeSchema,
      prompt: prompt,
      temperature: 0.1,
    });

    return result.object;
  } catch (error) {
    console.error("Error categorizing question:", error);
    // Fallback to first available topic/subtopic if LLM fails
    return {
      topicName: topicsContext[0]?.name || "Unknown",
      subtopicName: topicsContext[0]?.subtopics[0]?.name || "Unknown",
      confidence: 0.1,
    };
  }
}

// Function to assign topic and subtopic to question
async function assignTopicToQuestion(
  questionId: string,
  topicId: string,
  subtopicId: string
): Promise<boolean> {
  return await prisma.$transaction(async (tx) => {
    // Create topic relationship
    await tx.questionTopic.create({
      data: {
        questionId: questionId,
        topicId: topicId,
      },
    });

    // Create subtopic relationship
    await tx.questionSubtopic.create({
      data: {
        questionId: questionId,
        subtopicId: subtopicId,
      },
    });

    return true;
  });
}

// Main categorization function
async function categorizeQuestions(): Promise<void> {
  try {
    // Parse command line arguments
    const args: string[] = process.argv.slice(2);
    const maxQuestions: number = parseInt(args[0]) || 10000;
    const minConfidence: number = parseFloat(args[1]) || 0.5;
    const batchSize: number = parseInt(args[2]) || 10;

    console.log("🚀 Starting question categorization process...");
    console.log(`📊 Configuration:`);
    console.log(`   Max questions: ${maxQuestions}`);
    console.log(`   Min confidence: ${minConfidence}`);
    console.log(`   Batch size: ${batchSize}`);

    // Get topics and subtopics for LLM context
    console.log("\n📚 Loading topics and subtopics...");
    const topicsContext: TopicWithSubtopics[] = await getTopicsAndSubtopics();

    if (topicsContext.length === 0) {
      console.error(
        "❌ No topics found in database. Please create topics first."
      );
      process.exit(1);
    }

    console.log(`Found ${topicsContext.length} topics with subtopics:`);
    topicsContext.forEach((topic) => {
      console.log(`   ${topic.name} (${topic.subtopics.length} subtopics)`);
    });

    // Get uncategorized questions
    console.log("\n🔍 Fetching uncategorized questions...");
    const questions: Question[] = await getUncategorizedQuestions(maxQuestions);

    if (questions.length === 0) {
      console.log(
        "✅ No uncategorized questions found. All questions are already categorized!"
      );
      process.exit(0);
    }

    console.log(`Found ${questions.length} uncategorized questions to process`);

    const results: Results = {
      total: questions.length,
      successful: 0,
      failed: 0,
      lowConfidence: 0,
      errors: [],
      categorizations: [],
    };

    // Process questions in batches to manage API rate limits
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch: Question[] = questions.slice(i, i + batchSize);

      console.log(
        `\n🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(questions.length / batchSize)} (questions ${i + 1}-${Math.min(i + batchSize, questions.length)})`
      );

      for (const [index, question] of batch.entries()) {
        const questionNumber: number = i + index + 1;

        try {
          console.log(
            `   📝 [${questionNumber}/${questions.length}] Categorizing: ${question.title}`
          );

          // Categorize question using LLM
          const categorization: CategorizationResult = await categorizeQuestion(
            question.questionText,
            topicsContext
          );

          // Find topic and subtopic IDs
          const topic: TopicWithSubtopics | undefined = topicsContext.find(
            (t) => t.name === categorization.topicName
          );
          if (!topic) {
            throw new Error(`Topic not found: ${categorization.topicName}`);
          }

          const subtopic: Subtopic | undefined = topic.subtopics.find(
            (sub) => sub.name === categorization.subtopicName
          );
          if (!subtopic) {
            throw new Error(
              `Subtopic not found: ${categorization.subtopicName} in topic ${topic.name}`
            );
          }

          // Check confidence threshold
          const confidenceIcon: string =
            categorization.confidence >= minConfidence ? "🎯" : "⚠️";
          console.log(
            `      ${confidenceIcon} ${categorization.topicName} > ${categorization.subtopicName} (confidence: ${categorization.confidence.toFixed(2)})`
          );

          if (categorization.confidence < minConfidence) {
            results.lowConfidence++;
          }

          // Assign topic and subtopic to question
          await assignTopicToQuestion(question.id, topic.id, subtopic.id);

          results.successful++;
          results.categorizations.push({
            questionId: question.id,
            questionTitle: question.title,
            topicName: categorization.topicName,
            subtopicName: categorization.subtopicName,
            confidence: categorization.confidence,
          });

          console.log(
            `      ✅ Successfully categorized question ${questionNumber}`
          );
        } catch (error) {
          const errorMessage: string =
            error instanceof Error ? error.message : "Unknown error";
          console.error(
            `      ❌ Error categorizing question ${questionNumber}:`,
            errorMessage
          );
          results.failed++;
          results.errors.push({
            questionNumber,
            questionId: question.id,
            questionTitle: question.title,
            error: errorMessage,
          });
        }

        // Small delay between requests to respect rate limits
        await new Promise<void>((resolve) => setTimeout(resolve, 750));
      }

      // Longer delay between batches
      if (i + batchSize < questions.length) {
        console.log(`   ⏱️  Waiting 3 seconds before next batch...`);
        await new Promise<void>((resolve) => setTimeout(resolve, 3000));
      }
    }

    console.log("\n🎉 Categorization process completed!");
    console.log(`📊 Final Results:`);
    console.log(`   Total processed: ${results.total}`);
    console.log(`   Successfully categorized: ${results.successful}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`   Low confidence: ${results.lowConfidence}`);

    // Show confidence distribution
    if (results.categorizations.length > 0) {
      const confidences: number[] = results.categorizations.map(
        (c) => c.confidence
      );
      const avgConfidence: number =
        confidences.reduce((a, b) => a + b, 0) / confidences.length;
      const highConfidence: number = confidences.filter((c) => c >= 0.8).length;
      const mediumConfidence: number = confidences.filter(
        (c) => c >= 0.5 && c < 0.8
      ).length;
      const lowConfidenceCount: number = confidences.filter(
        (c) => c < 0.5
      ).length;

      console.log(`\n📈 Confidence Distribution:`);
      console.log(`   Average confidence: ${avgConfidence.toFixed(2)}`);
      console.log(`   High confidence (≥0.8): ${highConfidence}`);
      console.log(`   Medium confidence (0.5-0.8): ${mediumConfidence}`);
      console.log(`   Low confidence (<0.5): ${lowConfidenceCount}`);
    }

    // Show topic distribution
    if (results.categorizations.length > 0) {
      const topicCounts: Record<string, number> = {};
      results.categorizations.forEach((cat) => {
        topicCounts[cat.topicName] = (topicCounts[cat.topicName] || 0) + 1;
      });

      console.log(`\n📚 Topic Distribution:`);
      Object.entries(topicCounts)
        .sort(([, a], [, b]) => b - a)
        .forEach(([topic, count]) => {
          console.log(`   ${topic}: ${count} questions`);
        });
    }

    // Show errors if any
    if (results.errors.length > 0) {
      console.log("\n❌ Errors encountered:");
      results.errors.forEach((error) => {
        console.log(`   Question ${error.questionNumber}: ${error.error}`);
        console.log(`   Title: ${error.questionTitle}`);
      });
    }

    // Show low confidence questions for review
    const lowConfidenceQuestions: CategorizationItem[] =
      results.categorizations.filter((c) => c.confidence < minConfidence);
    if (lowConfidenceQuestions.length > 0) {
      console.log(
        `\n⚠️  Low confidence categorizations (may need manual review):`
      );
      lowConfidenceQuestions.slice(0, 5).forEach((cat) => {
        console.log(
          `   "${cat.questionTitle}" → ${cat.topicName} > ${cat.subtopicName} (${cat.confidence.toFixed(2)})`
        );
      });
      if (lowConfidenceQuestions.length > 5) {
        console.log(`   ... and ${lowConfidenceQuestions.length - 5} more`);
      }
    }

    console.log(
      `\n✨ Categorization complete! You can now use your categorized questions in your app.`
    );
  } catch (error) {
    const errorMessage: string =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("💥 Fatal error:", errorMessage);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}
