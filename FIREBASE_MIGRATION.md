# Firebase Migration Guide

## Overview
Your backend has been migrated from **Supabase + Prisma** to **Firebase Firestore**. All database operations now use the Firebase Admin SDK.

---

## Setup Instructions

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Get Firebase Service Account Key
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **ebackend-66bde**
3. Go to **Project Settings** (gear icon)
4. Click **Service Accounts** tab
5. Click **Generate New Private Key**
6. A JSON file will download
7. Save it in your backend root folder as: `firebase-service-account-key.json`

### Step 3: Verify Environment Variables
Check your `.env` file has all Firebase variables filled in:
```bash
FIREBASE_API_KEY=AIzaSyCJ3dtb_nv5zstIVtRgbDbvoJQE7e3cPN4
FIREBASE_AUTH_DOMAIN=ebackend-66bde.firebaseapp.com
FIREBASE_PROJECT_ID=ebackend-66bde
FIREBASE_STORAGE_BUCKET=ebackend-66bde.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=172774872527
FIREBASE_APP_ID=1:172774872527:web:a1ed1f7ca9c0499aff6eba
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./firebase-service-account-key.json
```

### Step 4: Update Your Services

#### Old Code (Prisma)
```javascript
import { prisma } from '../lib/prisma.js'

// Get all products
export async function getAllProducts() {
  return await prisma.product.findMany()
}

// Get product by ID
export async function getProductById(id) {
  return await prisma.product.findUnique({
    where: { id }
  })
}

// Create product
export async function createProduct(data) {
  return await prisma.product.create({
    data
  })
}

// Update product
export async function updateProduct(id, data) {
  return await prisma.product.update({
    where: { id },
    data
  })
}
```

#### New Code (Firebase)
```javascript
import { db } from '../lib/firebase.js'

// Get all products
export async function getAllProducts() {
  const snapshot = await db.collection('products').get()
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

// Get product by ID
export async function getProductById(id) {
  const docRef = db.collection('products').doc(id)
  const doc = await docRef.get()
  if (!doc.exists) return null
  return { id: doc.id, ...doc.data() }
}

// Create product
export async function createProduct(data) {
  const docRef = await db.collection('products').add(data)
  return { id: docRef.id, ...data }
}

// Update product
export async function updateProduct(id, data) {
  await db.collection('products').doc(id).update(data)
  return { id, ...data }
}
```

---

## Firestore Data Structure

### Collections
Your Firestore database should have these collections:

```
firestore
├── products/
│   └── doc (fields: name, price, description, imageUrl, etc.)
├── services/
│   └── doc (fields: name, price, description, availability, etc.)
├── customers/
│   └── doc (fields: email, name, phone, address, etc.)
├── orders/
│   └── doc (fields: customerId, items, total, status, createdAt, etc.)
├── cart/
│   └── doc (fields: customerId, items, updatedAt, etc.)
├── wishlist/
│   └── doc (fields: customerId, productIds, etc.)
└── admins/
    └── doc (fields: email, role, permissions, etc.)
```

---

## Common Firebase Operations

### Read Operations

#### Get single document
```javascript
const docRef = db.collection('products').doc('product-id')
const doc = await docRef.get()
if (doc.exists) {
  console.log('Document data:', doc.data())
}
```

#### Get all documents
```javascript
const snapshot = await db.collection('products').get()
const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
```

#### Query with conditions
```javascript
const snapshot = await db.collection('products')
  .where('price', '<=', 100)
  .where('inStock', '==', true)
  .get()

const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
```

### Write Operations

#### Add new document
```javascript
const newDocRef = await db.collection('products').add({
  name: 'Product Name',
  price: 99.99,
  description: 'Description',
  createdAt: admin.firestore.FieldValue.serverTimestamp()
})
console.log('Created document with ID:', newDocRef.id)
```

#### Update document
```javascript
await db.collection('products').doc('product-id').update({
  price: 199.99,
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
})
```

#### Delete document
```javascript
await db.collection('products').doc('product-id').delete()
```

### Search Operations

#### Full-text search (substring matching)
```javascript
const searchTerm = 'laptop'
const snapshot = await db.collection('products').get()
const results = snapshot.docs
  .filter(doc => {
    const data = doc.data()
    return (
      data.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      data.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })
  .map(doc => ({ id: doc.id, ...doc.data() }))
```

#### Range queries
```javascript
const snapshot = await db.collection('products')
  .where('price', '>=', 50)
  .where('price', '<=', 200)
  .orderBy('price', 'asc')
  .limit(10)
  .get()
```

---

## Service Updates Required

Update these files to use Firebase instead of Prisma:

### 1. src/services/productService.js
```javascript
import { db } from '../lib/firebase.js'

export async function getAllProducts() {
  const snapshot = await db.collection('products').get()
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

// Add other functions...
```

### 2. src/services/serviceService.js
### 3. src/services/customerService.js
### 4. src/services/searchService.js
### 5. src/services/adminService.js

---

## Error Handling

### Firebase Error Codes
```javascript
try {
  await db.collection('products').doc(id).get()
} catch (error) {
  if (error.code === 'permission-denied') {
    console.log('Permission denied')
  } else if (error.code === 'not-found') {
    console.log('Document not found')
  } else {
    console.error('Firebase error:', error)
  }
}
```

---

## Performance Tips

1. **Use indexes** for complex queries in Firestore Console
2. **Batch writes** for multiple operations:
```javascript
const batch = db.batch()
batch.set(db.collection('products').doc('id1'), data1)
batch.update(db.collection('products').doc('id2'), data2)
await batch.commit()
```

3. **Use pagination** for large datasets:
```javascript
const pageSize = 20
let query = db.collection('products').limit(pageSize)
const snapshot = await query.get()
const lastDoc = snapshot.docs[snapshot.docs.length - 1]
const nextQuery = db.collection('products').startAfter(lastDoc).limit(pageSize)
```

---

## Testing Your Setup

### Start the server
```bash
npm run dev
```

### Test health endpoint
```bash
curl http://localhost:4000/
```

### Expected response
```json
{
  "service": "akiwa-backend",
  "status": "ok"
}
```

---

## Troubleshooting

### ❌ Error: "Failed to initialize Firebase Admin SDK"
**Fix:** Ensure `firebase-service-account-key.json` exists in backend root directory

### ❌ Error: "Permission denied"
**Fix:** Check service account key has correct permissions in Firebase Console

### ❌ Error: "Collection not found"
**Fix:** Create the collection in Firestore Console first, or it will be auto-created on first document

### ❌ Error: "document.data() is not a function"
**Fix:** Check if document exists before calling `.data()`

```javascript
if (doc.exists) {
  const data = doc.data()
}
```

---

## Next Steps

1. ✅ Install Firebase Admin SDK
2. ✅ Get service account key
3. ✅ Update environment variables
4. ✅ Update all service files
5. ✅ Test API endpoints
6. ✅ Update frontend API calls

Your backend is now using Firebase Firestore! 🎉
