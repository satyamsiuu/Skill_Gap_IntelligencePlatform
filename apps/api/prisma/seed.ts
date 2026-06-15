/**
 * SGIP — Prisma Seed Script
 * Ticket: SGIP-1.1.2.3
 *
 * Idempotent seed for development and test environments.
 * Safe to re-run: uses upsert throughout (no duplicate rows on re-run).
 *
 * What this seeds:
 * 1. Initial canonical Skills taxonomy (~35 skills across 6 categories)
 * 2. Common SkillAliases for normalization engine testing
 * 3. Initial canonical Roles (~6 roles)
 * 4. RoleRequirementSets (v1) for each role with REQUIRED/IMPORTANT/NICE_TO_HAVE
 * 5. PlatformConfig initial values (scoring weights, normalization thresholds)
 *
 * Source/Rationale:
 * - Skills selected to cover the most common job postings for the target audience
 *   (computer science students entering tech roles)
 * - Role definitions sourced from common job descriptions, normalized to canonical names
 * - Requirement sets are authored for scoring-engine test coverage (ADR-012):
 *   each role has at least one REQUIRED, one IMPORTANT, and one NICE_TO_HAVE skill
 */

import { PrismaClient, RequirementImportance } from '@prisma/client';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Seed Data Definitions
// ─────────────────────────────────────────────────────────────────────────────

const skills = [
  // Frontend
  {
    name: 'JavaScript',
    category: 'Frontend',
    description: 'Core scripting language of the web',
  },
  {
    name: 'TypeScript',
    category: 'Frontend',
    description: 'Typed superset of JavaScript',
  },
  {
    name: 'React',
    category: 'Frontend',
    description: 'UI component library by Meta',
  },
  {
    name: 'Next.js',
    category: 'Frontend',
    description: 'React framework for production web apps',
  },
  {
    name: 'HTML',
    category: 'Frontend',
    description: 'HyperText Markup Language',
    isFoundational: true,
  },
  {
    name: 'CSS',
    category: 'Frontend',
    description: 'Cascading Style Sheets',
    isFoundational: true,
  },
  {
    name: 'Tailwind CSS',
    category: 'Frontend',
    description: 'Utility-first CSS framework',
  },
  {
    name: 'Vue.js',
    category: 'Frontend',
    description: 'Progressive JavaScript UI framework',
  },
  {
    name: 'Angular',
    category: 'Frontend',
    description: 'TypeScript-based web application framework by Google',
  },

  // Backend
  {
    name: 'Node.js',
    category: 'Backend',
    description: 'JavaScript runtime built on Chrome V8',
    isFoundational: true,
  },
  {
    name: 'Python',
    category: 'Backend',
    description: 'General-purpose interpreted programming language',
    isFoundational: true,
  },
  {
    name: 'NestJS',
    category: 'Backend',
    description: 'Progressive Node.js framework for server-side applications',
  },
  {
    name: 'Express.js',
    category: 'Backend',
    description: 'Minimal Node.js web application framework',
  },
  {
    name: 'REST API Design',
    category: 'Backend',
    description: 'Designing RESTful APIs with proper resource modeling',
  },
  {
    name: 'GraphQL',
    category: 'Backend',
    description: 'Query language for APIs and runtime for executing queries',
  },
  {
    name: 'Java',
    category: 'Backend',
    description: 'Object-oriented programming language',
  },
  {
    name: 'Go',
    category: 'Backend',
    description: 'Statically typed compiled language by Google',
  },

  // Database
  {
    name: 'PostgreSQL',
    category: 'Database',
    description: 'Advanced open-source relational database',
    isFoundational: true,
  },
  {
    name: 'MySQL',
    category: 'Database',
    description: 'Popular open-source relational database',
  },
  {
    name: 'MongoDB',
    category: 'Database',
    description: 'Document-oriented NoSQL database',
  },
  {
    name: 'Redis',
    category: 'Database',
    description: 'In-memory data structure store used as cache and queue',
  },
  {
    name: 'SQL',
    category: 'Database',
    description: 'Structured Query Language for relational databases',
    isFoundational: true,
  },
  {
    name: 'Prisma',
    category: 'Database',
    description: 'Next-generation ORM for Node.js and TypeScript',
  },

  // DevOps & Cloud
  {
    name: 'Docker',
    category: 'DevOps',
    description: 'Containerization platform',
    isFoundational: true,
  },
  {
    name: 'Kubernetes',
    category: 'DevOps',
    description: 'Container orchestration system',
  },
  {
    name: 'AWS',
    category: 'DevOps',
    description: 'Amazon Web Services cloud platform',
  },
  {
    name: 'CI/CD',
    category: 'DevOps',
    description: 'Continuous integration and deployment pipelines',
    isFoundational: true,
  },
  {
    name: 'Git',
    category: 'DevOps',
    description: 'Distributed version control system',
    isFoundational: true,
  },
  {
    name: 'Linux',
    category: 'DevOps',
    description: 'Open-source Unix-like operating system',
  },

  // AI & Data
  {
    name: 'Machine Learning',
    category: 'AI & Data',
    description: 'Statistical learning methods for pattern recognition',
  },
  {
    name: 'Python for Data Science',
    category: 'AI & Data',
    description: 'NumPy, Pandas, Scikit-learn ecosystem',
  },
  {
    name: 'LLM Integration',
    category: 'AI & Data',
    description: 'Integrating large language model APIs into applications',
  },
  {
    name: 'Data Structures & Algorithms',
    category: 'AI & Data',
    description: 'Fundamental computer science concepts',
    isFoundational: true,
  },

  // Soft Skills & Practices
  {
    name: 'System Design',
    category: 'Engineering Practices',
    description: 'Designing scalable and reliable distributed systems',
  },
  {
    name: 'Agile / Scrum',
    category: 'Engineering Practices',
    description: 'Iterative software development methodology',
  },
  {
    name: 'Code Review',
    category: 'Engineering Practices',
    description: 'Peer review practices for code quality',
    isFoundational: true,
  },
  {
    name: 'Testing (Unit/Integration)',
    category: 'Engineering Practices',
    description: 'Writing automated tests for software verification',
    isFoundational: true,
  },
] as const;

