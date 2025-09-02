import { PrismaClient, UserPlan } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@designstudio.com' },
    update: {},
    create: {
      email: 'admin@designstudio.com',
      password: hashedPassword,
      name: 'Admin User',
      plan: UserPlan.TEAM,
      preferences: {
        theme: 'dark',
        language: 'en',
        autoSave: true,
        showGrid: true,
        snapToGrid: true,
        defaultCanvasSize: { width: 1920, height: 1080 }
      },
      limits: {
        maxProjects: 1000,
        maxStorageSize: 10737418240, // 10GB
        maxExportsPerMonth: 10000,
        hasAIFeatures: true,
        hasAdvancedExport: true,
        hasCollaboration: true
      }
    },
  });

  const proUser = await prisma.user.upsert({
    where: { email: 'pro@designstudio.com' },
    update: {},
    create: {
      email: 'pro@designstudio.com',
      password: hashedPassword,
      name: 'Pro User',
      plan: UserPlan.PRO,
      preferences: {
        theme: 'light',
        language: 'en',
        autoSave: true,
        showGrid: false,
        snapToGrid: false,
        defaultCanvasSize: { width: 1080, height: 1080 }
      },
      limits: {
        maxProjects: 100,
        maxStorageSize: 1073741824, // 1GB
        maxExportsPerMonth: 500,
        hasAIFeatures: true,
        hasAdvancedExport: true,
        hasCollaboration: true
      }
    },
  });

  const freeUser = await prisma.user.upsert({
    where: { email: 'free@designstudio.com' },
    update: {},
    create: {
      email: 'free@designstudio.com',
      password: hashedPassword,
      name: 'Free User',
      plan: UserPlan.FREE,
      preferences: {
        theme: 'light',
        language: 'en',
        autoSave: false,
        showGrid: true,
        snapToGrid: true,
        defaultCanvasSize: { width: 800, height: 600 }
      },
      limits: {
        maxProjects: 10,
        maxStorageSize: 104857600, // 100MB
        maxExportsPerMonth: 50,
        hasAIFeatures: false,
        hasAdvancedExport: false,
        hasCollaboration: false
      }
    },
  });

  console.log('✅ Created users:', { adminUser: adminUser.id, proUser: proUser.id, freeUser: freeUser.id });

  // Create sample projects
  const sampleProjects = [
    {
      name: 'Welcome Design',
      description: 'A sample project to get started with Design Studio',
      canvasWidth: 1920,
      canvasHeight: 1080,
      isPublic: true,
      tags: ['sample', 'welcome', 'getting-started'],
      userId: adminUser.id,
    },
    {
      name: 'Social Media Post',
      description: 'Instagram post template',
      canvasWidth: 1080,
      canvasHeight: 1080,
      isPublic: true,
      isTemplate: true,
      tags: ['social', 'instagram', 'template'],
      userId: adminUser.id,
    },
    {
      name: 'Business Card Design',
      description: 'Professional business card layout',
      canvasWidth: 1050,
      canvasHeight: 600,
      isPublic: false,
      tags: ['business', 'card', 'professional'],
      userId: proUser.id,
    },
    {
      name: 'My First Project',
      description: 'Getting started with design',
      canvasWidth: 800,
      canvasHeight: 600,
      isPublic: false,
      tags: ['personal', 'first'],
      userId: freeUser.id,
    },
  ];

  const createdProjects = [];
  for (const projectData of sampleProjects) {
    const project = await prisma.project.create({
      data: projectData,
    });
    createdProjects.push(project);
  }

  console.log('✅ Created projects:', createdProjects.length);

  // Create sample templates
  const sampleTemplates = [
    {
      name: 'Modern Business Card',
      description: 'Clean and professional business card template',
      thumbnail: 'https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=Business+Card',
      canvasWidth: 1050,
      canvasHeight: 600,
      canvasDocumentId: 'template_business_card_001',
      category: 'Business',
      tags: ['business', 'professional', 'modern', 'clean'],
      isPremium: false,
      authorId: adminUser.id,
      downloadCount: 150,
      likeCount: 25,
      publishedAt: new Date(),
    },
    {
      name: 'Social Media Story',
      description: 'Eye-catching Instagram story template',
      thumbnail: 'https://via.placeholder.com/300x200/EC4899/FFFFFF?text=Story+Template',
      canvasWidth: 1080,
      canvasHeight: 1920,
      canvasDocumentId: 'template_story_001',
      category: 'Social Media',
      tags: ['instagram', 'story', 'social', 'trendy'],
      isPremium: true,
      authorId: adminUser.id,
      downloadCount: 89,
      likeCount: 12,
      publishedAt: new Date(),
    },
    {
      name: 'Presentation Slide',
      description: 'Minimalist presentation slide layout',
      thumbnail: 'https://via.placeholder.com/300x200/10B981/FFFFFF?text=Presentation',
      canvasWidth: 1920,
      canvasHeight: 1080,
      canvasDocumentId: 'template_presentation_001',
      category: 'Presentation',
      tags: ['presentation', 'slides', 'minimalist', 'business'],
      isPremium: false,
      authorId: proUser.id,
      downloadCount: 67,
      likeCount: 8,
      publishedAt: new Date(),
    },
  ];

  const createdTemplates = [];
  for (const templateData of sampleTemplates) {
    const template = await prisma.template.create({
      data: templateData,
    });
    createdTemplates.push(template);
  }

  console.log('✅ Created templates:', createdTemplates.length);

  // Create sample assets
  const sampleAssets = [
    {
      filename: 'logo-placeholder.png',
      originalName: 'company-logo.png',
      mimeType: 'image/png',
      size: 2048000,
      storageKey: 'assets/logos/logo-placeholder.png',
      url: 'https://via.placeholder.com/300x300/4F46E5/FFFFFF?text=LOGO',
      thumbnailUrl: 'https://via.placeholder.com/150x150/4F46E5/FFFFFF?text=LOGO',
      width: 300,
      height: 300,
      folder: 'logos',
      tags: ['logo', 'branding', 'placeholder'],
      isPublic: true,
      userId: adminUser.id,
    },
    {
      filename: 'background-gradient.jpg',
      originalName: 'gradient-background.jpg',
      mimeType: 'image/jpeg',
      size: 1024000,
      storageKey: 'assets/backgrounds/gradient.jpg',
      url: 'https://via.placeholder.com/1920x1080/667EEA/764BA2?text=Gradient',
      thumbnailUrl: 'https://via.placeholder.com/300x200/667EEA/764BA2?text=Gradient',
      width: 1920,
      height: 1080,
      folder: 'backgrounds',
      tags: ['background', 'gradient', 'purple'],
      isPublic: true,
      userId: adminUser.id,
    },
  ];

  const createdAssets = [];
  for (const assetData of sampleAssets) {
    const asset = await prisma.asset.create({
      data: assetData,
    });
    createdAssets.push(asset);
  }

  console.log('✅ Created assets:', createdAssets.length);

  // Create system configuration
  const systemConfigs = [
    {
      key: 'app_name',
      value: { name: 'Design Studio', version: '1.0.0' },
    },
    {
      key: 'file_upload_limits',
      value: {
        maxFileSize: 52428800, // 50MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'video/mp4'],
        maxFilesPerUpload: 10,
      },
    },
    {
      key: 'export_settings',
      value: {
        maxExportSize: 10000, // 10k x 10k pixels
        supportedFormats: ['png', 'jpeg', 'svg', 'pdf', 'gif', 'mp4'],
        qualityLevels: [50, 75, 90, 100],
      },
    },
    {
      key: 'ai_settings',
      value: {
        enabled: true,
        providers: ['openai', 'stability'],
        maxGenerationsPerDay: { free: 5, pro: 50, team: 500 },
      },
    },
  ];

  for (const configData of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: configData.key },
      update: { value: configData.value },
      create: configData,
    });
  }

  console.log('✅ Created system configuration');

  console.log('🎉 Database seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Database seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });