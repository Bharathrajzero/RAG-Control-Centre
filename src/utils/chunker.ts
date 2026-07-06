import { v4 as uuidv4 } from 'uuid';

export interface ChildChunk {
  id: string;
  parentId: string;
  text: string;
}

export interface ParentChunk {
  id: string;
  text: string;
  children: ChildChunk[];
}

/**
 * Splits text into large parent windows, then segments parents into smaller child windows.
 */
export function createParentChildChunks(
  text: string,
  parentSize: number = 2000, 
  childSize: number = 400, 
  childOverlap: number = 50
): ParentChunk[] {
  const parentChunks: ParentChunk[] = [];
  const words = text.split(' ');
  
  // 1. Generate Parent Chunks
  for (let i = 0; i < words.length; i += parentSize) {
    const parentText = words.slice(i, i + parentSize).join(' ');
    if (!parentText) continue;

    const parentId = uuidv4();
    const children: ChildChunk[] = [];
    const parentWords = parentText.split(' ');

    // 2. Generate Child Chunks within this specific Parent Context
    for (let j = 0; j < parentWords.length; j += (childSize - childOverlap)) {
      const childText = parentWords.slice(j, j + childSize).join(' ');
      if (!childText || childText.length < 10) continue; // Skip fragments

      children.push({
        id: uuidv4(),
        parentId: parentId,
        text: childText
      });
    }

    parentChunks.push({
      id: parentId,
      text: parentText,
      children: children
    });
  }

  return parentChunks;
}