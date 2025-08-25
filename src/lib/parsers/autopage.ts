// Autopage aggregator for multi-part agent responses
// Detects "Part X/Y" patterns and concatenates content in proper order

export interface ParsedMessage {
  markdown: string;
  jsonBlocks: any[];
  metadata: {
    totalParts: number;
    currentPart: number;
    isComplete: boolean;
    detectedFormat: 'single' | 'multi_part' | 'unknown';
  };
}

export interface JsonBlock {
  type: string;
  data: any;
  position: number;
}

/**
 * Aggregate multi-part messages into a single coherent response
 */
export function aggregateParts(messages: string[]): ParsedMessage {
  if (messages.length === 0) {
    return {
      markdown: '',
      jsonBlocks: [],
      metadata: {
        totalParts: 0,
        currentPart: 0,
        isComplete: false,
        detectedFormat: 'unknown'
      }
    };
  }

  if (messages.length === 1) {
    return parseSingleMessage(messages[0]);
  }

  return parseMultiPartMessage(messages);
}

/**
 * Parse a single message for markdown and JSON blocks
 */
function parseSingleMessage(message: string): ParsedMessage {
  const jsonBlocks = extractJsonBlocks(message);
  const markdown = cleanMarkdown(message);

  return {
    markdown,
    jsonBlocks,
    metadata: {
      totalParts: 1,
      currentPart: 1,
      isComplete: true,
      detectedFormat: 'single'
    }
  };
}

/**
 * Parse multi-part messages and concatenate them properly
 */
function parseMultiPartMessage(messages: string[]): ParsedMessage {
  const parts: Array<{ part: number; content: string; jsonBlocks: any[] }> = [];
  let totalParts = 0;

  // Parse each message and extract part information
  for (const message of messages) {
    const partInfo = extractPartInfo(message);
    if (partInfo) {
      parts.push({
        part: partInfo.partNumber,
        content: message,
        jsonBlocks: extractJsonBlocks(message)
      });
      totalParts = Math.max(totalParts, partInfo.totalParts);
    } else {
      // Message without part info, treat as continuation
      parts.push({
        part: parts.length + 1,
        content: message,
        jsonBlocks: extractJsonBlocks(message)
      });
    }
  }

  // Sort parts by part number
  parts.sort((a, b) => a.part - b.part);

  // Concatenate markdown content
  const markdown = parts
    .map(part => cleanMarkdown(part.content))
    .join('\n\n---\n\n');

  // Collect all JSON blocks
  const allJsonBlocks = parts.flatMap(part => part.jsonBlocks);

  // Check if we have all parts
  const isComplete = parts.length >= totalParts && totalParts > 0;

  return {
    markdown,
    jsonBlocks: allJsonBlocks,
    metadata: {
      totalParts,
      currentPart: parts.length,
      isComplete,
      detectedFormat: 'multi_part'
    }
  };
}

/**
 * Extract part information from message (e.g., "Part 2/5")
 */
function extractPartInfo(message: string): { partNumber: number; totalParts: number } | null {
  const partPatterns = [
    /Part\s+(\d+)\s*\/\s*(\d+)/i,
    /Part\s+(\d+)\s+of\s+(\d+)/i,
    /(\d+)\s*\/\s*(\d+)\s*parts?/i
  ];

  for (const pattern of partPatterns) {
    const match = message.match(pattern);
    if (match) {
      return {
        partNumber: parseInt(match[1], 10),
        totalParts: parseInt(match[2], 10)
      };
    }
  }

  return null;
}

/**
 * Extract JSON blocks from message content
 */
function extractJsonBlocks(message: string): any[] {
  const jsonBlocks: any[] = [];
  
  // Look for JSON code blocks
  const codeBlockPattern = /```(?:json)?\s*\n([\s\S]*?)\n```/g;
  let match;
  
  while ((match = codeBlockPattern.exec(message)) !== null) {
    try {
      const jsonContent = match[1].trim();
      const parsed = JSON.parse(jsonContent);
      jsonBlocks.push({
        type: 'code_block',
        data: parsed,
        position: match.index
      });
    } catch (error) {
      // Not valid JSON, skip
    }
  }

  // Look for inline JSON objects
  const inlineJsonPattern = /\{[\s\S]*?\}/g;
  while ((match = inlineJsonPattern.exec(message)) !== null) {
    try {
      const jsonContent = match[0];
      const parsed = JSON.parse(jsonContent);
      jsonBlocks.push({
        type: 'inline',
        data: parsed,
        position: match.index
      });
    } catch (error) {
      // Not valid JSON, skip
    }
  }

  return jsonBlocks;
}

/**
 * Clean markdown content by removing JSON blocks and normalizing
 */
function cleanMarkdown(message: string): string {
  let cleaned = message;

  // Remove JSON code blocks
  cleaned = cleaned.replace(/```(?:json)?\s*\n[\s\S]*?\n```/g, '');

  // Remove part indicators
  cleaned = cleaned.replace(/Part\s+\d+\s*\/\s*\d+/gi, '');
  cleaned = cleaned.replace(/Part\s+\d+\s+of\s+\d+/gi, '');
  cleaned = cleaned.replace(/\d+\s*\/\s*\d+\s*parts?/gi, '');

  // Clean up extra whitespace
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Check if a message appears to be complete
 */
export function isMessageComplete(message: string): boolean {
  // Look for completion indicators
  const completionPatterns = [
    /END_TOPIC/i,
    /CLO_Briefing_Note/i,
    /TA_Session_Note/i,
    /Lead_Engineer_Briefing_Note/i,
    /Brand_Strategy_Note/i
  ];

  return completionPatterns.some(pattern => pattern.test(message));
}

/**
 * Get the next expected part number
 */
export function getNextPartNumber(messages: string[]): number {
  if (messages.length === 0) return 1;

  const lastMessage = messages[messages.length - 1];
  const partInfo = extractPartInfo(lastMessage);
  
  if (partInfo) {
    return partInfo.partNumber + 1;
  }

  return messages.length + 1;
}