// SkillAlias: canonical aliases for normalization engine testing
// Each alias should resolve to its parent skill via the normalization engine
const skillAliases: Array<{ name: string; skillName: string }> = [
  { name: 'JS', skillName: 'JavaScript' },
  { name: 'ES6', skillName: 'JavaScript' },
  { name: 'Vanilla JS', skillName: 'JavaScript' },
  { name: 'TS', skillName: 'TypeScript' },
  { name: 'ReactJS', skillName: 'React' },
  { name: 'React.js', skillName: 'React' },
  { name: 'NextJS', skillName: 'Next.js' },
  { name: 'Postgres', skillName: 'PostgreSQL' },
  { name: 'Postgres SQL', skillName: 'PostgreSQL' },
  { name: 'K8s', skillName: 'Kubernetes' },
  { name: 'Amazon Web Services', skillName: 'AWS' },
  { name: 'Amazon AWS', skillName: 'AWS' },
  { name: 'Node', skillName: 'Node.js' },
  { name: 'NodeJS', skillName: 'Node.js' },
  { name: 'Express', skillName: 'Express.js' },
  { name: 'Nest', skillName: 'NestJS' },
  { name: 'ML', skillName: 'Machine Learning' },
  { name: 'Mongo', skillName: 'MongoDB' },
  { name: 'TailwindCSS', skillName: 'Tailwind CSS' },
  { name: 'Vue', skillName: 'Vue.js' },
  { name: 'DSA', skillName: 'Data Structures & Algorithms' },
  { name: 'Algorithms', skillName: 'Data Structures & Algorithms' },
  { name: 'REST', skillName: 'REST API Design' },
  { name: 'RESTful API', skillName: 'REST API Design' },
  { name: 'ORM', skillName: 'Prisma' },
];

