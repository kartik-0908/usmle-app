import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    console.log("categorizing questions ...");
    await categorizeQuestions();
    return new Response("categorizing questions saved", {
      status: 200,
    });
  } catch (error) {
    console.error("Error seeding cardiology topics:", error);
    return new Response("Error seeding topics", { status: 500 });
  }
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


const fs = require('fs');
const { createInterface } = require('readline');



// Helper function to parse JSONL file
async function parseJSONLFile(filePath: string) {
  const questions = [];
  const fileStream = fs.createReadStream(filePath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.trim()) {
      try {
        const question = JSON.parse(line);
        questions.push(question);
      } catch (error) {
        console.error('Error parsing line:', line, error);
      }
    }
  }

  return questions;
}

// Function to determine difficulty based on meta_info
function getDifficulty(metaInfo: string) {
  if (!metaInfo) return 'MEDIUM';
  
  const info = metaInfo.toLowerCase();
  if (info.includes('step1')) return 'MEDIUM';
  if (info.includes('step2') || info.includes('step3')) return 'HARD';
  return 'MEDIUM';
}

// Function to create question with options
async function createQuestionWithOptions(questionData: any) {
  const { question, answer, options, meta_info, answer_idx } = questionData;
  
  return await prisma.$transaction(async (tx: any) => {
    // Create the question
    const createdQuestion = await tx.question.create({
      data: {
        title: question.substring(0, 100) + (question.length > 100 ? '...' : ''),
        questionText: question,
        explanation: `Correct answer: ${answer}`, // Store the correct answer text as explanation
        difficulty: getDifficulty(meta_info),
        questionType: 'MULTIPLE_CHOICE',
        isActive: true,
      }
    });

    // Create options
    const optionPromises = Object.entries(options).map(([key, text], index) => 
      tx.option.create({
        data: {
          text: text,
          isCorrect: key === answer_idx,
          order: index,
          questionId: createdQuestion.id
        }
      })
    );

    await Promise.all(optionPromises);

    return createdQuestion;
  });
}

async function importQuestions() {
  try {
    // Get the file path from command line arguments
    const filePath = '/Users/kartik/projects/usmle/public/US/dev.jsonl';
    
    if (!filePath) {
      console.error('Please provide the path to your JSONL file');
      console.error('Usage: node scripts/import-questions.js <path-to-jsonl-file>');
      process.exit(1);
    }

    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    console.log('🚀 Starting question import process...');

    // Parse JSONL file
    console.log('📖 Parsing JSONL file...');
    const questions = await parseJSONLFile(filePath);
    console.log(`Found ${questions.length} questions to process`);

    const results = {
      total: questions.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process questions in batches
    const batchSize = 10; // Larger batch size since no API calls
    
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      
      console.log(`\n🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(questions.length/batchSize)} (questions ${i + 1}-${Math.min(i + batchSize, questions.length)})`);
      
      await Promise.all(batch.map(async (questionData, index) => {
        const questionNumber = i + index + 1;
        
        try {
          console.log(`   Processing question ${questionNumber}/${questions.length}...`);

          // Create question with options
          await createQuestionWithOptions(questionData);

          results.successful++;
          console.log(`   ✅ Question ${questionNumber} created successfully`);

        } catch (error) {
          console.error(`   ❌ Error processing question ${questionNumber}:`, error);
          results.failed++;
        //   results.errors.push({
        //     questionNumber,
        //     error: error.message,
        //     question: questionData.question.substring(0, 100) + '...'
        //   });
        }
      }));
    }

    console.log('\n🎉 Import process completed!');
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
      console.log('\n📋 Sample created questions:');
      const sampleQuestions = await prisma.question.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          options: true
        }
      });

    //   sampleQuestions.forEach((q, index) => {
    //     console.log(`\n   ${index + 1}. ${q.title}`);
    //     console.log(`      Difficulty: ${q.difficulty}`);
    //     console.log(`      Options: ${q.options.length}`);
    //     console.log(`      Correct: ${q.options.find(o => o.isCorrect)?.text.substring(0, 50)}...`);
    //   });
    }

  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}


import { generateObject } from 'ai';
import { z } from 'zod';

import { createAzure } from '@ai-sdk/azure';
import { Question, Subtopic, Topic } from "@/app/generated/prisma";

