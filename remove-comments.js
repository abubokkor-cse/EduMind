#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function removeComments(code, keepPercentage = 25) {
    let result = '';
    let i = 0;
    let inString = false;
    let stringChar = '';
    let commentCount = 0;

    // First pass: count comments
    let tempI = 0;
    let totalComments = 0;
    let tempInString = false;
    let tempStringChar = '';

    while (tempI < code.length) {
        const char = code[tempI];
        const next = code[tempI + 1];

        if (char === '"' || char === "'" || char === '`') {
            if (!tempInString) {
                tempInString = true;
                tempStringChar = char;
            } else if (char === tempStringChar && code[tempI - 1] !== '\\') {
                tempInString = false;
            }
        }

        if (!tempInString) {
            if ((char === '/' && next === '/') || (char === '/' && next === '*')) {
                totalComments++;
            }
        }
        tempI++;
    }

    const commentsToKeep = Math.ceil(totalComments * (keepPercentage / 100));
    const keepInterval = Math.floor(totalComments / commentsToKeep) || 1;

    // Second pass: remove comments selectively
    inString = false;
    while (i < code.length) {
        const char = code[i];
        const next = code[i + 1];

        // Handle strings
        if (char === '"' || char === "'" || char === '`') {
            if (!inString) {
                inString = true;
                stringChar = char;
            } else if (char === stringChar && code[i - 1] !== '\\') {
                inString = false;
            }
            result += char;
            i++;
            continue;
        }

        // Handle comments when not in string
        if (!inString) {
            // Single-line comment
            if (char === '/' && next === '/') {
                commentCount++;
                const shouldKeep = (commentCount % keepInterval === 0);

                if (shouldKeep) {
                    // Keep this comment
                    while (i < code.length && code[i] !== '\n') {
                        result += code[i];
                        i++;
                    }
                    if (i < code.length) {
                        result += code[i];
                        i++;
                    }
                } else {
                    // Skip this comment
                    while (i < code.length && code[i] !== '\n') {
                        i++;
                    }
                }
                continue;
            }

            // Multi-line comment
            if (char === '/' && next === '*') {
                commentCount++;
                const shouldKeep = (commentCount % keepInterval === 0);

                if (shouldKeep) {
                    // Keep this comment
                    result += char;
                    result += next;
                    i += 2;
                    while (i < code.length - 1) {
                        result += code[i];
                        if (code[i] === '*' && code[i + 1] === '/') {
                            result += code[i + 1];
                            i += 2;
                            break;
                        }
                        i++;
                    }
                } else {
                    // Skip this comment
                    i += 2;
                    while (i < code.length - 1) {
                        if (code[i] === '*' && code[i + 1] === '/') {
                            i += 2;
                            break;
                        }
                        i++;
                    }
                }
                continue;
            }
        }

        result += char;
        i++;
    }

    return result;
}

function processFile(filePath, keepPercentage) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const cleaned = removeComments(content, keepPercentage);

        const originalSize = content.length;
        const newSize = cleaned.length;
        const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);

        fs.writeFileSync(filePath, cleaned, 'utf8');
        console.log(`✅ ${path.basename(filePath)} - Reduced by ${reduction}% (${originalSize} → ${newSize} chars)`);
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
    }
}

function processDirectory(dirPath, keepPercentage, extensions = ['.js', '.mjs']) {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            processDirectory(filePath, keepPercentage, extensions);
        } else if (extensions.some(ext => file.endsWith(ext))) {
            processFile(filePath, keepPercentage);
        }
    }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('Usage:');
    console.log('  node remove-comments.js <file.js> [keep%]           - Remove comments from single file');
    console.log('  node remove-comments.js <directory> [keep%]         - Remove comments from all JS files');
    console.log('');
    console.log('Examples:');
    console.log('  node remove-comments.js app.js                - Remove 75% comments (keep 25%)');
    console.log('  node remove-comments.js app.js 30             - Remove 70% comments (keep 30%)');
    console.log('  node remove-comments.js modules/ 20           - Remove 80% comments (keep 20%)');
    console.log('  node remove-comments.js . 25                  - Process all files, keep 25%');
    process.exit(0);
}

let keepPercentage = 25;
let filePaths = args;

// Check if last argument is a number (keep percentage)
const lastArg = args[args.length - 1];
if (!isNaN(lastArg) && Number(lastArg) > 0 && Number(lastArg) < 100) {
    keepPercentage = Number(lastArg);
    filePaths = args.slice(0, -1);
}

console.log(`🧹 Removing ~${100 - keepPercentage}% of comments (keeping ~${keepPercentage}%)...\n`);

for (const arg of filePaths) {
    const fullPath = path.resolve(arg);

    if (!fs.existsSync(fullPath)) {
        console.error(`❌ File or directory not found: ${arg}`);
        continue;
    }

    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
        console.log(`📁 Processing directory: ${arg}`);
        processDirectory(fullPath, keepPercentage);
    } else {
        processFile(fullPath, keepPercentage);
    }
}

console.log('\n✨ Done!');