const roles = [
  {
    name: 'Full Stack Developer',
    description:
      'Builds end-to-end web applications, handling both client-side and server-side development',
    category: 'Engineering',
    aliases: ['Full Stack Engineer', 'Fullstack Developer'],
  },
  {
    name: 'Frontend Developer',
    description:
      'Specializes in building user interfaces and client-side applications',
    category: 'Engineering',
    aliases: ['Frontend Engineer', 'UI Developer', 'React Developer'],
  },
  {
    name: 'Backend Developer',
    description:
      'Specializes in server-side logic, APIs, databases, and infrastructure',
    category: 'Engineering',
    aliases: ['Backend Engineer', 'Server-Side Developer', 'API Developer'],
  },
  {
    name: 'DevOps Engineer',
    description:
      'Manages infrastructure, CI/CD pipelines, and deployment automation',
    category: 'Engineering',
    aliases: ['Platform Engineer', 'Infrastructure Engineer', 'SRE'],
  },
  {
    name: 'Machine Learning Engineer',
    description:
      'Builds and deploys machine learning models and AI-powered systems',
    category: 'AI & Data',
    aliases: ['ML Engineer', 'AI Engineer', 'AI/ML Engineer'],
  },
  {
    name: 'Data Engineer',
    description:
      'Designs and builds data pipelines, warehouses, and processing systems',
    category: 'AI & Data',
    aliases: ['Data Platform Engineer', 'Analytics Engineer'],
  },
];