const azure = createAzure({
  resourceName: 'makai-azurespon', // Azure resource name
  apiKey: 'c013945bae504f1d910f4a82d6396aec',
});

// Schema for LLM response validation
const categorizeSchema = z.object({
  topicName: z.string().describe('The exact topic name from the provided list'),
  subtopicName: z.string().describe('The exact subtopic name from the provided list'),
  confidence: z.number().min(0).max(1).describe('Confidence level (0-1) for this categorization')
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
async function getUncategorizedQuestions(limit: number = 50): Promise<Question[]> {
  return await prisma.question.findMany({
    where: {
      questionTopics: {
        none: {} // Questions that have no topic assignments
      }
    },
    take: limit,
    orderBy: {
      createdAt: 'asc'
    }
  });
}

// Function to get all topics and subtopics for LLM context
async function getTopicsAndSubtopics(): Promise<TopicWithSubtopics[]> {
  const topics = await prisma.topic.findMany({
    include: {
      subtopics: {
        where: {
          isActive: true
        }
      }
    },
    where: {
      isActive: true
    }
  });

  return topics;
}

// Function to categorize question using Vercel AI SDK
async function categorizeQuestion(
  questionText: string, 
  topicsContext: TopicWithSubtopics[]
): Promise<CategorizationResult> {
  const topicsText: string = topicsContext.map(topic => 
    `${topic.name}:\n${topic.subtopics.map(sub => `  - ${sub.name}`).join('\n')}`
  ).join('\n\n');

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
      model: azure('gpt-4.1'),
      schema: categorizeSchema,
      prompt: prompt,
      temperature: 0.1,
    });

    return result.object;
  } catch (error) {
    console.error('Error categorizing question:', error);
    // Fallback to first available topic/subtopic if LLM fails
    return {
      topicName: topicsContext[0]?.name || 'Unknown',
      subtopicName: topicsContext[0]?.subtopics[0]?.name || 'Unknown',
      confidence: 0.1
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
        topicId: topicId
      }
    });

    // Create subtopic relationship
    await tx.questionSubtopic.create({
      data: {
        questionId: questionId,
        subtopicId: subtopicId
      }
    });

    return true;
  });
}

