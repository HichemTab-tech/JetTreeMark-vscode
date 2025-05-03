import * as fs from 'fs';
import * as path from 'path';

/**
 * Represents a parsed gitignore pattern
 */
export interface GitignorePattern {
  pattern: string;
  isNegated: boolean;
  isDirectory: boolean;
  isAbsolute: boolean;
}

/**
 * Parses a .gitignore file and returns an array of patterns
 * @param gitignorePath Path to the .gitignore file
 * @returns Array of parsed gitignore patterns
 */
export function parseGitignoreFile(gitignorePath: string): GitignorePattern[] {
  if (!fs.existsSync(gitignorePath)) {
    return [];
  }

  const content = fs.readFileSync(gitignorePath, 'utf8');
  return parseGitignoreContent(content);
}

/**
 * Parses gitignore content and returns an array of patterns
 * @param content Content of the .gitignore file
 * @returns Array of parsed gitignore patterns
 */
export function parseGitignoreContent(content: string): GitignorePattern[] {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#')) // Remove empty lines and comments
    .map(line => {
      const isNegated = line.startsWith('!');
      const pattern = isNegated ? line.substring(1) : line;
      const isDirectory = pattern.endsWith('/');
      const isAbsolute = pattern.startsWith('/') || pattern.startsWith('./');

      return {
        pattern: isAbsolute ? pattern.substring(pattern.startsWith('./') ? 2 : 1) : pattern,
        isNegated,
        isDirectory,
        isAbsolute
      };
    });
}

/**
 * Checks if a file or directory matches any of the gitignore patterns
 * @param filePath Path to the file or directory (relative to the directory containing the .gitignore)
 * @param patterns Array of gitignore patterns
 * @param isDirectory Whether the path is a directory
 * @returns True if the file or directory should be ignored
 */
export function matchesGitignorePatterns(
  filePath: string,
  patterns: GitignorePattern[],
  isDirectory: boolean
): boolean {
  // Normalize path for matching
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Start with not ignored, then apply patterns in order
  let ignored = false;

  for (const pattern of patterns) {
    // Skip directory-only patterns if this is a file
    if (pattern.isDirectory && !isDirectory) {
      continue;
    }

    if (matchesPattern(normalizedPath, pattern, isDirectory)) {
      // If pattern matches, set ignored based on whether it's negated
      ignored = !pattern.isNegated;
    }
  }

  return ignored;
}

/**
 * Checks if a path matches a gitignore pattern
 * @param normalizedPath Normalized path to check
 * @param pattern Gitignore pattern
 * @param isDirectory Whether the path is a directory
 * @returns True if the path matches the pattern
 */
function matchesPattern(
  normalizedPath: string,
  pattern: GitignorePattern,
  isDirectory: boolean
): boolean {
  const patternStr = pattern.pattern.replace(/\\/g, '/');

  // Handle exact matches
  if (!patternStr.includes('*')) {
    if (pattern.isAbsolute) {
      // For absolute patterns, match from the beginning
      return normalizedPath === patternStr || 
             (isDirectory && normalizedPath.startsWith(patternStr + '/'));
    } else {
      // For relative patterns, match anywhere in the path
      return normalizedPath === patternStr || 
             normalizedPath.endsWith('/' + patternStr) || 
             normalizedPath.includes('/' + patternStr + '/') ||
             (isDirectory && (
               normalizedPath.endsWith('/' + patternStr) || 
               normalizedPath.includes('/' + patternStr + '/')
             ));
    }
  }

  // Handle wildcard patterns
  const regexPattern = patternStr
    .replace(/\./g, '\\.') // Escape dots
    .replace(/\*/g, '.*')  // Convert * to .*
    .replace(/\?/g, '.');  // Convert ? to .

  const regex = pattern.isAbsolute
    ? new RegExp(`^${regexPattern}$`)
    : new RegExp(`(^|/)${regexPattern}$`);

  return regex.test(normalizedPath);
}

/**
 * Collects gitignore patterns from a specific directory
 * @param dirPath Path to the directory
 * @returns Array of gitignore patterns from this directory
 */
export function collectDirectoryGitignorePatterns(dirPath: string): GitignorePattern[] {
  const gitignorePath = path.join(dirPath, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    return parseGitignoreFile(gitignorePath);
  }
  return [];
}

/**
 * Collects all gitignore patterns that apply to a given directory
 * @param dirPath Path to the directory
 * @returns Array of gitignore patterns that apply to the directory
 */
export function collectGitignorePatterns(dirPath: string): GitignorePattern[] {
  const patterns: GitignorePattern[] = [];
  let currentDir = dirPath;

  // Collect patterns from all parent directories up to the root
  while (true) {
    const gitignorePath = path.join(currentDir, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const dirPatterns = parseGitignoreFile(gitignorePath);
      patterns.push(...dirPatterns);
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break; // Reached the root
    }
    currentDir = parentDir;
  }

  return patterns;
}

/**
 * Determines if a file or directory should be excluded based on gitignore patterns
 * @param fullPath Full path to the file or directory
 * @param baseDir Base directory for relative path calculation
 * @param patterns Gitignore patterns to check against
 * @param isDirectory Whether the path is a directory
 * @returns True if the file or directory should be excluded
 */
export function shouldExcludeByGitignore(
  fullPath: string,
  baseDir: string,
  patterns: GitignorePattern[],
  isDirectory: boolean
): boolean {
  // Calculate path relative to the base directory
  const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

  // Check if the path matches any gitignore pattern
  return matchesGitignorePatterns(relativePath, patterns, isDirectory);
}