// RoleRequirementSets — the core test data for the scoring engine
// Each entry maps a role name to its requirement items.
// This is v1 of each requirement set (version 1, isActive: true).
const requirementSets: Array<{
  roleName: string;
  requirements: Array<{
    skillName: string;
    importance: RequirementImportance;
    targetProficiency: number;
  }>;
}> = [
  {
    roleName: 'Full Stack Developer',
    requirements: [
      // REQUIRED — must-haves
      { skillName: 'JavaScript', importance: 'REQUIRED', targetProficiency: 4 },
      { skillName: 'TypeScript', importance: 'REQUIRED', targetProficiency: 3 },
      { skillName: 'React', importance: 'REQUIRED', targetProficiency: 3 },
      { skillName: 'Node.js', importance: 'REQUIRED', targetProficiency: 3 },
      {
        skillName: 'REST API Design',
        importance: 'REQUIRED',
        targetProficiency: 3,
      },
      { skillName: 'PostgreSQL', importance: 'REQUIRED', targetProficiency: 2 },
      { skillName: 'Git', importance: 'REQUIRED', targetProficiency: 3 },
      // IMPORTANT — strong differentiators
      { skillName: 'Next.js', importance: 'IMPORTANT', targetProficiency: 3 },
      { skillName: 'Docker', importance: 'IMPORTANT', targetProficiency: 2 },
      { skillName: 'SQL', importance: 'IMPORTANT', targetProficiency: 3 },
      {
        skillName: 'Testing (Unit/Integration)',
        importance: 'IMPORTANT',
        targetProficiency: 3,
      },
      // NICE_TO_HAVE — valued but not blocking
      { skillName: 'Redis', importance: 'NICE_TO_HAVE', targetProficiency: 2 },
      { skillName: 'AWS', importance: 'NICE_TO_HAVE', targetProficiency: 2 },
      {
        skillName: 'GraphQL',
        importance: 'NICE_TO_HAVE',
        targetProficiency: 2,
      },
      {
        skillName: 'System Design',
        importance: 'NICE_TO_HAVE',
        targetProficiency: 2,
      },
    ],
  },
  {
    roleName: 'Frontend Developer',
    requirements: [
      { skillName: 'JavaScript', importance: 'REQUIRED', targetProficiency: 4 },
      { skillName: 'TypeScript', importance: 'REQUIRED', targetProficiency: 3 },
      { skillName: 'React', importance: 'REQUIRED', targetProficiency: 4 },
      { skillName: 'HTML', importance: 'REQUIRED', targetProficiency: 4 },
      { skillName: 'CSS', importance: 'REQUIRED', targetProficiency: 4 },
      { skillName: 'Git', importance: 'REQUIRED', targetProficiency: 3 },
      { skillName: 'Next.js', importance: 'IMPORTANT', targetProficiency: 3 },
      {
        skillName: 'Tailwind CSS',
        importance: 'IMPORTANT',
        targetProficiency: 3,
      },
      {
        skillName: 'Testing (Unit/Integration)',
        importance: 'IMPORTANT',
        targetProficiency: 2,
      },
      {
        skillName: 'REST API Design',
        importance: 'IMPORTANT',
        targetProficiency: 2,
      },
      {
        skillName: 'System Design',
        importance: 'NICE_TO_HAVE',
        targetProficiency: 2,
      },
      { skillName: 'Vue.js', importance: 'NICE_TO_HAVE', targetProficiency: 2 },
    ],
  },
  {
    roleName: 'Backend Developer',
    requirements: [
      { skillName: 'Node.js', importance: 'REQUIRED', targetProficiency: 4 },
      { skillName: 'TypeScript', importance: 'REQUIRED', targetProficiency: 3 },
      {
        skillName: 'REST API Design',
        importance: 'REQUIRED',
        targetProficiency: 4,
      },
      { skillName: 'PostgreSQL', importance: 'REQUIRED', targetProficiency: 3 },
      { skillName: 'SQL', importance: 'REQUIRED', targetProficiency: 3 },
      { skillName: 'Git', importance: 'REQUIRED', targetProficiency: 3 },
      { skillName: 'NestJS', importance: 'IMPORTANT', targetProficiency: 3 },
      { skillName: 'Redis', importance: 'IMPORTANT', targetProficiency: 2 },
      { skillName: 'Docker', importance: 'IMPORTANT', targetProficiency: 2 },
      {
        skillName: 'Testing (Unit/Integration)',
        importance: 'IMPORTANT',
        targetProficiency: 3,
      },
      {
        skillName: 'GraphQL',
        importance: 'NICE_TO_HAVE',
        targetProficiency: 2,
      },
      { skillName: 'AWS', importance: 'NICE_TO_HAVE', targetProficiency: 2 },
      {
        skillName: 'System Design',
        importance: 'NICE_TO_HAVE',
        targetProficiency: 3,
      },
    ],
  },
  {
    roleName: 'DevOps Engineer',
    requirements: [
      { skillName: 'Docker', importance: 'REQUIRED', targetProficiency: 4 },
      { skillName: 'Kubernetes', importance: 'REQUIRED', targetProficiency: 3 },
      { skillName: 'CI/CD', importance: 'REQUIRED', targetProficiency: 4 },
      { skillName: 'Linux', importance: 'REQUIRED', targetProficiency: 4 },
      { skillName: 'AWS', importance: 'REQUIRED', targetProficiency: 3 },
      { skillName: 'Git', importance: 'REQUIRED', targetProficiency: 3 },
      { skillName: 'Python', importance: 'IMPORTANT', targetProficiency: 3 },
      {
        skillName: 'PostgreSQL',
        importance: 'IMPORTANT',
        targetProficiency: 2,
      },
      { skillName: 'Redis', importance: 'IMPORTANT', targetProficiency: 2 },
      {
        skillName: 'System Design',
        importance: 'IMPORTANT',
        targetProficiency: 3,
      },
      {
        skillName: 'Node.js',
        importance: 'NICE_TO_HAVE',
        targetProficiency: 2,
      },
    ],
  },
  {
    roleName: 'Machine Learning Engineer',
    requirements: [
      { skillName: 'Python', importance: 'REQUIRED', targetProficiency: 5 },
      {
        skillName: 'Machine Learning',
        importance: 'REQUIRED',
        targetProficiency: 4,
      },
      {
        skillName: 'Python for Data Science',
        importance: 'REQUIRED',
        targetProficiency: 4,
      },
      {
        skillName: 'Data Structures & Algorithms',
        importance: 'REQUIRED',
        targetProficiency: 4,
      },
      { skillName: 'Git', importance: 'REQUIRED', targetProficiency: 3 },
      { skillName: 'SQL', importance: 'IMPORTANT', targetProficiency: 3 },
      { skillName: 'Docker', importance: 'IMPORTANT', targetProficiency: 2 },
      {
        skillName: 'LLM Integration',
        importance: 'IMPORTANT',
        targetProficiency: 3,
      },
      { skillName: 'AWS', importance: 'NICE_TO_HAVE', targetProficiency: 2 },
      {
        skillName: 'System Design',
        importance: 'NICE_TO_HAVE',
        targetProficiency: 3,
      },
      {
        skillName: 'REST API Design',
        importance: 'NICE_TO_HAVE',
        targetProficiency: 2,
      },
    ],
  },
  {
    roleName: 'Data Engineer',
    requirements: [
      { skillName: 'Python', importance: 'REQUIRED', targetProficiency: 4 },
      { skillName: 'SQL', importance: 'REQUIRED', targetProficiency: 5 },
      { skillName: 'PostgreSQL', importance: 'REQUIRED', targetProficiency: 4 },
      {
        skillName: 'Data Structures & Algorithms',
        importance: 'REQUIRED',
        targetProficiency: 3,
      },
      { skillName: 'Git', importance: 'REQUIRED', targetProficiency: 3 },
      {
        skillName: 'Python for Data Science',
        importance: 'IMPORTANT',
        targetProficiency: 4,
      },
      { skillName: 'Docker', importance: 'IMPORTANT', targetProficiency: 2 },
      { skillName: 'AWS', importance: 'IMPORTANT', targetProficiency: 3 },
      {
        skillName: 'Machine Learning',
        importance: 'NICE_TO_HAVE',
        targetProficiency: 2,
      },
      { skillName: 'Redis', importance: 'NICE_TO_HAVE', targetProficiency: 2 },
    ],
  },
];

