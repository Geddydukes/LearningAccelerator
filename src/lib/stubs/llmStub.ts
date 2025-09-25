/**
 * LLM Stub for Local Development
 * 
 * Provides mock responses for LLM calls when running locally without API keys.
 * This allows developers to work on the frontend and test the complete flow
 * without needing real LLM API access.
 */

export interface LLMStubConfig {
  enabled: boolean;
  delay: number; // Simulate API delay in ms
  errorRate: number; // 0-1, probability of returning error
  responseVariation: boolean; // Whether to vary responses
}

export interface LLMStubResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
  finish_reason?: string;
}

export class LLMStub {
  private config: LLMStubConfig;
  private responseCounter = 0;

  constructor(config: Partial<LLMStubConfig> = {}) {
    this.config = {
      enabled: true,
      delay: 1000,
      errorRate: 0.05,
      responseVariation: true,
      ...config
    };
  }

  async generateResponse(prompt: string, agent: string): Promise<LLMStubResponse> {
    if (!this.config.enabled) {
      throw new Error('LLM Stub is disabled');
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, this.config.delay));

    // Simulate occasional errors
    if (Math.random() < this.config.errorRate) {
      throw new Error('Simulated LLM API error');
    }

    this.responseCounter++;

    // Generate contextual responses based on agent and prompt
    const response = this.generateContextualResponse(prompt, agent);
    
