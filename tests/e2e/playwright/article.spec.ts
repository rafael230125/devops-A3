
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:1337';

test('CRUD Article - Create, Read, Update, Delete', async ({ request }) => {
  // Create Article
  const articleData = {
    title: 'Playwright Test Article',
    description: 'Test description for article',
    slug: 'playwright-test-article-' + Date.now(),
  };

  const createRes = await request.post(`${BASE_URL}/api/articles`, {
    headers: {
      'Content-Type': 'application/json',
    },
    data: JSON.stringify({
      data: articleData,
    }),
  });
  expect(createRes.ok()).toBeTruthy();
  
  const createBody = await createRes.json();
  
  const created = createBody;
  
  const articleId = created.data.id;

  // Read Article - try using documentId if id doesn't work
  let getRes = await request.get(`${BASE_URL}/api/articles/${articleId}`);
  
  // If regular ID doesn't work, try documentId
  if (getRes.status() === 404 && created.data.documentId) {
    getRes = await request.get(`${BASE_URL}/api/articles/${created.data.documentId}`);
  }
  
  expect(getRes.ok()).toBeTruthy();
  
  const fetched = await getRes.json();
  const fetchedAttributes = fetched.data.attributes ? fetched.data.attributes : fetched.data;
  expect(fetchedAttributes.title).toBe(articleData.title);

  // Update Article
  const updatedTitle = 'Playwright Updated Article';
  const articleIdForUpdate = created.data.documentId || articleId;
  const updateRes = await request.put(`${BASE_URL}/api/articles/${articleIdForUpdate}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    data: JSON.stringify({
      data: { title: updatedTitle },
    }),
  });
  expect(updateRes.ok()).toBeTruthy();
  
  const updated = await updateRes.json();
  const updatedAttributes = updated.data.attributes ? updated.data.attributes : updated.data;
  expect(updatedAttributes.title).toBe(updatedTitle);

  // Delete Article
  const delRes = await request.delete(`${BASE_URL}/api/articles/${articleIdForUpdate}`);
  expect(delRes.ok()).toBeTruthy();
});

test('GET Articles - List all articles', async ({ request }) => {
  const res = await request.get(`${BASE_URL}/api/articles`);
  expect(res.ok()).toBeTruthy();
  
  const body = await res.json();
  expect(body.data).toBeDefined();
  expect(Array.isArray(body.data)).toBeTruthy();
});