// PlatformConfig initial values (ADR-020 — runtime-configurable constants)
const platformConfigs = [
  // Scoring weights (ADR-012)
  {
    key: 'scoring.weight.REQUIRED',
    value: '3',
    description:
      'Weight for REQUIRED skills in readiness score formula. Change takes effect on next score calculation.',
  },
  {
    key: 'scoring.weight.IMPORTANT',
    value: '2',
    description: 'Weight for IMPORTANT skills in readiness score formula.',
  },
  {
    key: 'scoring.weight.NICE_TO_HAVE',
    value: '1',
    description: 'Weight for NICE_TO_HAVE skills in readiness score formula.',
  },
  // Normalization thresholds (ADR-011, SGIP-6.1.1.4)
  {
    key: 'normalization.threshold.autoLink',
    value: '0.92',
    description:
      'Cosine similarity threshold above which a candidate is auto-linked to an existing skill/role without human review.',
  },
  {
    key: 'normalization.threshold.review',
    value: '0.75',
    description:
      'Cosine similarity threshold above which a NormalizationReviewItem is created for human review. Below this threshold, the candidate is treated as genuinely new.',
  },
  // AI provider selection per feature (ADR-003)
  {
    key: 'ai.provider.RESUME_EXTRACTION',
    value: 'GROQ',
    description:
      'AI provider used for resume skill extraction. Change to switch providers without code deployment.',
  },
  {
    key: 'ai.provider.SCORE_EXPLANATION',
    value: 'GROQ',
    description: 'AI provider for generating readiness score explanations.',
  },
  {
    key: 'ai.provider.ROADMAP_ENRICHMENT',
    value: 'GROQ',
    description: 'AI provider for roadmap resource suggestions.',
  },
  {
    key: 'ai.provider.NORMALIZATION_DISAMBIGUATION',
    value: 'GROQ',
    description:
      'AI provider for generating disambiguation notes for normalization review.',
  },
  // Circuit breaker thresholds (SGIP-7.1.1.3)
  {
    key: 'circuit.breaker.failureThreshold.GROQ',
    value: '5',
    description:
      'Number of consecutive failures before the circuit breaker opens for GROQ provider.',
  },
  {
    key: 'circuit.breaker.resetTimeoutMs.GROQ',
    value: '30000',
    description:
      'Time in ms before attempting to close the circuit breaker after it opens.',
  },
  // Candidate creation rate limiting (ISSUE-004)
  {
    key: 'normalization.candidateCreation.maxPerUserPerHour',
    value: '20',
    description:
      'Maximum new skill/role candidates a single user can create per hour. Prevents taxonomy spam.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Seed Execution
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting SGIP seed...');

  // ── 1. Seed Skills ──────────────────────────────────────────────────────────
  console.log('  Seeding skills...');
  const skillMap = new Map<string, string>(); // name → id

  for (const skill of skills) {
    const seeded = await prisma.skill.upsert({
      where: { name: skill.name },
      update: {
        category: skill.category,
        description: skill.description,
        isFoundational:
          'isFoundational' in skill ? skill.isFoundational : false,
      },
      create: {
        name: skill.name,
        category: skill.category,
        description: skill.description,
        isFoundational:
          'isFoundational' in skill ? skill.isFoundational : false,
      },
    });
    skillMap.set(skill.name, seeded.id);
  }
  console.log(`  ✓ ${skills.length} skills seeded`);

  // ── 2. Seed Skill Aliases ───────────────────────────────────────────────────
  console.log('  Seeding skill aliases...');
  let aliasCount = 0;
  for (const alias of skillAliases) {
    const skillId = skillMap.get(alias.skillName);
    if (!skillId) {
      console.warn(
        `    ⚠ Skill '${alias.skillName}' not found for alias '${alias.name}'`,
      );
      continue;
    }
    await prisma.skillAlias.upsert({
      where: { name: alias.name },
      update: { skillId },
      create: { name: alias.name, skillId },
    });
    aliasCount++;
  }
  console.log(`  ✓ ${aliasCount} skill aliases seeded`);

  // ── 3. Seed Roles ───────────────────────────────────────────────────────────
  console.log('  Seeding roles...');
  const roleMap = new Map<string, string>(); // name → id

  for (const role of roles) {
    const seeded = await prisma.role.upsert({
      where: { name: role.name },
      update: {
        description: role.description,
        category: role.category,
      },
      create: {
        name: role.name,
        description: role.description,
        category: role.category,
      },
    });
    roleMap.set(role.name, seeded.id);

    // Seed role aliases
    for (const aliasName of role.aliases) {
      await prisma.roleAlias.upsert({
        where: { name: aliasName },
        update: { roleId: seeded.id },
        create: { name: aliasName, roleId: seeded.id },
      });
    }
  }
  console.log(
    `  ✓ ${roles.length} roles seeded with ${roles.reduce((sum, r) => sum + r.aliases.length, 0)} aliases`,
  );

  // ── 4. Seed RoleRequirementSets ─────────────────────────────────────────────
  console.log('  Seeding role requirement sets...');

  for (const reqSet of requirementSets) {
    const roleId = roleMap.get(reqSet.roleName);
    if (!roleId) {
      console.warn(
        `  ⚠ Role '${reqSet.roleName}' not found, skipping requirement set`,
      );
      continue;
    }

    // Check if an active v1 requirement set already exists (idempotent)
    const existing = await prisma.roleRequirementSet.findFirst({
      where: { roleId, version: 1 },
    });

    let requirementSetId: string;

    if (existing) {
      requirementSetId = existing.id;
      // Ensure it's active (in case a previous run deactivated it)
      await prisma.roleRequirementSet.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    } else {
      const created = await prisma.roleRequirementSet.create({
        data: {
          roleId,
          version: 1,
          isActive: true,
          notes:
            'Initial seed v1 — baseline requirement set for development and scoring engine tests',
          publishedBy: null, // System seed — no admin user yet
        },
      });
      requirementSetId = created.id;
    }

    // Upsert each requirement
    for (const req of reqSet.requirements) {
      const skillId = skillMap.get(req.skillName);
      if (!skillId) {
        console.warn(
          `    ⚠ Skill '${req.skillName}' not found for role '${reqSet.roleName}'`,
        );
        continue;
      }

      await prisma.roleRequirement.upsert({
        where: {
          requirementSetId_skillId: {
            requirementSetId,
            skillId,
          },
        },
        update: {
          importance: req.importance,
          targetProficiency: req.targetProficiency,
        },
        create: {
          requirementSetId,
          skillId,
          importance: req.importance,
          targetProficiency: req.targetProficiency,
        },
      });
    }

    console.log(
      `  ✓ ${reqSet.roleName}: ${reqSet.requirements.length} requirements seeded`,
    );
  }

  // ── 5. Seed PlatformConfig ──────────────────────────────────────────────────
  console.log('  Seeding platform configuration...');
  for (const config of platformConfigs) {
    await prisma.platformConfig.upsert({
      where: { key: config.key },
      update: { description: config.description },
      // Don't overwrite value on re-run — admin may have changed it
      create: {
        key: config.key,
        value: config.value,
        description: config.description,
      },
    });
  }
  console.log(`  ✓ ${platformConfigs.length} platform config entries seeded`);

  console.log('');
  console.log('🌱 Seed complete!');
  console.log(`   Skills: ${skills.length}`);
  console.log(`   Roles: ${roles.length}`);
  console.log(`   RoleRequirementSets: ${requirementSets.length}`);
  console.log(`   PlatformConfig entries: ${platformConfigs.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