    return {
      content: response,
      usage: {
        prompt_tokens: Math.floor(prompt.length / 4),
        completion_tokens: Math.floor(response.length / 4),
        total_tokens: Math.floor((prompt.length + response.length) / 4)
      },
      model: 'stub-model-v1',
      finish_reason: 'stop'
    };
  }

  private generateContextualResponse(prompt: string, agent: string): string {
    const responses = this.getAgentResponses(agent);
    
    if (this.config.responseVariation && responses.length > 1) {
      const index = this.responseCounter % responses.length;
      return responses[index];
    }
    
    return responses[0];
  }

  private getAgentResponses(agent: string): string[] {
    switch (agent) {
      case 'clo':
        return [
          `# Program Plan: Data Science Fundamentals

## Overview
This 4-week program introduces learners to data science concepts, Python programming, and statistical foundations.

## Week 1: Introduction to Data Science
- **Day 1**: What is Data Science? Understanding the workflow
- **Day 2**: Python Environment Setup and Jupyter Notebooks
- **Day 3**: Basic Python Syntax and Data Types
- **Day 4**: Introduction to Pandas and DataFrames
- **Day 5**: Project: Hello Data Science

## Learning Objectives
- Understand core data science concepts
- Master Python basics for data analysis
- Learn fundamental statistical concepts
- Create basic data visualizations

## Assessment Criteria
- Coding projects (40%)
- Conceptual understanding (30%)
- Practical application (30%)`,

          `# Weekly Plan: Introduction to Data Science

## Day 1: What is Data Science?
**Learning Objectives:**
- Understand the data science workflow
- Learn about different types of data
- Explore real-world applications

**Lecture Content:**
- Data science definition and scope
- The data science workflow (Ask, Prepare, Process, Analyze, Share, Act)
- Types of data (structured, unstructured, semi-structured)

**Practice Exercises:**
- Create a simple data collection survey
- Identify data types in a sample dataset`
        ];

      case 'instructor':
        return [
          `# Lecture: Introduction to Data Science

Welcome to your first day of data science! Today we'll explore what data science is and how it's used in the real world.

## What is Data Science?

Data science is an interdisciplinary field that combines:
- **Statistics**: Understanding patterns in data
- **Computer Science**: Programming and algorithms
- **Domain Knowledge**: Understanding the business context

## The Data Science Workflow

The typical data science process follows these steps:

1. **Ask**: Define the problem and questions
2. **Prepare**: Collect and clean the data
3. **Process**: Transform and analyze the data
4. **Analyze**: Find patterns and insights
5. **Share**: Present findings to stakeholders
6. **Act**: Implement solutions based on insights

## Real-World Examples

- **Netflix**: Recommends movies based on viewing history
- **Google Maps**: Predicts traffic patterns
- **Amazon**: Suggests products based on purchase history

Let's start with a simple question: What problems in your daily life could data science help solve?`,

          `# Comprehension Check: Data Science Fundamentals

## Questions

1. **What are the main steps in the data science workflow?**
   - Ask, Prepare, Process, Analyze, Share, Act

2. **Can you give an example of structured vs. unstructured data?**
   - Structured: Excel spreadsheet with columns and rows
   - Unstructured: Social media posts, images, videos

3. **How does data science differ from traditional statistics?**
   - Data science includes programming, visualization, and business context
   - Statistics focuses more on mathematical analysis

## Practice Preparation

Based on your answers, I recommend focusing on:
- Understanding the data science workflow
- Practicing with different data types
- Exploring real-world applications

You're ready for hands-on practice!`
        ];

      case 'ta':
        return [
          `# TA Practice: Python Basics

Great! Let's practice some Python fundamentals. I'll guide you through creating your first data science script.

## Exercise 1: Variables and Data Types

Let's start by creating variables of different types:

\`\`\`python
# Create variables
name = "Alice"
age = 25
height = 5.6
is_student = True

# Print the variables
print(f"Name: {name}")
print(f"Age: {age}")
print(f"Height: {height}")
print(f"Is Student: {is_student}")
\`\`\`

## Exercise 2: Working with Lists

Create a list of your favorite programming languages:

\`\`\`python
languages = ["Python", "JavaScript", "R", "SQL"]
print("My favorite languages:")
for lang in languages:
    print(f"- {lang}")
\`\`\`

## Exercise 3: Simple Function

Write a function to calculate the average of a list of numbers:

\`\`\`python
def calculate_average(numbers):
    return sum(numbers) / len(numbers)

# Test the function
scores = [85, 90, 78, 92, 88]
average = calculate_average(scores)
print(f"Average score: {average}")
\`\`\`

Try running these examples and let me know if you have any questions!`,

          `# TA Practice: Data Types Exploration

Excellent work! Now let's explore different data types more deeply.

## Exercise 1: Type Checking

\`\`\`python
# Check data types
data = [
    "Hello World",
    42,
    3.14,
    True,
    [1, 2, 3],
    {"name": "Alice", "age": 25}
]

for item in data:
    print(f"{item} is of type: {type(item).__name__}")
\`\`\`

## Exercise 2: Type Conversion

\`\`\`python
# Convert between types
number_str = "123"
number_int = int(number_str)
number_float = float(number_str)

print(f"String: {number_str}")
print(f"Integer: {number_int}")
print(f"Float: {number_float}")
\`\`\`

## Exercise 3: Working with Strings

\`\`\`python
# String methods
text = "Data Science is Amazing!"
print(f"Original: {text}")
print(f"Lowercase: {text.lower()}")
print(f"Uppercase: {text.upper()}")
print(f"Words: {text.split()}")
\`\`\`

Keep practicing these concepts - they're fundamental to data science!`
        ];

      case 'socratic':
        return [
          `# Socratic Dialogue: Understanding Data Science

Let's explore data science through questions and discovery!

## Opening Question

What do you think happens when you search for something on Google? How do you think Google decides which results to show you first?

*[Wait for response]*

Interesting! You're thinking about algorithms and ranking. That's exactly what data science is about - using data to make decisions.

## Follow-up Questions

1. **If you were running an online store, what data would you want to collect about your customers?**

2. **How do you think Netflix knows which movies to recommend to you?**

3. **What patterns do you notice in your own daily data? (Think about your phone usage, shopping habits, etc.)**

## Deeper Exploration

Let's think about this: If you had data about 1000 people's shopping habits, what questions could you ask that would be interesting to answer?

*[Guide the conversation toward data science concepts]*

Remember, data science is about asking the right questions, not just having the right answers!`,

          `# Socratic Dialogue: Data Types and Structure

Let's explore data through questioning!

## Starting Point

Imagine you're collecting information about your friends for a party. What different kinds of information would you want to know?

*[Wait for response]*

Great! Now, let's think about how you might organize this information.

## Structured vs. Unstructured

1. **If you wrote down your friends' information in a table with columns, what would that look like?**

2. **What if instead you just wrote a paragraph about each friend? How would that be different?**

3. **Which way would be easier to find specific information, like "who likes pizza"?**

## Real-World Application

Think about your social media posts. Are they structured or unstructured data? Why?

*[Guide toward understanding that social media posts are unstructured]*

## The Challenge

If you wanted to analyze thousands of social media posts to understand what people are talking about, what challenges would you face?

*[Lead toward understanding the need for data processing and analysis tools]*

This is exactly why we need tools like Python and data science techniques!`
        ];

      case 'alex':
        return [
          `# Alex Review: Python Basics Project

## Project Assessment

**Overall Score: 8.5/10** ⭐

## Detailed Feedback

### ✅ Strengths
- **Code Quality**: Clean, readable code with good variable names
- **Functionality**: All exercises completed successfully
- **Documentation**: Good use of comments explaining the code
- **Problem Solving**: Shows understanding of Python concepts

### 🔧 Areas for Improvement
- **Error Handling**: Could add try-catch blocks for user input
- **Code Efficiency**: Some functions could be more concise
- **Testing**: Missing test cases for edge scenarios

### 📊 Breakdown
- **Functionality**: 9/10 - All requirements met
- **Code Quality**: 8/10 - Clean and readable
- **Documentation**: 8/10 - Good comments
- **Creativity**: 8/10 - Shows understanding

### 🎯 Next Steps
1. Practice error handling with try-catch blocks
2. Learn about list comprehensions for more efficient code
3. Add unit tests to verify your functions work correctly

## Rubric Scorecard
- **Python Syntax**: 9/10
- **Data Types**: 8/10
- **Functions**: 8/10
- **Problem Solving**: 9/10

Great work! You're ready for the next level of Python programming.`,

          `# Alex Review: Data Types Exploration

## Project Assessment

**Overall Score: 9.2/10** ⭐⭐

## Detailed Feedback

### ✅ Excellent Work
- **Type Understanding**: Perfect grasp of Python data types
- **Code Examples**: Clear, well-commented examples
- **Experimentation**: Shows curiosity and exploration
- **Documentation**: Excellent explanations of each concept

### 🔧 Minor Suggestions
- **Edge Cases**: Consider what happens with empty lists or None values
- **Performance**: For large datasets, consider more efficient approaches

### 📊 Detailed Breakdown
- **Data Type Mastery**: 10/10 - Perfect understanding
- **Code Quality**: 9/10 - Clean and efficient
- **Documentation**: 9/10 - Excellent explanations
- **Problem Solving**: 9/10 - Shows deep thinking

### 🎯 Advanced Concepts
You're ready to learn about:
- Object-oriented programming
- Data structures (sets, tuples)
- Advanced string manipulation

## Rubric Scorecard
- **Type Knowledge**: 10/10
- **Code Quality**: 9/10
- **Documentation**: 9/10
- **Understanding**: 9/10

Outstanding work! You've mastered the fundamentals.`
        ];

      default:
        return [
          `# Mock Response for ${agent}

This is a mock response from the ${agent} agent. In a real implementation, this would be generated by the actual LLM API.

## Key Points
- This is a stub response for local development
- The actual response would be tailored to your specific prompt
- This allows you to test the complete flow without API keys

## Next Steps
- Configure your environment with real API keys
- Test with actual LLM responses
- Fine-tune the prompts for better results`
        ];
    }
  }

  // Method to simulate different response patterns
  setResponsePattern(pattern: 'consistent' | 'varied' | 'random') {
    switch (pattern) {
      case 'consistent':
        this.config.responseVariation = false;
        break;
      case 'varied':
        this.config.responseVariation = true;
        break;
      case 'random':
        this.config.responseVariation = true;
        this.config.errorRate = 0.1;
        break;
    }
  }

  // Method to simulate network conditions
  setNetworkConditions(conditions: 'fast' | 'slow' | 'unreliable') {
    switch (conditions) {
      case 'fast':
        this.config.delay = 200;
        this.config.errorRate = 0.01;
        break;
      case 'slow':
        this.config.delay = 3000;
        this.config.errorRate = 0.02;
        break;
      case 'unreliable':
        this.config.delay = 1500;
        this.config.errorRate = 0.15;
        break;
    }
  }
}

// Export singleton instance
export const llmStub = new LLMStub();

// Export configuration helper
export function configureLLMStub(config: Partial<LLMStubConfig>) {
  Object.assign(llmStub.config, config);
}
