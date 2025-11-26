
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:1337';

test('CRUD Author - Create, Read, Update, Delete', async ({ request }) => {
  // Create Author
  const authorData = {
    name: 'Playwright Test Author',
    email: 'playwright.author@example.com',
  };

  const createRes = await request.post(`${BASE_URL}/api/authors`, {
    headers: {
      'Content-Type': 'application/json',
    },
    data: JSON.stringify({
      data: authorData,
    }),
  });
  expect(createRes.ok()).toBeTruthy();
  
  const created = await createRes.json();
  expect(created.data).toHaveProperty('id');
  
  const authorId = created.data.id;

  // Read Author - try using documentId if id doesn't work
  let getRes = await request.get(`${BASE_URL}/api/authors/${authorId}`);
  
  if (getRes.status() === 404 && created.data.documentId) {
    getRes = await request.get(`${BASE_URL}/api/authors/${created.data.documentId}`);
  }
  
  expect(getRes.ok()).toBeTruthy();
  
  const fetched = await getRes.json();
  const fetchedAttributes = fetched.data.attributes ? fetched.data.attributes : fetched.data;
  expect(fetchedAttributes.name).toBe(authorData.name);

  // Update Author
  const updatedName = 'Playwright Updated Author';
  const authorIdForUpdate = created.data.documentId || authorId;
  const updateRes = await request.put(`${BASE_URL}/api/authors/${authorIdForUpdate}`, {
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

  // Delete Author
  const delRes = await request.delete(`${BASE_URL}/api/authors/${authorIdForUpdate}`);
  expect(delRes.ok()).toBeTruthy();
});

test('GET Authors - List all authors', async ({ request }) => {
  const res = await request.get(`${BASE_URL}/api/authors`);
  expect(res.ok()).toBeTruthy();
  
  const body = await res.json();
  expect(body.data).toBeDefined();
  expect(Array.isArray(body.data)).toBeTruthy();
});

