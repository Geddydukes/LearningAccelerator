# 🎓 Agent Flow Documentation - Instructor-Centric Learning

## Overview

This document describes the complete agent interaction flow in the Wisely platform, focusing on the **instructor-centric learning model** where the Instructor Agent operates as a classroom teacher.

## 🎯 Core Learning Philosophy

Wisely uses a **classroom teaching model** where:
- **Instructor Agent** = Classroom teacher delivering lectures and checking comprehension
- **TA Agent** = Teaching assistant for hands-on coding practice
- **Socratic Agent** = Question-based learning facilitator
- **CLO Agent** = Curriculum architect creating weekly frameworks
- **Alex Agent** = Technical assessor providing weekly feedback

## 🔄 Complete User Journey

### Phase 1: Onboarding & Goal Clarification

**User**: Sarah wants to learn machine learning

**Agent Flow**:
```
Onboarder Agent → User Profile → Clarifier Agent → Learning Intent → CLO Agent → Weekly Framework
```

**Data Stored**:
- User profile and preferences
- Refined learning goals
- Initial weekly curriculum framework

### Phase 2: Daily Learning Session

**User**: Sarah starts her daily learning session

#### Step 1: Lecture Delivery (15-20 minutes)
**Instructor Agent** delivers structured content:

```
"Instructor: Good morning, Sarah! Today we're diving into Neural Networks. 
Let me walk you through the key concepts step by step.

First, let's understand what a neural network is. Think of it like a simplified 
version of how your brain processes information..."

[Instructor continues with structured lecture content from CLO framework]
```

**Data Flow**:
- **CLO** provides daily lesson framework
- **Instructor** delivers as structured lecture
- **User** receives organized, pedagogical content

#### Step 2: Comprehension Check (5-10 minutes)
**Instructor Agent** asks questions to gauge understanding:

```
"Instructor: Now let me check your understanding. 

Question 1: What do you think happens when we increase the number of hidden layers 
in a neural network?

Sarah: I think it makes it more complex?

Instructor: Exactly! But let me ask a follow-up - what are the trade-offs of 
increasing complexity?

Sarah: Hmm, I'm not sure...

Instructor: Great question! Let me explain the bias-variance tradeoff..."
```

**Instructor Adaptation**:
- If Sarah answers correctly → Move to next concept
- If Sarah struggles → Provide additional explanation
- If Sarah has misconceptions → Correct and reinforce

#### Step 3: Practice Preparation (5 minutes)
**Instructor Agent** prepares Sarah for practice sessions:

```
"Instructor: Perfect! Now that you understand the basics, you're ready for some 
hands-on practice. 

Based on what we've covered, I recommend you start with the TA session to build 
a simple neural network, then use the Socratic session to explore the concepts 
deeper through questioning.

I'll let both the TA and Socratic know that you've mastered the basic concepts 
but might need extra help with the bias-variance tradeoff."
```

**Data Stored**:
- Lecture content delivered
- Comprehension check results
- User's understanding level
- Practice preparation notes

### Phase 3: Practice Sessions (User Choice)

**User**: Sarah chooses practice mode after Instructor session

#### Option A: TA Practice (Hands-on Coding)
**TA Agent** receives instructor-modified prompt:

**Original CLO Prompt**:
```yaml
topic: "Neural Networks"
exercises: ["Build simple NN", "Test with data", "Optimize parameters"]
difficulty: "intermediate"
```

**Instructor-Modified Prompt**:
```yaml
topic: "Neural Networks"
exercises: ["Build simple NN", "Test with data", "Optimize parameters"]
difficulty: "intermediate"
user_understanding: {
  basic_concepts: "mastered",
  bias_variance: "needs_reinforcement", 
  optimization: "not_covered"
}
instructor_notes: "User understands basic NN structure but struggled with bias-variance tradeoff. Focus TA exercises on this concept."
practice_focus: "bias_variance_tradeoff"
```

**TA Agent Response**:
```
"Let's build a neural network and experiment with different complexities 
to see the bias-variance tradeoff in action. I'll guide you through 
creating models with different numbers of layers so you can see how 
complexity affects performance..."
```

#### Coding Workspace (Unified Tool)
- The Education Agent invokes a dedicated Coding Workspace when practice requires coding.
- The workspace provides: virtual file system, Monaco editor, test runner, TA hints/fixes, and Alex reviews.
- TA and Alex are called via server-side tools that parse inputs (fs[], language, rubric) and return structured outputs (hints, patches, annotations, scorecards).

