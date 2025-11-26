'use strict';

const fs = require('fs-extra');
const path = require('path');
const mime = require('mime-types');
const { categories, authors, articles, global, about } = require('../data/data.json');

async function seedExampleApp() {
  const shouldImportSeedData = await isFirstRun();

  if (shouldImportSeedData) {
    try {
      console.log('Setting up seed data...');
      await importSeedData();
      console.log('✓ Seed data imported');
    } catch (error) {
      console.log('✗ Could not import seed data');
      console.error(error);
    }
  } else {
    console.log('ℹ Seed data already imported (skipping reimport)');
  }
}

async function isFirstRun() {
  const pluginStore = strapi.store({
    environment: strapi.config.environment,
    type: 'type',
    name: 'setup',
  });
  const initHasRun = await pluginStore.get({ key: 'initHasRun' });
  await pluginStore.set({ key: 'initHasRun', value: true });
  return !initHasRun;
}

async function setPublicPermissions(newPermissions) {
  // Find the ID of the public role
  const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
    where: {
      type: 'public',
    },
  });

  console.log('Setting public permissions for role:', publicRole.id);

  // Create the new permissions and link them to the public role
  const allPermissionsToCreate = [];
  Object.keys(newPermissions).map((controller) => {
    const actions = newPermissions[controller];
    const permissionsToCreate = actions.map((action) => {
      console.log(`Creating permission: api::${controller}.${controller}.${action}`);
      return strapi.query('plugin::users-permissions.permission').create({
        data: {
          action: `api::${controller}.${controller}.${action}`,
          role: publicRole.id,
          enabled: true,
        },
      });
    });
    allPermissionsToCreate.push(...permissionsToCreate);
  });
  await Promise.all(allPermissionsToCreate);
  console.log('Public permissions set successfully');
}

async function setAuthenticatedPermissions(newPermissions) {
  // Find the ID of the authenticated role
  const authenticatedRole = await strapi.query('plugin::users-permissions.role').findOne({
    where: {
      type: 'authenticated',
    },
  });

  console.log('Setting authenticated permissions for role:', authenticatedRole.id);

  // Create the new permissions and link them to the authenticated role
  const allPermissionsToCreate = [];
  Object.keys(newPermissions).map((controller) => {
    const actions = newPermissions[controller];
    const permissionsToCreate = actions.map((action) => {
      console.log(`Creating permission: api::${controller}.${controller}.${action}`);
      return strapi.query('plugin::users-permissions.permission').create({
        data: {
          action: `api::${controller}.${controller}.${action}`,
          role: authenticatedRole.id,
          enabled: true,
        },
      });
    });
    allPermissionsToCreate.push(...permissionsToCreate);
  });
  await Promise.all(allPermissionsToCreate);
  console.log('Authenticated permissions set successfully');
}

function getFileSizeInBytes(filePath) {
  const stats = fs.statSync(filePath);
  const fileSizeInBytes = stats['size'];
  return fileSizeInBytes;
}

function getFileData(fileName) {
  const filePath = path.join('data', 'uploads', fileName);
  // Parse the file metadata
  const size = getFileSizeInBytes(filePath);
  const ext = fileName.split('.').pop();
  const mimeType = mime.lookup(ext || '') || '';

  return {
    filepath: filePath,
    originalFileName: fileName,
    size,
    mimetype: mimeType,
  };
}

async function uploadFile(file, name) {
  return strapi
    .plugin('upload')
    .service('upload')
    .upload({
      files: file,
      data: {
        fileInfo: {
          alternativeText: `An image uploaded to Strapi called ${name}`,
          caption: name,
          name,
        },
      },
    });
}

// Create an entry and attach files if there are any
async function createEntry({ model, entry }) {
  try {
    // Actually create the entry in Strapi
    await strapi.documents(`api::${model}.${model}`).create({
      data: entry,
    });
  } catch (error) {
    console.error({ model, entry, error });
  }
}

async function checkFileExistsBeforeUpload(files) {
  const existingFiles = [];
  const uploadedFiles = [];
  const filesCopy = [...files];

  for (const fileName of filesCopy) {
    // Check if the file already exists in Strapi
    const fileWhereName = await strapi.query('plugin::upload.file').findOne({
      where: {
        name: fileName.replace(/\..*$/, ''),
      },
    });

    if (fileWhereName) {
      // File exists, don't upload it
      existingFiles.push(fileWhereName);
    } else {
      // File doesn't exist, upload it
      const fileData = getFileData(fileName);
      const fileNameNoExtension = fileName.split('.').shift();
      const [file] = await uploadFile(fileData, fileNameNoExtension);
      uploadedFiles.push(file);
    }
  }
  const allFiles = [...existingFiles, ...uploadedFiles];
  // If only one file then return only that file
  return allFiles.length === 1 ? allFiles[0] : allFiles;
}