// Main categorization function
async function categorizeQuestions(): Promise<void> {
  try {
    // Parse command line arguments
    const args: string[] = process.argv.slice(2);
    const maxQuestions: number = parseInt(args[0]) || 1000;
    const minConfidence: number = parseFloat(args[1]) || 0.5;
    const batchSize: number = parseInt(args[2]) || 10;

    console.log('🚀 Starting question categorization process...');
    console.log(`📊 Configuration:`);
    console.log(`   Max questions: ${maxQuestions}`);
    console.log(`   Min confidence: ${minConfidence}`);
    console.log(`   Batch size: ${batchSize}`);

    // Get topics and subtopics for LLM context
    console.log('\n📚 Loading topics and subtopics...');
    const topicsContext: TopicWithSubtopics[] = await getTopicsAndSubtopics();
    
    if (topicsContext.length === 0) {
      console.error('❌ No topics found in database. Please create topics first.');
      process.exit(1);
    }

    console.log(`Found ${topicsContext.length} topics with subtopics:`);
    topicsContext.forEach(topic => {
      console.log(`   ${topic.name} (${topic.subtopics.length} subtopics)`);
    });

    // Get uncategorized questions
    console.log('\n🔍 Fetching uncategorized questions...');
    const questions: Question[] = await getUncategorizedQuestions(maxQuestions);
    
    if (questions.length === 0) {
      console.log('✅ No uncategorized questions found. All questions are already categorized!');
      process.exit(0);
    }

    console.log(`Found ${questions.length} uncategorized questions to process`);

    const results: Results = {
      total: questions.length,
      successful: 0,
      failed: 0,
      lowConfidence: 0,
      errors: [],
      categorizations: []
    };

    // Process questions in batches to manage API rate limits
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch: Question[] = questions.slice(i, i + batchSize);
      
      console.log(`\n🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(questions.length/batchSize)} (questions ${i + 1}-${Math.min(i + batchSize, questions.length)})`);
      
      for (const [index, question] of batch.entries()) {
        const questionNumber: number = i + index + 1;
        
        try {
          console.log(`   📝 [${questionNumber}/${questions.length}] Categorizing: ${question.title}`);

          // Categorize question using LLM
          const categorization: CategorizationResult = await categorizeQuestion(
            question.questionText, 
            topicsContext
          );

          // Find topic and subtopic IDs
          const topic: TopicWithSubtopics | undefined = topicsContext.find(t => t.name === categorization.topicName);
          if (!topic) {
            throw new Error(`Topic not found: ${categorization.topicName}`);
          }

          const subtopic: Subtopic | undefined = topic.subtopics.find(sub => sub.name === categorization.subtopicName);
          if (!subtopic) {
            throw new Error(`Subtopic not found: ${categorization.subtopicName} in topic ${topic.name}`);
          }

          // Check confidence threshold
          const confidenceIcon: string = categorization.confidence >= minConfidence ? '🎯' : '⚠️';
          console.log(`      ${confidenceIcon} ${categorization.topicName} > ${categorization.subtopicName} (confidence: ${categorization.confidence.toFixed(2)})`);

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
            confidence: categorization.confidence
          });

          console.log(`      ✅ Successfully categorized question ${questionNumber}`);

        } catch (error) {
          const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
          console.error(`      ❌ Error categorizing question ${questionNumber}:`, errorMessage);
          results.failed++;
          results.errors.push({
            questionNumber,
            questionId: question.id,
            questionTitle: question.title,
            error: errorMessage
          });
        }

        // Small delay between requests to respect rate limits
        await new Promise<void>(resolve => setTimeout(resolve, 750));
      }

      // Longer delay between batches
      if (i + batchSize < questions.length) {
        console.log(`   ⏱️  Waiting 3 seconds before next batch...`);
        await new Promise<void>(resolve => setTimeout(resolve, 3000));
      }
    }

    console.log('\n🎉 Categorization process completed!');
    console.log(`📊 Final Results:`);
    console.log(`   Total processed: ${results.total}`);
    console.log(`   Successfully categorized: ${results.successful}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`   Low confidence: ${results.lowConfidence}`);

    // Show confidence distribution
    if (results.categorizations.length > 0) {
      const confidences: number[] = results.categorizations.map(c => c.confidence);
      const avgConfidence: number = confidences.reduce((a, b) => a + b, 0) / confidences.length;
      const highConfidence: number = confidences.filter(c => c >= 0.8).length;
      const mediumConfidence: number = confidences.filter(c => c >= 0.5 && c < 0.8).length;
      const lowConfidenceCount: number = confidences.filter(c => c < 0.5).length;

      console.log(`\n📈 Confidence Distribution:`);
      console.log(`   Average confidence: ${avgConfidence.toFixed(2)}`);
      console.log(`   High confidence (≥0.8): ${highConfidence}`);
      console.log(`   Medium confidence (0.5-0.8): ${mediumConfidence}`);
      console.log(`   Low confidence (<0.5): ${lowConfidenceCount}`);
    }

    // Show topic distribution
    if (results.categorizations.length > 0) {
      const topicCounts: Record<string, number> = {};
      results.categorizations.forEach(cat => {
        topicCounts[cat.topicName] = (topicCounts[cat.topicName] || 0) + 1;
      });

      console.log(`\n📚 Topic Distribution:`);
      Object.entries(topicCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([topic, count]) => {
          console.log(`   ${topic}: ${count} questions`);
        });
    }

    // Show errors if any
    if (results.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      results.errors.forEach(error => {
        console.log(`   Question ${error.questionNumber}: ${error.error}`);
        console.log(`   Title: ${error.questionTitle}`);
      });
    }

    // Show low confidence questions for review
    const lowConfidenceQuestions: CategorizationItem[] = results.categorizations.filter(c => c.confidence < minConfidence);
    if (lowConfidenceQuestions.length > 0) {
      console.log(`\n⚠️  Low confidence categorizations (may need manual review):`);
      lowConfidenceQuestions.slice(0, 5).forEach(cat => {
        console.log(`   "${cat.questionTitle}" → ${cat.topicName} > ${cat.subtopicName} (${cat.confidence.toFixed(2)})`);
      });
      if (lowConfidenceQuestions.length > 5) {
        console.log(`   ... and ${lowConfidenceQuestions.length - 5} more`);
      }
    }

    console.log(`\n✨ Categorization complete! You can now use your categorized questions in your app.`);

  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('💥 Fatal error:', errorMessage);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}