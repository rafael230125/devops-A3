import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:1337';

test('CRUD Category - Create, Read, Update, Delete', async ({ request }) => {
  // Create Category
  const categoryData = {
    name: 'Playwright Test Category',
    slug: 'playwright-test-category-' + Date.now(),
    description: 'Test description for category',
  };

  const createRes = await request.post(`${BASE_URL}/api/categories`, {
    headers: {
      'Content-Type': 'application/json',
    },
    data: JSON.stringify({
      data: categoryData,
    }),
  });
  expect(createRes.ok()).toBeTruthy();
  
  const created = await createRes.json();
  expect(created.data).toHaveProperty('id');
  
  const categoryId = created.data.id;

  // Read Category - try using documentId if id doesn't work
  let getRes = await request.get(`${BASE_URL}/api/categories/${categoryId}`);
  
  if (getRes.status() === 404 && created.data.documentId) {
    getRes = await request.get(`${BASE_URL}/api/categories/${created.data.documentId}`);
  }
  
  expect(getRes.ok()).toBeTruthy();
  
  const fetched = await getRes.json();
  const fetchedAttributes = fetched.data.attributes ? fetched.data.attributes : fetched.data;
  expect(fetchedAttributes.name).toBe(categoryData.name);

  // Update Category
  const updatedName = 'Playwright Updated Category';
  const categoryIdForUpdate = created.data.documentId || categoryId;
  const updateRes = await request.put(`${BASE_URL}/api/categories/${categoryIdForUpdate}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    data: JSON.stringify({
      data: { name: updatedName },
    }),
  });
  expect(updateRes.ok()).toBeTruthy();
  
  const updated = await updateRes.json();
  const updatedAttributes = updated.data.attributes ? updated.data.attributes : updated.data;
  expect(updatedAttributes.name).toBe(updatedName);

  // Delete Category
  const delRes = await request.delete(`${BASE_URL}/api/categories/${categoryIdForUpdate}`);
  expect(delRes.ok()).toBeTruthy();
});

test('GET Categories - List all categories', async ({ request }) => {
  const res = await request.get(`${BASE_URL}/api/categories`);
  expect(res.ok()).toBeTruthy();
  
  const body = await res.json();
  expect(body.data).toBeDefined();
  expect(Array.isArray(body.data)).toBeTruthy();
});