async function updateBlocks(blocks) {
  const updatedBlocks = [];
  for (const block of blocks) {
    if (block.__component === 'shared.media') {
      const uploadedFiles = await checkFileExistsBeforeUpload([block.file]);
      // Copy the block to not mutate directly
      const blockCopy = { ...block };
      // Replace the file name on the block with the actual file
      blockCopy.file = uploadedFiles;
      updatedBlocks.push(blockCopy);
    } else if (block.__component === 'shared.slider') {
      // Get files already uploaded to Strapi or upload new files
      const existingAndUploadedFiles = await checkFileExistsBeforeUpload(block.files);
      // Copy the block to not mutate directly
      const blockCopy = { ...block };
      // Replace the file names on the block with the actual files
      blockCopy.files = existingAndUploadedFiles;
      // Push the updated block
      updatedBlocks.push(blockCopy);
    } else {
      // Just push the block as is
      updatedBlocks.push(block);
    }
  }

  return updatedBlocks;
}

async function importArticles() {
  for (const article of articles) {
    const cover = await checkFileExistsBeforeUpload([`${article.slug}.jpg`]);
    const updatedBlocks = await updateBlocks(article.blocks);

    await createEntry({
      model: 'article',
      entry: {
        ...article,
        cover,
        blocks: updatedBlocks,
        // Make sure it's not a draft
        publishedAt: Date.now(),
      },
    });
  }
}

async function importGlobal() {
  const favicon = await checkFileExistsBeforeUpload(['favicon.png']);
  const shareImage = await checkFileExistsBeforeUpload(['default-image.png']);
  return createEntry({
    model: 'global',
    entry: {
      ...global,
      favicon,
      // Make sure it's not a draft
      publishedAt: Date.now(),
      defaultSeo: {
        ...global.defaultSeo,
        shareImage,
      },
    },
  });
}

async function importAbout() {
  const updatedBlocks = await updateBlocks(about.blocks);

  await createEntry({
    model: 'about',
    entry: {
      ...about,
      blocks: updatedBlocks,
      // Make sure it's not a draft
      publishedAt: Date.now(),
    },
  });
}

async function importCategories() {
  for (const category of categories) {
    await createEntry({ model: 'category', entry: category });
  }
}

async function importAuthors() {
  for (const author of authors) {
    const avatar = await checkFileExistsBeforeUpload([author.avatar]);

    await createEntry({
      model: 'author',
      entry: {
        ...author,
        avatar,
      },
    });
  }
}

async function createDefaultUsers() {
  try {
    console.log('Creating/Verifying default users...');
    
    // Get the authenticated role
    const authenticatedRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: {
        type: 'authenticated',
      },
    });

    if (!authenticatedRole) {
      console.error('✗ Authenticated role not found');
      return;
    }

    const users = [
      {
        username: 'admin',
        email: 'admin@satc.edu.br',
        password: 'welcomeToStrapi123',
      },
      {
        username: 'editor',
        email: 'editor@satc.edu.br',
        password: 'welcomeToStrapi123',
      },
      {
        username: 'author',
        email: 'author@satc.edu.br',
        password: 'welcomeToStrapi123',
      },
    ];

    for (const userData of users) {
      try {
        // Check if user already exists
        const existingUser = await strapi.query('plugin::users-permissions.user').findOne({
          where: {
            email: userData.email,
          },
        });

        if (existingUser) {
          console.log(`✓ User ${userData.email} already exists - updating status`);
          // Update user to ensure it's confirmed and not blocked
          await strapi.query('plugin::users-permissions.user').update({
            where: { id: existingUser.id },
            data: {
              confirmed: true,
              blocked: false,
            },
          });
          console.log(`✓ User ${userData.email} confirmed and unblocked`);
          continue;
        }

        // Create the user
        const user = await strapi.query('plugin::users-permissions.user').create({
          data: {
            username: userData.username,
            email: userData.email,
            password: userData.password,
            confirmed: true,
            blocked: false,
            role: authenticatedRole.id,
          },
        });

        console.log(`✓ User ${userData.email} created successfully`);
      } catch (error) {
        console.error(`✗ Error creating user ${userData.email}:`, error.message);
      }
    }
  } catch (error) {
    console.error('✗ Error creating default users:', error.message);
  }
}

async function importSeedData() {
  console.log('Setting up permissions...');

  // Allow read of application content types for public
  await setPublicPermissions({
    article: ['find', 'findOne'],
    category: ['find', 'findOne'],
    author: ['find', 'findOne'],
    global: ['find', 'findOne'],
    about: ['find', 'findOne'],
  });

  // Allow create, update, delete for authenticated users
  await setAuthenticatedPermissions({
    article: ['find', 'findOne', 'create', 'update', 'delete'],
    author: ['find', 'findOne', 'create', 'update', 'delete'],
    category: ['find', 'findOne', 'create', 'update', 'delete'],
  });

  // Create all entries
  await importCategories();
  await importAuthors();
  await importArticles();
  await importGlobal();
  await importAbout();
}

async function main() {
  const { createStrapi, compileStrapi } = require('@strapi/strapi');

  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  app.log.level = 'error';

  try {
    console.log('Starting seed...');
    
    // Always create default users first
    console.log('Step 1: Creating default users...');
    await createDefaultUsers();
    
    // Then run seed data import
    console.log('Step 2: Running seed example app...');
    await seedExampleApp();
    
    console.log('✓ Seed completed successfully!');
  } catch (error) {
    console.error('✗ Seed failed:', error);
  } finally {
    await app.destroy();
    process.exit(0);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