#### Option B: Socratic Practice (Question-Based Learning)
**Socratic Agent** receives instructor-modified prompt:

**Instructor-Modified Prompt**:
```yaml
topic: "Neural Networks"
questions: ["What is a neuron?", "How do layers work?", "What is backpropagation?"]
user_understanding: {
  basic_concepts: "mastered",
  bias_variance: "needs_deeper_exploration"
}
instructor_notes: "User can explain basic concepts but needs deeper understanding of bias-variance tradeoff"
socratic_focus: "bias_variance_deep_dive"
```

**Socratic Agent Response**:
```
"What do you think happens when we make our neural network too simple? 
Can you give me a real-world example of when this might be a problem?"
```

### Phase 4: Daily Feedback Loop

**End of Day**: System processes all learning data

**Daily Adaptation Flow**:
```
Instructor Session Results + TA/Socratic Results → Instructor Agent → Modified Next Day Plan
```

**Instructor Agent**:
- Analyzes Sarah's comprehension from teaching session
- Reviews practice session outcomes
- Identifies knowledge gaps or strengths
- Modifies tomorrow's lesson plan accordingly

**Example**:
- Day 1: Sarah struggled with backpropagation
- Day 2: Instructor starts with simpler gradient concepts
- Day 3: Instructor provides more visual examples

### Phase 5: Weekly Assessment & Curriculum Adjustment

**End of Week**: Alex grades weekly tasks

**Weekly Feedback Loop**:
```
Alex Assessment → CLO Agent → Next Week's Curriculum
```

**Alex Agent**:
- Reviews Sarah's weekly project submissions
- Provides detailed technical feedback
- Scores competency levels
- Identifies curriculum gaps

**CLO Agent**:
- Takes Alex's assessment results
- Adjusts next week's learning objectives
- Modifies difficulty and pacing
- Updates resource recommendations

**Example**:
- Week 1: Sarah scored 6/10 on neural network implementation
- Week 2: CLO adds more hands-on coding practice
- Week 3: CLO introduces advanced optimization techniques

## 🔄 Agent Interaction Patterns

### Sequential Dependencies
```
Onboarder → Clarifier → CLO → Instructor → TA/Socratic
```

### Parallel Coordination
```
Orchestrator calls: [CLO, Instructor] in parallel for daily planning
                ↓
         Instructor modifies prompts for TA/Socratic
```

### Feedback Loops
```
Daily: User Progress → Instructor → Next Day Plan
Weekly: Alex Assessment → CLO → Next Week Curriculum
```

## 📊 Data Persistence Strategy

| Agent | Persistence Target | Data Type | Use Case |
|-------|-------------------|-----------|----------|
| **Instructor** | `agent_results` | Lecture content, comprehension checks | Daily teaching adaptation |
| **CLO** | `both` | Weekly plans, objectives | Curriculum architecture |
| **Socratic** | `both` | Questions, mastery levels | Concept facilitation |
| **Alex** | `both` | Code reviews, scores | Technical assessment |
| **TA** | `both` | Daily coaching, blockers | Micro-coaching |

## 🎯 Key Implementation Requirements

### Instructor Agent Capabilities
```typescript
interface InstructorAgent {
  deliverLecture(basePrompt: CLOPrompt): Promise<LectureContent>;
  checkComprehension(lectureContent: LectureContent): Promise<ComprehensionCheck>;
  modifyPracticePrompts(
    basePrompt: CLOPrompt, 
    comprehensionResults: ComprehensionCheck
  ): Promise<ModifiedPrompts>;
}
```

### Prompt Modification System
```typescript
interface PromptModification {
  basePrompt: string;
  userUnderstanding: Record<string, 'mastered' | 'needs_work' | 'not_understood'>;
  instructorNotes: string;
  practiceFocus: string[];
}
```

### Frontend Interface Requirements
- Lecture delivery interface
- Comprehension check forms
- Practice preparation screen
- Seamless flow to TA/Socratic
- User choice between practice modes

## 🚀 Success Metrics

- ✅ **Instructor** operates as classroom teacher with structured lectures
- ✅ **Comprehension checks** adapt teaching in real-time
- ✅ **Practice prompts** are tailored to user understanding level
- ✅ **Daily feedback** modifies next day's learning plan
- ✅ **Weekly assessment** adjusts next week's curriculum
- ✅ **Seamless flow** between all agents with proper handoffs
- ✅ **Personalized learning** based on comprehension and progress

---

**Version**: 3.0  
**Last Updated**: January 2025  
**Focus**: Instructor-Centric Learning Flow
