import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data
  await prisma.subTask.deleteMany();
  await prisma.task.deleteMany();
  await prisma.boardStatus.deleteMany();
  await prisma.board.deleteMany();

  // Board 1: Mobile App Redesign
  const mobileApp = await prisma.board.create({
    data: {
      name: "Mobile App Redesign",
      description: "Q1 initiative to modernize the iOS and Android apps",
      statuses: {
        create: [
          { name: "Backlog", position: 0 },
          { name: "In Progress", position: 1 },
          { name: "In Review", position: 2 },
          { name: "Done", position: 3 },
        ],
      },
    },
    include: { statuses: true },
  });

  const sortedMobileStatuses = mobileApp.statuses.sort((a, b) => a.position - b.position);
  const backlog = sortedMobileStatuses[0]!;
  const inProgress = sortedMobileStatuses[1]!;
  const inReview = sortedMobileStatuses[2]!;
  const done = sortedMobileStatuses[3]!;

  const authTask = await prisma.task.create({
    data: {
      boardStatusId: inProgress.id,
      title: "Implement biometric authentication",
      description: "Add Face ID and fingerprint login options for faster access",
      position: 0,
    },
  });

  await prisma.subTask.createMany({
    data: [
      { taskId: authTask.id, description: "Research iOS Face ID API", isCompleted: true },
      { taskId: authTask.id, description: "Research Android fingerprint API", isCompleted: true },
      { taskId: authTask.id, description: "Implement iOS biometric flow", isCompleted: false },
      { taskId: authTask.id, description: "Implement Android biometric flow", isCompleted: false },
      { taskId: authTask.id, description: "Add fallback to PIN entry", isCompleted: false },
    ],
  });

  const onboardingTask = await prisma.task.create({
    data: {
      boardStatusId: inReview.id,
      title: "Redesign onboarding flow",
      description: "Simplify the 7-step onboarding to 3 steps with progress indicator",
      position: 0,
    },
  });

  await prisma.subTask.createMany({
    data: [
      { taskId: onboardingTask.id, description: "Create new wireframes", isCompleted: true },
      { taskId: onboardingTask.id, description: "Get design approval", isCompleted: true },
      { taskId: onboardingTask.id, description: "Implement UI components", isCompleted: true },
      { taskId: onboardingTask.id, description: "Write unit tests", isCompleted: false },
    ],
  });

  await prisma.task.createMany({
    data: [
      {
        boardStatusId: backlog.id,
        title: "Add dark mode support",
        description: "Implement system-aware dark mode with manual toggle option",
        position: 0,
      },
      {
        boardStatusId: backlog.id,
        title: "Optimize image loading",
        description: "Implement lazy loading and WebP format for faster load times",
        position: 1,
      },
      {
        boardStatusId: backlog.id,
        title: "Add push notification preferences",
        position: 2,
      },
      {
        boardStatusId: done.id,
        title: "Update app icons and splash screen",
        description: "New branding assets from marketing team",
        position: 0,
      },
      {
        boardStatusId: done.id,
        title: "Migrate to React Native 0.73",
        position: 1,
      },
    ],
  });

  // Board 2: Marketing Website
  const website = await prisma.board.create({
    data: {
      name: "Marketing Website",
      description: "Company website refresh and SEO improvements",
      statuses: {
        create: [
          { name: "To Do", position: 0 },
          { name: "Doing", position: 1 },
          { name: "QA", position: 2 },
          { name: "Complete", position: 3 },
        ],
      },
    },
    include: { statuses: true },
  });

  const sortedWebsiteStatuses = website.statuses.sort((a, b) => a.position - b.position);
  const todo = sortedWebsiteStatuses[0]!;
  const doing = sortedWebsiteStatuses[1]!;
  const qa = sortedWebsiteStatuses[2]!;
  const complete = sortedWebsiteStatuses[3]!;

  const pricingTask = await prisma.task.create({
    data: {
      boardStatusId: doing.id,
      title: "Build new pricing page",
      description: "Interactive pricing calculator with feature comparison table",
      position: 0,
    },
  });

  await prisma.subTask.createMany({
    data: [
      { taskId: pricingTask.id, description: "Design pricing tiers layout", isCompleted: true },
      { taskId: pricingTask.id, description: "Build comparison table component", isCompleted: true },
      { taskId: pricingTask.id, description: "Implement pricing calculator", isCompleted: false },
      { taskId: pricingTask.id, description: "Add Stripe checkout integration", isCompleted: false },
    ],
  });

  const blogTask = await prisma.task.create({
    data: {
      boardStatusId: qa.id,
      title: "Migrate blog to new CMS",
      description: "Move 50+ articles from WordPress to Sanity",
      position: 0,
    },
  });

  await prisma.subTask.createMany({
    data: [
      { taskId: blogTask.id, description: "Set up Sanity schema", isCompleted: true },
      { taskId: blogTask.id, description: "Write migration script", isCompleted: true },
      { taskId: blogTask.id, description: "Migrate all posts", isCompleted: true },
      { taskId: blogTask.id, description: "Verify redirects working", isCompleted: false },
      { taskId: blogTask.id, description: "Update internal links", isCompleted: false },
    ],
  });

  await prisma.task.createMany({
    data: [
      {
        boardStatusId: todo.id,
        title: "Add customer testimonials section",
        description: "Carousel with quotes, photos, and company logos",
        position: 0,
      },
      {
        boardStatusId: todo.id,
        title: "Implement site search",
        description: "Algolia-powered search across docs and blog",
        position: 1,
      },
      {
        boardStatusId: todo.id,
        title: "Create careers page",
        position: 2,
      },
      {
        boardStatusId: complete.id,
        title: "Redesign homepage hero",
        description: "New animated hero with product demo video",
        position: 0,
      },
      {
        boardStatusId: complete.id,
        title: "Fix mobile navigation menu",
        position: 1,
      },
      {
        boardStatusId: complete.id,
        title: "Add cookie consent banner",
        position: 2,
      },
    ],
  });

  console.log("Seed data created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
