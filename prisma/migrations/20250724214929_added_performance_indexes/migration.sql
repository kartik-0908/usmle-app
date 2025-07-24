-- DropIndex
DROP INDEX "questions_id_idx";

-- DropIndex
DROP INDEX "subtopics_slug_idx";

-- DropIndex
DROP INDEX "topics_slug_idx";

-- CreateIndex
CREATE INDEX "account_userId_providerId_idx" ON "account"("userId", "providerId");

-- CreateIndex
CREATE INDEX "options_questionId_order_idx" ON "options"("questionId", "order");

-- CreateIndex
CREATE INDEX "options_questionId_isCorrect_idx" ON "options"("questionId", "isCorrect");

-- CreateIndex
CREATE INDEX "problem_set_questions_problemSetId_order_idx" ON "problem_set_questions"("problemSetId", "order");

-- CreateIndex
CREATE INDEX "problem_set_questions_questionId_idx" ON "problem_set_questions"("questionId");

-- CreateIndex
CREATE INDEX "problem_sets_isActive_createdAt_idx" ON "problem_sets"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "question_subtopics_subtopicId_idx" ON "question_subtopics"("subtopicId");

-- CreateIndex
CREATE INDEX "question_subtopics_questionId_idx" ON "question_subtopics"("questionId");

-- CreateIndex
CREATE INDEX "question_subtopics_subtopicId_createdAt_idx" ON "question_subtopics"("subtopicId", "createdAt");

-- CreateIndex
CREATE INDEX "question_topics_topicId_idx" ON "question_topics"("topicId");

-- CreateIndex
CREATE INDEX "question_topics_questionId_idx" ON "question_topics"("questionId");

-- CreateIndex
CREATE INDEX "question_topics_topicId_createdAt_idx" ON "question_topics"("topicId", "createdAt");

-- CreateIndex
CREATE INDEX "questions_isActive_createdAt_idx" ON "questions"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "questions_isActive_difficulty_idx" ON "questions"("isActive", "difficulty");

-- CreateIndex
CREATE INDEX "questions_isActive_questionType_idx" ON "questions"("isActive", "questionType");

-- CreateIndex
CREATE INDEX "questions_createdAt_idx" ON "questions"("createdAt");

-- CreateIndex
CREATE INDEX "session_userId_expiresAt_idx" ON "session"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "steps_isActive_order_idx" ON "steps"("isActive", "order");

-- CreateIndex
CREATE INDEX "steps_slug_isActive_idx" ON "steps"("slug", "isActive");

-- CreateIndex
CREATE INDEX "subtopics_slug_isActive_idx" ON "subtopics"("slug", "isActive");

-- CreateIndex
CREATE INDEX "subtopics_topicId_isActive_order_idx" ON "subtopics"("topicId", "isActive", "order");

-- CreateIndex
CREATE INDEX "subtopics_isActive_createdAt_idx" ON "subtopics"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "topics_slug_isActive_idx" ON "topics"("slug", "isActive");

-- CreateIndex
CREATE INDEX "topics_stepId_isActive_order_idx" ON "topics"("stepId", "isActive", "order");

-- CreateIndex
CREATE INDEX "topics_isActive_createdAt_idx" ON "topics"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "user_attempts_userId_attemptedAt_idx" ON "user_attempts"("userId", "attemptedAt");

-- CreateIndex
CREATE INDEX "user_attempts_questionId_isCorrect_idx" ON "user_attempts"("questionId", "isCorrect");

-- CreateIndex
CREATE INDEX "user_attempts_userId_questionId_idx" ON "user_attempts"("userId", "questionId");

-- CreateIndex
CREATE INDEX "user_problem_sets_userId_status_idx" ON "user_problem_sets"("userId", "status");

-- CreateIndex
CREATE INDEX "user_problem_sets_problemSetId_status_idx" ON "user_problem_sets"("problemSetId", "status");

-- CreateIndex
CREATE INDEX "user_step_progress_userId_isCompleted_idx" ON "user_step_progress"("userId", "isCompleted");

-- CreateIndex
CREATE INDEX "user_step_progress_stepId_isCompleted_idx" ON "user_step_progress"("stepId", "isCompleted");

-- CreateIndex
CREATE INDEX "user_step_progress_userId_lastPracticedAt_idx" ON "user_step_progress"("userId", "lastPracticedAt");

-- CreateIndex
CREATE INDEX "user_topic_progress_userId_lastPracticedAt_idx" ON "user_topic_progress"("userId", "lastPracticedAt");

-- CreateIndex
CREATE INDEX "user_topic_progress_topicId_questionsCorrect_idx" ON "user_topic_progress"("topicId", "questionsCorrect");

-- CreateIndex
CREATE INDEX "verification_identifier_value_idx" ON "verification"("identifier", "value");

-- CreateIndex
CREATE INDEX "verification_expiresAt_idx" ON "verification"("expiresAt");
